import os
import re

def find_html_files_with_sup(folder_path):
    matching_files = []
    sup_pattern = re.compile(r'<sup\b[^>]*>')
    
    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()
                if sup_pattern.search(content):
                    matching_files.append(filename)
    
    return matching_files

if __name__ == "__main__":
    folder_path = "C:/Callisto/LoboSolitario - Copy/FugaDaEscuridao/public/text/en"  # Change this to your target folder
    
    result = find_html_files_with_sup(folder_path)
    
    if result:
        print("Files containing <sup> elements:")
        for file in result:
            print(f"- {file}")
    else:
        print("No matching files found.")
