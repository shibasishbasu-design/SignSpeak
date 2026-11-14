import os
import json
from collections import Counter, defaultdict

import numpy as np

# ==========================================
# 1. PATHS AND CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "processed_data")

X_PATH = os.path.join(DATA_DIR, "X_sequences.npy")
Y_PATH = os.path.join(DATA_DIR, "y_labels.npy")
LABEL_PATH = os.path.join(DATA_DIR, "label_map.json")
METADATA_PATH = os.path.join(DATA_DIR, "sample_metadata.json")

EXPECTED_SIGNERS = {
    "YOU": 2,
    "FRIEND_1": 1,
    "FRIEND_2": 1,
    "FRIEND_3": 1
}

EXPECTED_SAMPLES_PER_CLASS = 5
EXPECTED_CLASSES = 21

# ==========================================
# 2. CHECK FILES
# ==========================================

print("\n========== DATASET AUDIT ==========\n")

required_files = [
    X_PATH,
    Y_PATH,
    LABEL_PATH,
    METADATA_PATH
]

for path in required_files:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing file: {path}")

print("All required dataset files found.")

# ==========================================
# 3. LOAD DATA
# ==========================================

X = np.load(X_PATH)
y = np.load(Y_PATH)

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    label_map = json.load(f)

with open(METADATA_PATH, "r", encoding="utf-8") as f:
    metadata = json.load(f)

print("\nDataset shapes:")
print("X:", X.shape)
print("y:", y.shape)
print("Metadata entries:", len(metadata))
print("Classes:", len(label_map))

# ==========================================
# 4. BASIC SHAPE CHECKS
# ==========================================

assert X.ndim == 3, "X must have 3 dimensions."
assert X.shape[1:] == (60, 126), (
    f"Unexpected sequence shape: {X.shape[1:]}"
)

assert len(X) == len(y), "X and y sample counts differ."
assert len(X) == len(metadata), "Metadata count differs from X."
assert len(label_map) == EXPECTED_CLASSES, "Unexpected class count."

print("\nBasic shape checks passed.")

# ==========================================
# 5. NUMERICAL DATA CHECKS
# ==========================================

print("\nChecking numerical values...")

if not np.isfinite(X).all():
    raise ValueError("X contains NaN or infinite values.")

if not np.issubdtype(y.dtype, np.integer):
    raise ValueError("Labels must be integers.")

if np.min(y) < 0 or np.max(y) >= len(label_map):
    raise ValueError("Some labels are outside the label map.")

print("No NaN or infinite values found.")
print("Label indices are valid.")

# ==========================================
# 6. CLASS DISTRIBUTION
# ==========================================

print("\nClass distribution:")

index_to_label = {
    int(index): label
    for label, index in label_map.items()
}

class_counts = Counter(y.tolist())

for index in sorted(index_to_label):
    label = index_to_label[index]
    count = class_counts.get(index, 0)

    print(f"{label:20s}: {count}")

    if count != EXPECTED_SAMPLES_PER_CLASS:
        raise ValueError(
            f"{label} has {count} samples, "
            f"expected {EXPECTED_SAMPLES_PER_CLASS}."
        )

# ==========================================
# 7. SIGNER DISTRIBUTION
# ==========================================

print("\nChecking signer distribution...")

signer_distribution = defaultdict(Counter)
known_signers = set(EXPECTED_SIGNERS.keys())

for i, item in enumerate(metadata):

    signer = item.get("signer_id")
    label = item.get("sign_label")

    if signer not in known_signers:
        raise ValueError(
            f"Sample {i} has unknown signer: {signer}"
        )

    if label not in label_map:
        raise ValueError(
            f"Sample {i} has unknown sign label: {label}"
        )

    expected_label_index = label_map[label]

    if int(y[i]) != int(expected_label_index):
        raise ValueError(
            f"Label mismatch at sample {i}: "
            f"metadata={label}, y={y[i]}"
        )

    signer_distribution[label][signer] += 1

for label in sorted(label_map.keys()):

    print(f"\n{label}:")

    actual = signer_distribution[label]

    for signer, expected_count in EXPECTED_SIGNERS.items():

        actual_count = actual.get(signer, 0)

        print(
            f"  {signer:10s}: "
            f"{actual_count} (expected {expected_count})"
        )

        if actual_count != expected_count:
            raise ValueError(
                f"Signer distribution mismatch for "
                f"{label} / {signer}"
            )

# ==========================================
# 8. DUPLICATE METADATA CHECK
# ==========================================

print("\nChecking duplicate video references...")

video_references = []

for item in metadata:
    video_references.append(
        (item["sign_label"], item["video_file"])
    )

if len(video_references) != len(set(video_references)):
    raise ValueError("Duplicate sign/video references found.")

print("No duplicate sign/video references found.")

# ==========================================
# 9. FINAL SUMMARY
# ==========================================

print("\n========== AUDIT SUCCESSFUL ==========")
print("Total samples:", len(X))
print("Total classes:", len(label_map))
print("Frames per sequence:", X.shape[1])
print("Features per frame:", X.shape[2])
print("All classes have five samples.")
print("All signer distributions are correct.")
print("All labels match metadata.")
print("All numerical values are valid.")
print("\nDataset is ready for the next experiment.")