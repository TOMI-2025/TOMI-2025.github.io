from pydub import AudioSegment
import os

src = "/Users/heki/Documents/Papers/audio_dataset_wav/Random"
target = "/Users/heki/Documents/Papers/eTOMIC-2025.github.io/audio/random"
for pat in os.listdir(src):
    pat_dir = os.path.join(src, pat)
    if not os.path.isdir(pat_dir):
        continue
    target_pat_dir = os.path.join(target, pat)
    os.makedirs(target_pat_dir, exist_ok=True)
    for file in os.listdir(pat_dir):
        file_path = os.path.join(pat_dir, file)
        if not file.endswith(".wav"):
            continue
        audio = AudioSegment.from_wav(file_path)
        audio.export(os.path.join(target_pat_dir, file.replace(".wav", ".mp3").replace("random_", "")), format="mp3")

# for pat in os.listdir(target):
#     pat_dir = os.path.join(target, pat)
#     if not os.path.isdir(pat_dir):
#         continue
#     for file in os.listdir(pat_dir):
#         old_file = os.path.join(pat_dir, file)
#         new_file = os.path.join(pat_dir, file.replace("musenode_", ""))
#         os.rename(old_file, new_file)

# | <audio controls><source src="audio/pattern1/pattern1_C_1.mp3" type="audio/mpeg"></audio> | <audio controls><source src="audio/pattern2/pattern2_C_1.mp3" type="audio/mpeg"></audio> | <audio controls><source src="audio/pattern3/pattern3_C_1.mp3" type="audio/mpeg"></audio> | <audio controls><source src="audio/pattern4/pattern4_C_1.mp3" type="audio/mpeg"></audio> |
# for key in ("C", "F", "G", "A#"):
#     for ind in (1, 2):
#         s = []
#         for pat in ("pattern1", "pattern2", "pattern3", "pattern4"):
#             s.append(f'<audio controls><source src="audio/{pat}/{pat}_{key}_{ind}.mp3" type="audio/mpeg"></audio>')
#         s = f"|{'|'.join(s)}|"
#         print(s)