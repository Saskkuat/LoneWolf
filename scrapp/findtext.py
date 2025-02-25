import os

def find_html_files_with_text(folder_path, text):
    matching_files = []
    
    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()
                if text in content:
                    matching_files.append(filename)
    
    return matching_files

if __name__ == "__main__":
    folder_path = "C:/Callisto/LoneWolf/public/01fftd/text/en"  # Change this to your target folder
    text_to_find = "Mind Over Matter"
    
    result = find_html_files_with_text(folder_path, text_to_find)
    
    if result:
        print("Files containing the specified text:")
        for file in result:
            print(f"- {file}")
    else:
        print("No matching files found.")
