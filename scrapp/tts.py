import os
import edge_tts
import time
import asyncio
from pydub import AudioSegment
from bs4 import BeautifulSoup

# Configurable book name
BOOK_NAME = "FireOnTheWater"
# FlightFromTheDark
# FireOnTheWater

# Configuration
LANGUAGE = "BR"  # Change to "EN" or "BR"
TEXT_FOLDER = rf"..\public\{BOOK_NAME}\text\{LANGUAGE.lower()}"
AUDIO_FOLDER = os.path.join(TEXT_FOLDER, "..", "..", "audio", LANGUAGE.lower())
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Determine voice and encoding based on language
if LANGUAGE == "EN":
    VOICE = "en-US-GuyNeural"
    ENCODING = "utf-8"
elif LANGUAGE == "BR":
    VOICE = "pt-BR-AntonioNeural"
    ENCODING = "windows-1252"
else:
    raise ValueError("Invalid language setting. Use 'EN' or 'BR'.")

def extract_text_from_html(file_path):
    """Extracts all visible text from an HTML file."""
    with open(file_path, "r", encoding=ENCODING) as file:
        soup = BeautifulSoup(file, "html.parser")
    return "\n".join(soup.stripped_strings)

def split_text(text, max_length=3000):
    """Splits text into chunks without breaking words."""
    words = text.split()
    chunks = []
    current_chunk = ""
    
    for word in words:
        if len(current_chunk) + len(word) + 1 > max_length:
            chunks.append(current_chunk)
            current_chunk = word
        else:
            current_chunk += (" " + word) if current_chunk else word
    
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

async def text_to_speech(file_path, output_path):
    try:
        print(f"[>] Processing: {file_path}")
        text = extract_text_from_html(file_path)
        
        # Split text into word-safe chunks
        chunks = split_text(text, max_length=3000)
        temp_files = []
        
        for i, chunk in enumerate(chunks):
            temp_output = output_path.replace(".mp3", f"_{i}.mp3")
            tts = edge_tts.Communicate(chunk, VOICE)
            await tts.save(temp_output)
            temp_files.append(temp_output)
            print(f"  - [✓] Chunk {i+1}/{len(chunks)} saved: {temp_output}")
            time.sleep(1)  # Prevent rate limiting
        
        # Merge chunks into one final file
        if temp_files:
            combined = AudioSegment.empty()
            for temp_file in temp_files:
                combined += AudioSegment.from_file(temp_file, format="mp3")
            combined.export(output_path, format="mp3")
            print(f"[✓] Merged audio saved: {output_path}")
            
            # Clean up chunk files
            for temp_file in temp_files:
                os.remove(temp_file)
                print(f"  - [🗑] Deleted: {temp_file}")
        
    except Exception as e:
        print(f"[X] Error processing {file_path}: {e}")

def main():
    start_time = time.time()
    
    files = [f for f in os.listdir(TEXT_FOLDER) if f.endswith(".html")]
    
    if not files:
        print("[X] No HTML files found to process.")
        return
    
    print("[>] Starting TTS processing for all files...")
    for idx, file in enumerate(files, start=1):
        file_path = os.path.join(TEXT_FOLDER, file)
        output_path = os.path.join(AUDIO_FOLDER, file.replace(".html", ".mp3"))
        print(f"[{idx}/{len(files)}] Processing: {file}")
        asyncio.run(text_to_speech(file_path, output_path))
    
    end_time = time.time()
    print("[>] Process completed!")
    print(f"[✓] Total time: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()
