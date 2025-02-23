import os
import re

def find_html_files_with_classes(folder_path, classes):
    matching_files = []
    class_pattern = re.compile(r'class=["\']([^"\']*\b(?:' + '|'.join(classes) + r')\b[^"\']*)["\']')
    
    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()
                if class_pattern.search(content):
                    matching_files.append(filename)
    
    return matching_files

if __name__ == "__main__":
    folder_path = "C:/Callisto/LoneWolf/public/01fftd/text/en"  # Change this to your target folder
    classes_to_find = ["puzzle", "deadend"]
    
    result = find_html_files_with_classes(folder_path, classes_to_find)
    
    if result:
        print("Files containing the specified classes:")
        for file in result:
            print(f"- {file}")
    else:
        print("No matching files found.")
