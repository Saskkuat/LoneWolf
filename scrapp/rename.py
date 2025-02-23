import os

# Folder path
FOLDER_PATH = r"C:/Callisto/LoneWolf/public/01fftd/audios/br"

# Process each file in the folder
for file_name in os.listdir(FOLDER_PATH):
    old_path = os.path.join(FOLDER_PATH, file_name)
    
    # Ensure it's a file and has at least 2 characters to remove
    if os.path.isfile(old_path) and len(file_name) > 2:
        new_name = file_name[2:]  # Remove the first two characters
        new_path = os.path.join(FOLDER_PATH, new_name)
        
        # Rename the file
        os.rename(old_path, new_path)
        print(f"Renamed: {file_name} -> {new_name}")

print("✅ Renaming process completed!")
