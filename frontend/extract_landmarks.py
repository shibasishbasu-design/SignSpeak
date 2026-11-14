import cv2
import mediapipe as mp
import json
import os

# ---------------------------------
# 1. DATASET AND OUTPUT DIRECTORIES
# ---------------------------------

DATASET_DIR = "dataset"
OUTPUT_BASE_DIR = "landmark_data"

os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)

# ---------------------------------
# 2. INITIALIZE MEDIAPIPE
# ---------------------------------

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path="public/models/hand_landmarker.task"
    ),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3
)

# ---------------------------------
# 3. SUPPORTED VIDEO FORMATS
# ---------------------------------

VIDEO_EXTENSIONS = (".mp4", ".mov", ".avi", ".mkv")

total_videos = 0
successful_videos = 0
failed_videos = []

# ---------------------------------
# 4. PROCESS ALL SIGN FOLDERS
# ---------------------------------

video_timestamp_offset_ms = 0
with HandLandmarker.create_from_options(options) as landmarker:

    for sign_name in sorted(os.listdir(DATASET_DIR)):

        sign_folder = os.path.join(DATASET_DIR, sign_name)

        if not os.path.isdir(sign_folder):
            continue

        output_folder = os.path.join(
            OUTPUT_BASE_DIR, sign_name
        )

        os.makedirs(output_folder, exist_ok=True)

        videos = [
            name for name in sorted(os.listdir(sign_folder))
            if name.lower().endswith(VIDEO_EXTENSIONS)
        ]

        print(f"\nProcessing sign: {sign_name}")

        for video_name in videos:

            total_videos += 1

            video_path = os.path.join(
                sign_folder, video_name
            )

            output_name = os.path.splitext(video_name)[0] + ".json"

            output_file = os.path.join(
                output_folder, output_name
            )

            cap = cv2.VideoCapture(video_path)

            if not cap.isOpened():
                print(f"FAILED to open: {video_path}")
                failed_videos.append(video_path)
                continue

            fps = cap.get(cv2.CAP_PROP_FPS)

            if not fps or fps <= 0:
                fps = 30

            frame_number = 0
            all_landmarks = []

            try:
                while True:

                    success, frame = cap.read()

                    if not success:
                        break

                    frame_number += 1

                    rgb_frame = cv2.cvtColor(
                        frame, cv2.COLOR_BGR2RGB
                    )

                    mp_image = mp.Image(
                        image_format=mp.ImageFormat.SRGB,
                        data=rgb_frame
                    )

                    timestamp_ms = video_timestamp_offset_ms + int(
                        (frame_number - 1) * 1000 / fps
                    )

                    results = landmarker.detect_for_video(
                        mp_image, timestamp_ms
                    )

                    frame_data = {
                        "frame": frame_number,
                        "timestamp_ms": timestamp_ms,
                        "hands": []
                    }

                    if results.hand_landmarks:

                        for hand_index, hand in enumerate(
                            results.hand_landmarks
                        ):

                            points = []

                            for point in hand:
                                points.append({
                                    "x": point.x,
                                    "y": point.y,
                                    "z": point.z
                                })

                            frame_data["hands"].append({
                                "hand_index": hand_index,
                                "landmarks": points
                            })

                    all_landmarks.append(frame_data)

                with open(
                    output_file, "w", encoding="utf-8"
                ) as file:
                    json.dump(
                        all_landmarks, file, indent=2
                    )

                successful_videos += 1

                frames_with_hands = sum(
                    bool(frame["hands"])
                    for frame in all_landmarks
                )

                print(
                    f"SUCCESS: {video_name} | "
                    f"Frames: {frame_number} | "
                    f"Frames with hands: {frames_with_hands}"
                )

            except Exception as error:
                print(f"FAILED: {video_name} | {error}")
                failed_videos.append(video_path)

            finally:
                cap.release()
            
            video_timestamp_offset_ms += int(
                frame_number*1000 / fps
            ) + 1

# ---------------------------------
# 5. FINAL SUMMARY
# ---------------------------------

print("\n========== EXTRACTION SUMMARY ==========")
print("Total videos found:", total_videos)
print("Successfully processed:", successful_videos)
print("Failed videos:", len(failed_videos))

if failed_videos:
    print("\nVideos that need attention:")
    for video in failed_videos:
        print(video)

print("\nLandmark extraction finished!")