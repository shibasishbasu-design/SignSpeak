import csv
from pathlib import Path

DATASET_DIR = Path("dataset")
CSV_FILE = Path("signer_mapping.csv")

video_extensions = {".mp4", ".mov", ".avi", ".mkv"}

rows = []

for sign_folder in sorted(DATASET_DIR.iterdir()):
    if not sign_folder.is_dir():
        continue

    videos = sorted(
        file for file in sign_folder.iterdir()
        if file.suffix.lower() in video_extensions
    )

    if len(videos) != 5:
        print(f"WARNING: {sign_folder.name} has {len(videos)} videos.")
        continue

    for index, video in enumerate(videos):
        if index < 2:
            signer = "YOU"
        else:
            signer = f"FRIEND_{index - 1}"

        rows.append({
            "sign_label": sign_folder.name,
            "video_filename": video.name,
            "signer_id": signer
        })

with CSV_FILE.open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["sign_label", "video_filename", "signer_id"]
    )
    writer.writeheader()
    writer.writerows(rows)

print("\nCSV mapping generated!")
print("Total entries:", len(rows))
print("Output:", CSV_FILE.resolve())