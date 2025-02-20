import os
import re

def find_html_files_with_a(folder_path):
    matching_files = []
    a_pattern = re.compile(r'<a\b[^>]*>')
    choice_p_pattern = re.compile(r'<p\s+class=["\']choice["\'].*?>.*?<a\b[^>]*>.*?</a>.*?</p>', re.DOTALL)
    figure_pattern = re.compile(r'<figure.*?>.*?<a\b[^>]*>.*?</a>.*?</figure>', re.DOTALL)
    
    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()
                
                # Remove all <a> elements inside <p class="choice"> and <figure>
                cleaned_content = re.sub(choice_p_pattern, '', content)
                cleaned_content = re.sub(figure_pattern, '', cleaned_content)
                
                # Find remaining <a> elements
                matches = a_pattern.findall(cleaned_content)
                if matches:
                    matching_files.append((filename, matches))
    
    return matching_files

if __name__ == "__main__":
    folder_path = "C:/Callisto/public/TheCavernsOfKalte/text/en"  # Change this to your target folder
    
    result = find_html_files_with_a(folder_path)
    
    if result:
        print("Files containing <a> elements not inside <p class='choice'> or <figure>:")
        for file, tags in result:
            print(f"- {file}")
            for tag in tags:
                print(f"  Found tag: {tag}")
    else:
        print("No matching files found.")
