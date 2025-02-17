import os
import chardet
# C:\Python313\python.exe -m pip install chardet
# C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe -m pip install chardet

def convert_html_encoding(input_folder, to_encoding="windows-1252"):
    """
    Convert HTML files encoding in a folder.
    
    Args:
        input_folder (str): Path to the folder containing HTML files.
        to_encoding (str): Target encoding ('windows-1252' or 'utf-8').
    """

    for filename in os.listdir(input_folder):
        if filename.endswith('.html'):
            file_path = os.path.join(input_folder, filename)

            # Detect the file encoding
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                result = chardet.detect(raw_data)
                encoding = result['encoding']

            try:
                # Read the file using detected encoding
                with open(file_path, 'r', encoding=encoding, errors='replace') as file:
                    content = file.read()

                if to_encoding == "windows-1252":
                    # Replace problematic characters when converting to Windows-1252
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

                # Write the file with the new encoding
                with open(file_path, 'w', encoding=to_encoding, errors='replace') as file:
                    file.write(content)

                print(f"Converted {filename} to {to_encoding} encoding")

            except Exception as e:
                print(f"Error processing {filename}: {e}")

# ========== USAGE ==========
folder_path = 'C:/Callisto/LoneWolf/public/FireOnTheWater/text/br' # Change this to your folder path
convert_to = "utf-8"  # Change to "windows-1252" or "utf-8"

convert_html_encoding(folder_path, to_encoding=convert_to)
