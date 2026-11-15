import cv2
import mediapipe as mp
import json
import os


# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(BASE_DIR, "dataset")

OUTPUT_BASE_DIR = os.path.join(BASE_DIR, "landmark_data")

MODEL_PATH = os.path.join(
    BASE_DIR,
    "public",
    "models",
    "hand_landmarker.task"
)

os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)


# ==========================================
# 2. CHECK REQUIRED FILES AND FOLDERS
# ==========================================

if not os.path.isdir(DATASET_DIR):
    raise FileNotFoundError(
        f"Dataset folder not found: {DATASET_DIR}"
    )

if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(
        f"MediaPipe model not found: {MODEL_PATH}"
    )


# ==========================================
# 3. INITIALIZE MEDIAPIPE
# ==========================================

BaseOptions = mp.tasks.BaseOptions

HandLandmarker = mp.tasks.vision.HandLandmarker

HandLandmarkerOptions = (
    mp.tasks.vision.HandLandmarkerOptions
)

VisionRunningMode = mp.tasks.vision.RunningMode


options = HandLandmarkerOptions(

    base_options=BaseOptions(
        model_asset_path=MODEL_PATH
    ),

    running_mode=VisionRunningMode.VIDEO,

    num_hands=2,

    min_hand_detection_confidence=0.3,

    min_hand_presence_confidence=0.3,

    min_tracking_confidence=0.3

)


# ==========================================
# 4. SUPPORTED VIDEO FORMATS
# ==========================================

VIDEO_EXTENSIONS = (
    ".mp4",
    ".mov",
    ".avi",
    ".mkv"
)


# ==========================================
# 5. EXTRACTION COUNTERS
# ==========================================

total_videos = 0

successful_videos = 0

failed_videos = []

video_timestamp_offset_ms = 0


# ==========================================
# 6. PROCESS ALL SIGN FOLDERS
# ==========================================

with HandLandmarker.create_from_options(options) as landmarker:

    for sign_name in sorted(os.listdir(DATASET_DIR)):

        sign_folder = os.path.join(
            DATASET_DIR,
            sign_name
        )

        if not os.path.isdir(sign_folder):
            continue


        output_folder = os.path.join(
            OUTPUT_BASE_DIR,
            sign_name
        )

        os.makedirs(
            output_folder,
            exist_ok=True
        )


        videos = [

            name

            for name in sorted(os.listdir(sign_folder))

            if name.lower().endswith(VIDEO_EXTENSIONS)

        ]


        if not videos:
            continue


        print("\n========================================")

        print("PROCESSING SIGN:", sign_name)

        print("========================================")


        # ==================================
        # 7. PROCESS EACH VIDEO
        # ==================================

        for video_name in videos:

            total_videos += 1

            video_path = os.path.join(
                sign_folder,
                video_name
            )


            output_name = (
                os.path.splitext(video_name)[0] + ".json"
            )


            output_file = os.path.join(
                output_folder,
                output_name
            )


            cap = cv2.VideoCapture(video_path)


            if not cap.isOpened():

                print(
                    "FAILED TO OPEN:",
                    video_path
                )

                failed_videos.append(video_path)

                continue


            fps = cap.get(cv2.CAP_PROP_FPS)


            if not fps or fps <= 0:
                fps = 30


            frame_number = 0

            all_landmarks = []

            frames_with_hands = 0

            left_hand_frames = 0

            right_hand_frames = 0

            unknown_hand_frames = 0


            try:

                # ==============================
                # 8. READ VIDEO FRAME BY FRAME
                # ==============================

                while True:

                    success, frame = cap.read()


                    if not success:
                        break


                    frame_number += 1


                    rgb_frame = cv2.cvtColor(
                        frame,
                        cv2.COLOR_BGR2RGB
                    )


                    mp_image = mp.Image(

                        image_format=mp.ImageFormat.SRGB,

                        data=rgb_frame

                    )


                    timestamp_ms = (

                        video_timestamp_offset_ms

                        + int(
                            (frame_number - 1) * 1000 / fps
                        )

                    )


                    results = landmarker.detect_for_video(

                        mp_image,

                        timestamp_ms

                    )


                    # ==============================
                    # 9. CREATE FRAME DATA
                    # ==============================

                    frame_data = {

                        "frame": frame_number,

                        "timestamp_ms": timestamp_ms,

                        "hands": []

                    }


                    # ==============================
                    # 10. EXTRACT HAND LANDMARKS
                    # ==============================

                    if results.hand_landmarks:

                        frames_with_hands += 1


                        for hand_index, hand in enumerate(
                            results.hand_landmarks
                        ):

                            # ----------------------
                            # Extract 21 landmarks
                            # ----------------------

                            points = []


                            for point in hand:

                                points.append({

                                    "x": point.x,

                                    "y": point.y,

                                    "z": point.z

                                })


                            # ----------------------
                            # Extract handedness
                            # ----------------------

                            handedness = "Unknown"


                            if (

                                results.handedness

                                and hand_index < len(
                                    results.handedness
                                )

                                and results.handedness[
                                    hand_index
                                ]

                            ):

                                handedness = (

                                    results.handedness[
                                        hand_index
                                    ][0].category_name

                                )


                            # ----------------------
                            # Count handedness
                            # ----------------------

                            if handedness == "Left":

                                left_hand_frames += 1

                            elif handedness == "Right":

                                right_hand_frames += 1

                            else:

                                unknown_hand_frames += 1


                            # ----------------------
                            # Save hand information
                            # ----------------------

                            frame_data["hands"].append({

                                "hand_index": hand_index,

                                "handedness": handedness,

                                "landmarks": points

                            })


                    # ==============================
                    # 11. SAVE FRAME DATA
                    # ==============================

                    all_landmarks.append(frame_data)


                # ==================================
                # 12. SAVE VIDEO LANDMARKS AS JSON
                # ==================================

                with open(

                    output_file,

                    "w",

                    encoding="utf-8"

                ) as file:

                    json.dump(

                        all_landmarks,

                        file,

                        indent=2

                    )


                successful_videos += 1


                # ==================================
                # 13. VIDEO PROCESSING SUMMARY
                # ==================================

                print("\nSUCCESS:", video_name)

                print("Total frames:", frame_number)

                print(
                    "Frames with hands:",
                    frames_with_hands
                )

                print(
                    "Left hand detections:",
                    left_hand_frames
                )

                print(
                    "Right hand detections:",
                    right_hand_frames
                )

                print(
                    "Unknown hand detections:",
                    unknown_hand_frames
                )

                print(
                    "Saved JSON:",
                    output_file
                )


            except Exception as error:

                print(
                    "\nFAILED:",
                    video_name,
                    "|",
                    error
                )

                failed_videos.append(video_path)


            finally:

                cap.release()


            # Keep timestamps increasing between videos.

            video_timestamp_offset_ms += (

                int(frame_number * 1000 / fps) + 1

            )


# ==========================================
# 14. FINAL EXTRACTION SUMMARY
# ==========================================

print("\n")

print("==========================================")

print("LANDMARK EXTRACTION SUMMARY")

print("==========================================")

print("Total videos found:", total_videos)

print("Successfully processed:", successful_videos)

print("Failed videos:", len(failed_videos))


if failed_videos:

    print("\nVideos requiring attention:")

    for video in failed_videos:

        print(video)


print("\nLandmark extraction completed!")

print("Handedness information has been saved.")

print("==========================================")