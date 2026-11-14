import os
import json

# Folder containing extracted landmark JSON files
BASE_DIR = "landmark_data"

total_videos = 0
total_frames = 0
frames_with_hands = 0
frames_without_hands = 0
one_hand_frames = 0
two_hand_frames = 0
invalid_frames = 0
invalid_hands = 0
timestamp_errors = 0

print("\n========== SIGNSPEAK DATASET CHECK ==========\n")

for sign_name in sorted(os.listdir(BASE_DIR)):

    sign_folder = os.path.join(BASE_DIR, sign_name)

    if not os.path.isdir(sign_folder):
        continue

    print(f"\nSIGN: {sign_name}")

    for file_name in sorted(os.listdir(sign_folder)):

        if not file_name.endswith(".json"):
            continue

        file_path = os.path.join(sign_folder, file_name)
        total_videos += 1

        try:
            with open(file_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            video_frames = len(data)
            video_with_hands = 0
            video_without_hands = 0
            previous_timestamp = -1
            video_timestamp_errors = 0

            for frame in data:

                total_frames += 1

                if not isinstance(frame, dict):
                    invalid_frames += 1
                    continue

                timestamp = frame.get("timestamp_ms")
                hands = frame.get("hands")

                if not isinstance(timestamp, (int, float)):
                    invalid_frames += 1
                    continue

                if timestamp <= previous_timestamp:
                    timestamp_errors += 1
                    video_timestamp_errors += 1

                previous_timestamp = timestamp

                if not isinstance(hands, list):
                    invalid_frames += 1
                    continue

                if len(hands) == 0:
                    frames_without_hands += 1
                    video_without_hands += 1

                else:
                    frames_with_hands += 1
                    video_with_hands += 1

                    if len(hands) == 1:
                        one_hand_frames += 1

                    elif len(hands) == 2:
                        two_hand_frames += 1

                    for hand in hands:
                        landmarks = hand.get("landmarks", [])

                        if len(landmarks) != 21:
                            invalid_hands += 1

                        for point in landmarks:
                            if not all(
                                key in point for key in ("x", "y", "z")
                            ):
                                invalid_hands += 1
                                break

            print(
                f"  {file_name}: "
                f"{video_frames} frames | "
                f"Hands: {video_with_hands} | "
                f"No hands: {video_without_hands} | "
                f"Timestamp errors: {video_timestamp_errors}"
            )

        except Exception as error:
            print(f"  ERROR: {file_name} | {error}")
            invalid_frames += 1

print("\n========== FINAL DATASET SUMMARY ==========")

print(f"Total videos: {total_videos}")
print(f"Total frames: {total_frames}")
print(f"Frames with hands: {frames_with_hands}")
print(f"Frames without hands: {frames_without_hands}")
print(f"Frames with one hand: {one_hand_frames}")
print(f"Frames with two hands: {two_hand_frames}")
print(f"Invalid frames: {invalid_frames}")
print(f"Invalid hands/landmarks: {invalid_hands}")
print(f"Timestamp errors: {timestamp_errors}")

print("\n========== CHECK COMPLETED ==========")