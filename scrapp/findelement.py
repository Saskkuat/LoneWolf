import os
import re

def find_combat_p_elements(folder_path):
    matching_files = []
    combat_p_pattern = re.compile(r'<p\s+class=["\']combat["\'][^>]*>.*?</p>', re.DOTALL)
    
    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()
                
                # Find all <p class="combat"> elements
                matches = combat_p_pattern.findall(content)
                if matches:
                    matching_files.append((filename, matches))
    
    return matching_files

if __name__ == "__main__":
    folder_path = "C:/Callisto/LoneWolf/public/01fftd/text/en"  # Change this to your target folder
    
    result = find_combat_p_elements(folder_path)
    
    if result:
        print("Files containing <p class='combat'> elements:")
        for file, tags in result:
            print(f"- {file}")
            for tag in tags:
                print(f"  Found tag: {tag}")
    else:
        print("No matching files found.")
