import os
import json
import random
import numpy as np
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "processed_data")
MODEL_DIR = os.path.join(BASE_DIR, "trained_model")

os.makedirs(MODEL_DIR, exist_ok=True)

SEED = 42
EPOCHS = 100
BATCH_SIZE = 8

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

# ==========================================
# 2. LOAD DATA
# ==========================================

print("\nLoading dataset...")

X = np.load(os.path.join(DATA_DIR, "X_sequences.npy"))
y = np.load(os.path.join(DATA_DIR, "y_labels.npy"))

with open(os.path.join(DATA_DIR, "label_map.json"), "r") as f:
    label_map = json.load(f)

with open(os.path.join(DATA_DIR, "sample_metadata.json"), "r") as f:
    metadata = json.load(f)

index_to_label = {
    int(index): label
    for label, index in label_map.items()
}

number_of_classes = len(label_map)

if X.shape != (105, 60, 126):
    raise ValueError(f"Unexpected X shape: {X.shape}")

if len(X) != len(y) or len(X) != len(metadata):
    raise ValueError("Dataset and metadata lengths do not match.")

if any(item["signer_id"] == "UNKNOWN" for item in metadata):
    raise ValueError("Some signer IDs are still UNKNOWN.")

# ==========================================
# 3. SIGNER-AWARE TEST SPLIT
# ==========================================

print("\nCreating signer-aware split...")

train_pool = []
test_indices = []

for i, item in enumerate(metadata):

    signer = item["signer_id"]

    if signer in ["YOU", "FRIEND_1", "FRIEND_2"]:
        train_pool.append(i)

    elif signer == "FRIEND_3":
        test_indices.append(i)

    else:
        raise ValueError(f"Unexpected signer: {signer}")

train_pool = np.array(train_pool)
test_indices = np.array(test_indices)

# Friend 3 remains completely unseen during training.
X_pool = X[train_pool]
y_pool = y[train_pool]

X_test = X[test_indices]
y_test = y[test_indices]

# Split the remaining signers into training and validation.
train_indices, val_indices = train_test_split(
    np.arange(len(X_pool)),
    test_size=0.25,
    random_state=SEED,
    stratify=y_pool
)

X_train = X_pool[train_indices]
y_train = y_pool[train_indices]

X_val = X_pool[val_indices]
y_val = y_pool[val_indices]

print("\nDataset split:")
print("Training samples:", len(X_train))
print("Validation samples:", len(X_val))
print("Unseen test samples:", len(X_test))

for name, labels in [
    ("Training", y_train),
    ("Validation", y_val),
    ("Testing", y_test)
]:
    if len(np.unique(labels)) != number_of_classes:
        raise ValueError(f"{name} split is missing classes.")

print("\nTraining signers: YOU, FRIEND_1, FRIEND_2")
print("Validation signers: Mixed from training signers")
print("Unseen test signer: FRIEND_3")

# ==========================================
# 4. BUILD A SMALLER MODEL
# ==========================================

print("\nBuilding a smaller GRU model...")

model = tf.keras.Sequential([

    tf.keras.layers.Input(shape=(60, 126)),

    tf.keras.layers.GRU(
        48,
        return_sequences=True,
        dropout=0.25,
        recurrent_dropout=0.0
    ),

    tf.keras.layers.GRU(
        24,
        dropout=0.25,
        recurrent_dropout=0.0
    ),

    tf.keras.layers.Dense(
        32,
        activation="relu",
        kernel_regularizer=tf.keras.regularizers.l2(0.002)
    ),

    tf.keras.layers.Dropout(0.4),

    tf.keras.layers.Dense(
        number_of_classes,
        activation="softmax"
    )
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.0005
    ),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ==========================================
# 5. CALLBACKS
# ==========================================

best_model_path = os.path.join(
    MODEL_DIR,
    "best_sign_model.keras"
)

callbacks = [

    tf.keras.callbacks.ModelCheckpoint(
        best_model_path,
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    ),

    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=18,
        restore_best_weights=True,
        verbose=1
    ),

    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=6,
        min_lr=0.00001,
        verbose=1
    )
]

# ==========================================
# 6. TRAIN
# ==========================================

print("\nStarting improved training...\n")

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks,
    shuffle=True,
    verbose=1
)

# ==========================================
# 7. EVALUATE UNSEEN SIGNER
# ==========================================

print("\nEvaluating on completely unseen signer FRIEND_3...")

best_model = tf.keras.models.load_model(best_model_path)

test_loss, test_accuracy = best_model.evaluate(
    X_test,
    y_test,
    verbose=0
)

predictions = best_model.predict(X_test, verbose=0)
predicted_labels = np.argmax(predictions, axis=1)

all_class_indices = list(range(number_of_classes))

target_names = [
    index_to_label[i] for i in all_class_indices
]

print("\n========== UNSEEN SIGNER TEST RESULTS ==========")
print(f"Test loss: {test_loss:.4f}")
print(f"Test accuracy: {test_accuracy * 100:.2f}%")

print("\nClassification report:")

print(classification_report(
    y_test,
    predicted_labels,
    labels=all_class_indices,
    target_names=target_names,
    zero_division=0
))

print("\nConfusion matrix:")

print(confusion_matrix(
    y_test,
    predicted_labels,
    labels=all_class_indices
))

# ==========================================
# 8. SAVE MODEL AND RESULTS
# ==========================================

final_model_path = os.path.join(
    MODEL_DIR,
    "sign_model.keras"
)

best_model.save(final_model_path)

with open(
    os.path.join(MODEL_DIR, "label_map.json"),
    "w",
    encoding="utf-8"
) as f:
    json.dump(label_map, f, indent=4)

results = {
    "test_accuracy": float(test_accuracy),
    "test_loss": float(test_loss),
    "training_samples": len(X_train),
    "validation_samples": len(X_val),
    "test_samples": len(X_test),
    "training_signers": ["YOU", "FRIEND_1", "FRIEND_2"],
    "test_signer": "FRIEND_3",
    "epochs_completed": len(history.history["loss"]),
    "best_validation_accuracy": float(
        max(history.history["val_accuracy"])
    )
}

with open(
    os.path.join(MODEL_DIR, "training_results.json"),
    "w",
    encoding="utf-8"
) as f:
    json.dump(results, f, indent=4)

print("\n========== TRAINING COMPLETED ==========")
print("Final model:", final_model_path)
print("Best model:", best_model_path)
print("Training results saved.")