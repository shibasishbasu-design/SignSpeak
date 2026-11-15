import os
import json
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANDMARK_DIR = os.path.join(BASE_DIR, "landmark_data")

print("\n========== HAND ORDER AUDIT ==========\n")

for sign_name in sorted(os.listdir(LANDMARK_DIR)):

    sign_folder = os.path.join(LANDMARK_DIR, sign_name)

    if not os.path.isdir(sign_folder):
        continue

    files = [
        f for f in os.listdir(sign_folder)
        if f.endswith(".json")
    ]

    if not files:
        continue

    print(f"\nSIGN: {sign_name}")

    for filename in sorted(files):

        path = os.path.join(sign_folder, filename)

        with open(path, "r", encoding="utf-8") as file:
            frames = json.load(file)

        hand_counts = Counter()
        index_counts = Counter()

        for frame in frames:

            hands = frame.get("hands", [])

            hand_counts[len(hands)] += 1

            for hand in hands:
                index_counts[hand.get("hand_index", -1)] += 1

        print(
            f"{filename}: "
            f"frames={len(frames)}, "
            f"hand_counts={dict(hand_counts)}, "
            f"index_counts={dict(index_counts)}"
        )

print("\n========== AUDIT COMPLETED ==========")