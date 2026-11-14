import os
import json
import numpy as np

from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "processed_data")
MODEL_DIR = os.path.join(BASE_DIR, "trained_model")

os.makedirs(MODEL_DIR, exist_ok=True)

C_VALUES = [0.1, 1, 10, 100]
EXPECTED_SHAPE = (60, 126)

# ==========================================
# 2. LOAD DATA
# ==========================================

print("\n========== DTW + SVM EXPERIMENT ==========")

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

if X.ndim != 3 or X.shape[1:] != EXPECTED_SHAPE:
    raise ValueError(
        f"Unexpected dataset shape: {X.shape}. "
        f"Expected (samples, 60, 126)."
    )

if len(X) != len(y) or len(X) != len(metadata):
    raise ValueError("X, y, and metadata have different lengths.")

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

if len(X_train) == 0 or len(X_val) == 0 or len(X_test) == 0:
    raise ValueError("One or more dataset splits are empty.")

# ==========================================
# 4. DTW DISTANCE FUNCTION
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
# 5. CALCULATE DTW DISTANCE MATRICES
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
# 6. CONVERT DISTANCES INTO AN SVM KERNEL
# ==========================================

print("\nCreating DTW-based SVM kernel...")

# A Gaussian/RBF-style kernel built from DTW distances.
# Gamma is selected using training distances only.

positive_distances = D_train[D_train > 0]

if len(positive_distances) == 0:
    raise ValueError("All training DTW distances are zero.")

gamma = 1.0 / np.median(positive_distances)

def distance_to_kernel(distance_matrix):

    return np.exp(-gamma * np.square(distance_matrix))


K_train = distance_to_kernel(D_train)
K_val = distance_to_kernel(D_val)

print("DTW kernel created.")
print("Gamma:", gamma)

# ==========================================
# 7. SELECT BEST C USING VALIDATION
# ==========================================

print("\nSelecting best SVM C using validation data...")

best_c = None
best_accuracy = -1
best_classifier = None

for c_value in C_VALUES:

    classifier = SVC(
        C=c_value,
        kernel="precomputed",
        class_weight="balanced"
    )

    classifier.fit(K_train, y_train)

    val_predictions = classifier.predict(K_val)

    val_accuracy = accuracy_score(
        y_val,
        val_predictions
    )

    print(
        f"C={c_value} | Validation accuracy: "
        f"{val_accuracy * 100:.2f}%"
    )

    if val_accuracy > best_accuracy:

        best_accuracy = val_accuracy
        best_c = c_value
        best_classifier = classifier

print("\nSelected C:", best_c)
print(
    "Best validation accuracy:",
    f"{best_accuracy * 100:.2f}%"
)

# ==========================================
# 8. FINAL TEST ON UNSEEN SIGNER
# ==========================================

print("\nCalculating test distances...")

D_test = calculate_distance_matrix(X_test, X_train)
K_test = distance_to_kernel(D_test)

test_predictions = best_classifier.predict(K_test)

test_accuracy = accuracy_score(
    y_test,
    test_predictions
)

print("\n========== DTW + SVM TEST RESULTS ==========")

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
    "model": "DTW + SVM",
    "selected_C": float(best_c),
    "gamma": float(gamma),
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
    "dtw_svm_results.json"
)

with open(results_path, "w") as f:
    json.dump(results, f, indent=4)

print("\nResults saved to:", results_path)
print("\n========== DTW + SVM COMPLETED ==========")