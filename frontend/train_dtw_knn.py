import os
import json
import numpy as np

from collections import Counter
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "processed_data")
MODEL_DIR = os.path.join(BASE_DIR, "trained_model")

os.makedirs(MODEL_DIR, exist_ok=True)

K_VALUES = [1, 3, 5]
EXPECTED_SHAPE = (60, 126)

# ==========================================
# 2. LOAD DATA
# ==========================================

print("\n========== DTW + KNN EXPERIMENT ==========")

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

print("\nDataset:", X.shape)
print("Classes:", len(label_map))

# ==========================================
# 3. SIGNER-AWARE SPLIT
# ==========================================

train_signers = ["YOU", "FRIEND_1"]
validation_signers = ["FRIEND_2"]
test_signers = ["FRIEND_3"]

train_indices = []
val_indices = []
test_indices = []

for i, item in enumerate(metadata):

    signer = item["signer_id"]

    if signer in train_signers:
        train_indices.append(i)

    elif signer in validation_signers:
        val_indices.append(i)

    elif signer in test_signers:
        test_indices.append(i)

    else:
        raise ValueError(f"Unknown signer: {signer}")

X_train = X[train_indices]
y_train = y[train_indices]

X_val = X[val_indices]
y_val = y[val_indices]

X_test = X[test_indices]
y_test = y[test_indices]

print("\nTraining samples:", len(X_train))
print("Validation samples:", len(X_val))
print("Testing samples:", len(X_test))

# ==========================================
# 4. FEATURE NORMALIZATION
# ==========================================

print("\nNormalizing landmark coordinates...")

scaler = StandardScaler()

X_train_flat = X_train.reshape(len(X_train), -1)
X_val_flat = X_val.reshape(len(X_val), -1)
X_test_flat = X_test.reshape(len(X_test), -1)

scaler.fit(X_train_flat)

X_train_scaled = scaler.transform(X_train_flat)
X_val_scaled = scaler.transform(X_val_flat)
X_test_scaled = scaler.transform(X_test_flat)

# ==========================================
# 5. DTW DISTANCE FUNCTION
# ==========================================

def dtw_distance(sequence_a, sequence_b):

    sequence_a = sequence_a.reshape(60, 126)
    sequence_b = sequence_b.reshape(60, 126)

    n = len(sequence_a)
    m = len(sequence_b)

    dtw = np.full((n + 1, m + 1), np.inf)
    dtw[0, 0] = 0.0

    for i in range(1, n + 1):

        for j in range(1, m + 1):

            cost = np.linalg.norm(
                sequence_a[i - 1] - sequence_b[j - 1]
            )

            dtw[i, j] = cost + min(
                dtw[i - 1, j],
                dtw[i, j - 1],
                dtw[i - 1, j - 1]
            )

    return dtw[n, m] / (n + m)

# ==========================================
# 6. CALCULATE DTW DISTANCES
# ==========================================

print("\nCalculating DTW distances...")

def calculate_distance_matrix(A, B):

    distances = np.zeros((len(A), len(B)))

    for i in range(len(A)):

        for j in range(len(B)):

            distances[i, j] = dtw_distance(A[i], B[j])

        print(
            f"Processed {i + 1}/{len(A)} sequences",
            end="\r"
        )

    print()
    return distances


D_train = calculate_distance_matrix(X_train, X_train)
D_val = calculate_distance_matrix(X_val, X_train)

# ==========================================
# 7. SELECT BEST K USING VALIDATION
# ==========================================

print("\nSelecting best K using validation data...")

best_k = None
best_accuracy = -1
best_classifier = None

for k in K_VALUES:

    if k > len(X_train):
        continue

    classifier = KNeighborsClassifier(
        n_neighbors=k,
        metric="precomputed",
        weights="distance"
    )

    classifier.fit(D_train, y_train)

    val_predictions = classifier.predict(D_val)

    val_accuracy = accuracy_score(
        y_val,
        val_predictions
    )

    print(
        f"K={k} | Validation accuracy: "
        f"{val_accuracy * 100:.2f}%"
    )

    if val_accuracy > best_accuracy:

        best_accuracy = val_accuracy
        best_k = k
        best_classifier = classifier

print("\nSelected K:", best_k)
print(
    "Best validation accuracy:",
    f"{best_accuracy * 100:.2f}%"
)

# ==========================================
# 8. FINAL TEST ON UNSEEN SIGNER
# ==========================================

print("\nCalculating test distances...")

D_test = calculate_distance_matrix(X_test, X_train)

test_predictions = best_classifier.predict(D_test)

test_accuracy = accuracy_score(
    y_test,
    test_predictions
)

print("\n========== DTW + KNN TEST RESULTS ==========")

print(f"Test accuracy: {test_accuracy * 100:.2f}%")

print("\nClassification report:")

class_indices = list(range(len(label_map)))

print(classification_report(
    y_test,
    test_predictions,
    labels=class_indices,
    target_names=[
        index_to_label[i] for i in class_indices
    ],
    zero_division=0
))

print("\nConfusion matrix:")

print(confusion_matrix(
    y_test,
    test_predictions,
    labels=class_indices
))

# ==========================================
# 9. SAVE EXPERIMENT RESULTS
# ==========================================

results = {
    "model": "DTW + KNN",
    "selected_k": int(best_k),
    "validation_accuracy": float(best_accuracy),
    "test_accuracy": float(test_accuracy),
    "training_samples": len(X_train),
    "validation_samples": len(X_val),
    "test_samples": len(X_test),
    "training_signers": train_signers,
    "validation_signers": validation_signers,
    "test_signers": test_signers
}

results_path = os.path.join(
    MODEL_DIR,
    "dtw_knn_results.json"
)

with open(results_path, "w") as f:
    json.dump(results, f, indent=4)

print("\nResults saved to:", results_path)
print("\n========== DTW + KNN COMPLETED ==========")