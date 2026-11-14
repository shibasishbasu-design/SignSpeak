import os
import json
import csv
import numpy as np
from collections import Counter

# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LANDMARK_DIR = os.path.join(BASE_DIR, "landmark_data")
OUTPUT_DIR = os.path.join(BASE_DIR, "processed_data")
MAPPING_FILE = os.path.join(BASE_DIR, "signer_mapping.csv")

SEQUENCE_LENGTH = 60

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ==========================================
# 2. LOAD SIGNER MAPPING
# ==========================================

if not os.path.isfile(MAPPING_FILE):
    raise FileNotFoundError("signer_mapping.csv not found.")

signer_mapping = {}

with open(MAPPING_FILE, "r", newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)

    required_columns = {
        "sign_label",
        "video_filename",
        "signer_id"
    }

    if not required_columns.issubset(reader.fieldnames or []):
        raise ValueError("CSV is missing required columns.")

    for row in reader:
        key = (
            row["sign_label"].strip(),
            row["video_filename"].strip()
        )

        signer_id = row["signer_id"].strip()

        if not signer_id:
            raise ValueError(f"Missing signer ID for {key}")

        if key in signer_mapping:
            raise ValueError(f"Duplicate CSV entry: {key}")

        signer_mapping[key] = signer_id

print("Signer mappings loaded:", len(signer_mapping))


# ==========================================
# 3. EXTRACT FEATURES FROM ONE FRAME
# ==========================================

def extract_frame_features(frame):

    features = np.zeros((2, 21, 3), dtype=np.float32)

    hands = frame.get("hands", [])

    for hand in hands[:2]:

        hand_index = hand.get("hand_index", 0)

        if hand_index not in [0, 1]:
            continue

        landmarks = hand.get("landmarks", [])

        if len(landmarks) != 21:
            continue

        for point_index, point in enumerate(landmarks):

            features[hand_index, point_index] = [
                point["x"],
                point["y"],
                point["z"]
            ]

    return features.flatten()


# ==========================================
# 4. RESIZE SEQUENCE
# ==========================================

def resize_sequence(sequence, target_length):

    sequence = np.asarray(sequence, dtype=np.float32)

    if len(sequence) == 0:
        return None

    if len(sequence) == target_length:
        return sequence

    old_positions = np.linspace(0, 1, len(sequence))
    new_positions = np.linspace(0, 1, target_length)

    resized = np.zeros(
        (target_length, sequence.shape[1]),
        dtype=np.float32
    )

    for feature_index in range(sequence.shape[1]):

        resized[:, feature_index] = np.interp(
            new_positions,
            old_positions,
            sequence[:, feature_index]
        )

    return resized


# ==========================================
# 5. PROCESS ALL SIGN FOLDERS
# ==========================================

X = []
y = []
metadata = []

sign_labels = []

total_files = 0
successful_files = 0
failed_files = 0
missing_mappings = []

print("\nPreparing all sign language sequences...\n")

if not os.path.isdir(LANDMARK_DIR):
    raise FileNotFoundError("landmark_data folder not found.")

for sign_name in sorted(os.listdir(LANDMARK_DIR)):

    sign_folder = os.path.join(LANDMARK_DIR, sign_name)

    if not os.path.isdir(sign_folder):
        continue

    json_files = sorted(
        f for f in os.listdir(sign_folder)
        if f.lower().endswith(".json")
    )

    if not json_files:
        continue

    print("\nProcessing sign:", sign_name)

    sign_labels.append(sign_name)

    for file_name in json_files:

        total_files += 1

        file_path = os.path.join(sign_folder, file_name)

        # JSON filename corresponds to original video filename.
        video_name = os.path.splitext(file_name)[0] + ".mp4"

        mapping_key = (sign_name, video_name)

        if mapping_key not in signer_mapping:
            missing_mappings.append(mapping_key)
            failed_files += 1
            print(f"MISSING SIGNER MAPPING: {mapping_key}")
            continue

        signer_id = signer_mapping[mapping_key]

        try:

            with open(file_path, "r", encoding="utf-8") as file:
                frames = json.load(file)

            if not isinstance(frames, list) or len(frames) == 0:
                raise ValueError("Empty or invalid frame data")

            frame_features = []

            for frame in frames:
                features = extract_frame_features(frame)
                frame_features.append(features)

            sequence = resize_sequence(
                frame_features,
                SEQUENCE_LENGTH
            )

            if sequence is None:
                raise ValueError("Could not prepare sequence")

            if sequence.shape != (SEQUENCE_LENGTH, 126):
                raise ValueError(
                    f"Unexpected sequence shape: {sequence.shape}"
                )

            X.append(sequence)
            y.append(sign_name)

            metadata.append({
                "video_file": video_name,
                "sign_label": sign_name,
                "signer_id": signer_id
            })

            successful_files += 1

            print(
                f"SUCCESS: {video_name} | "
                f"Signer: {signer_id} | "
                f"Frames: {len(frames)}"
            )

        except Exception as error:

            failed_files += 1
            print(f"FAILED: {file_name} | {error}")


# ==========================================
# 6. CHECK DATASET
# ==========================================

if missing_mappings:
    raise RuntimeError(
        f"{len(missing_mappings)} JSON files have no matching CSV entry. "
        "Correct the filename or sign label in signer_mapping.csv."
    )

if successful_files == 0:
    raise RuntimeError("No valid sequences were prepared.")

X = np.asarray(X, dtype=np.float32)
y = np.asarray(y)

label_to_index = {
    label: index
    for index, label in enumerate(sign_labels)
}

y_encoded = np.asarray(
    [label_to_index[label] for label in y],
    dtype=np.int64
)

class_counts = Counter(y.tolist())
signer_counts = Counter(
    item["signer_id"] for item in metadata
)


# ==========================================
# 7. SAVE DATASET
# ==========================================

np.save(
    os.path.join(OUTPUT_DIR, "X_sequences.npy"),
    X
)

np.save(
    os.path.join(OUTPUT_DIR, "y_labels.npy"),
    y_encoded
)

with open(
    os.path.join(OUTPUT_DIR, "label_map.json"),
    "w",
    encoding="utf-8"
) as file:

    json.dump(label_to_index, file, indent=4)

with open(
    os.path.join(OUTPUT_DIR, "sample_metadata.json"),
    "w",
    encoding="utf-8"
) as file:

    json.dump(metadata, file, indent=4)


# ==========================================
# 8. FINAL SUMMARY
# ==========================================

print("\n========== DATASET PREPARATION SUMMARY ==========")

print("Total JSON files:", total_files)
print("Successfully prepared:", successful_files)
print("Failed files:", failed_files)

print("Number of sign classes:", len(sign_labels))
print("Sequence length:", SEQUENCE_LENGTH)
print("Features per frame:", X.shape[2])

print("Final X shape:", X.shape)
print("Final y shape:", y_encoded.shape)

print("\nVideos per sign:")

for label in sign_labels:
    print(f"{label}: {class_counts[label]}")

print("\nVideos per signer:")

for signer, count in sorted(signer_counts.items()):
    print(f"{signer}: {count}")

print("\nSaved files:")
print("X_sequences.npy")
print("y_labels.npy")
print("label_map.json")
print("sample_metadata.json")

print("\nDATASET PREPARATION COMPLETED!")