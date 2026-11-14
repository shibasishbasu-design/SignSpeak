import os
import json
import time
import numpy as np
import joblib
from sklearn.svm import SVC

# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "processed_data")
MODEL_DIR = os.path.join(BASE_DIR, "trained_model")

os.makedirs(MODEL_DIR, exist_ok=True)

EXPECTED_SHAPE = (60, 126)
FINAL_C = 0.1

# ==========================================
# 2. LOAD ALL 105 SAMPLES
# ==========================================

print("\n========== FINAL DTW + SVM TRAINING ==========")

X = np.load(os.path.join(DATA_DIR, "X_sequences.npy"))
y = np.load(os.path.join(DATA_DIR, "y_labels.npy"))

with open(os.path.join(DATA_DIR, "label_map.json"), "r") as f:
    label_map = json.load(f)

if X.ndim != 3 or X.shape[1:] != EXPECTED_SHAPE:
    raise ValueError(f"Unexpected dataset shape: {X.shape}")

if len(X) != len(y):
    raise ValueError("X and y have different lengths.")

if len(X) != 105:
    raise ValueError(f"Expected 105 samples, found {len(X)}.")

if len(np.unique(y)) != 21:
    raise ValueError("Expected exactly 21 sign classes.")

if not np.isfinite(X).all():
    raise ValueError("Dataset contains NaN or infinite values.")

print("Dataset:", X.shape)
print("Sign classes:", len(label_map))
print("Training samples:", len(X))

# ==========================================
# 3. DTW DISTANCE
# ==========================================

def dtw_distance(sequence_a, sequence_b):

    n = len(sequence_a)
    m = len(sequence_b)

    previous = np.full(m + 1, np.inf)
    previous[0] = 0.0

    for i in range(1, n + 1):

        current = np.full(m + 1, np.inf)

        for j in range(1, m + 1):

            cost = np.linalg.norm(
                sequence_a[i - 1] - sequence_b[j - 1]
            )

            current[j] = cost + min(
                previous[j],
                current[j - 1],
                previous[j - 1]
            )

        previous = current

    return previous[m] / (n + m)


# ==========================================
# 4. CALCULATE ALL TRAINING DISTANCES
# ==========================================

print("\nCalculating DTW distances between all samples...")
print("This may take some time. Please do not stop the process.")

start_time = time.time()

number_of_samples = len(X)

D_train = np.zeros(
    (number_of_samples, number_of_samples),
    dtype=np.float64
)

for i in range(number_of_samples):

    for j in range(i, number_of_samples):

        distance = dtw_distance(X[i], X[j])

        D_train[i, j] = distance
        D_train[j, i] = distance

    print(
        f"Processed {i + 1}/{number_of_samples} samples",
        flush=True
    )

print("\nDTW distance calculation completed.")

# ==========================================
# 5. CREATE DTW KERNEL
# ==========================================

positive_distances = D_train[D_train > 0]

if len(positive_distances) == 0:
    raise ValueError("All DTW distances are zero.")

gamma = 1.0 / np.median(positive_distances)

K_train = np.exp(-gamma * np.square(D_train))

print("Gamma:", gamma)

# ==========================================
# 6. TRAIN FINAL SVM ON ALL 105 SAMPLES
# ==========================================

print("\nTraining final SVM on all 105 samples...")

final_classifier = SVC(
    C=FINAL_C,
    kernel="precomputed",
    class_weight="balanced"
)

final_classifier.fit(K_train, y)

print("Final SVM training completed.")

# ==========================================
# 7. SAVE FINAL MODEL
# ==========================================

final_model = {
    "model_name": "DTW + SVM",
    "classifier": final_classifier,
    "reference_sequences": X,
    "gamma": float(gamma),
    "C": FINAL_C,
    "label_map": label_map,
    "sequence_length": 60,
    "features_per_frame": 126,
    "training_samples": len(X),
    "classes": len(label_map)
}

model_path = os.path.join(
    MODEL_DIR,
    "final_dtw_svm_model.joblib"
)

joblib.dump(final_model, model_path)

# ==========================================
# 8. SAVE TRAINING INFORMATION
# ==========================================

training_info = {
    "model": "DTW + SVM",
    "final_model_trained": True,
    "training_samples": len(X),
    "classes": len(label_map),
    "selected_C": FINAL_C,
    "gamma": float(gamma),
    "sequence_length": 60,
    "features_per_frame": 126,
    "training_duration_seconds": round(
        time.time() - start_time, 2
    ),
    "model_file": "final_dtw_svm_model.joblib",
    "evaluation_test_accuracy": 0.5238095238095238,
    "evaluation_test_samples": 21
}

info_path = os.path.join(
    MODEL_DIR,
    "final_dtw_svm_training_info.json"
)

with open(info_path, "w") as f:
    json.dump(training_info, f, indent=4)

print("\n========================================")
print("FINAL DTW + SVM TRAINING COMPLETED")
print("========================================")
print("Samples used:", len(X))
print("Classes:", len(label_map))
print("Model saved:", model_path)
print("Training information saved:", info_path)
print("========================================")