import os
import chardet
# C:\Python313\python.exe -m pip install chardet
# C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe -m pip install chardet

def convert_html_encoding(input_folder):
    # Iterate over all files in the folder
    for filename in os.listdir(input_folder):
        if filename.endswith('.html'):
            file_path = os.path.join(input_folder, filename)

            # Detect the file encoding
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                result = chardet.detect(raw_data)
                encoding = result['encoding']
            
            try:
                # Open the file with the detected encoding and read its contents
                with open(file_path, 'r', encoding=encoding) as file:
                    content = file.read()

                # Replace problematic characters
                replacements = {
                    '\u2009': ' ',  # Thin space → Normal space
                    '−': '-',        # Minus sign → Hyphen
                    '“': '"',        # Left double quote → Standard "
                    '”': '"',        # Right double quote → Standard "
                    '‘': "'",        # Left single quote → Standard '
                    '’': "'",        # Right single quote → Standard '
                    '…': '...',      # Ellipsis → Three dots
                }

                for char, replacement in replacements.items():
                    content = content.replace(char, replacement)

                # Write back the modified content with Windows-1252 encoding
                with open(file_path, 'w', encoding='windows-1252') as file:
                    file.write(content)

                print(f"Converted {filename} to windows-1252 encoding")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
                
# Specify the folder where the HTML files are located
folder_path = 'C:/Callisto/LoneWolf/public/TheCavernsOfKalte/text/br'

# Call the function
convert_html_encoding(folder_path)
