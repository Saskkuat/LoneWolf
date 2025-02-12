import os
import requests
from deep_translator import GoogleTranslator
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy
from PIL import Image, ImageOps
import re
import time

# Load NLP model
nlp = spacy.load("en_core_web_sm")

CRAIYON_API_URL = "https://www.craiyon.com/api/generate"  # Craiyon free AI image generation
POLLING_INTERVAL = 10  # Seconds between polling attempts
MAX_POLL_ATTEMPTS = 10  # Max number of polling attempts

def extract_keywords(text, top_n=5):
    vectorizer = TfidfVectorizer(stop_words='english', max_features=top_n)
    tfidf_matrix = vectorizer.fit_transform([text])
    return list(vectorizer.get_feature_names_out())

def extract_themes(text, top_n=5):
    doc = nlp(text)
    themes = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) > 1]
    return themes[:top_n]  # Limit to top_n themes

def generate_prompts(keywords, themes):
    keywords = keywords[:3]  # Limit to 3 keywords
    themes = themes[:3]  # Limit to 3 themes
    
    prompts = [
        f"A detailed illustration of {keywords[0]}, set in a {themes[0]} environment.",
        f"A scene featuring {keywords[1]} in a {themes[1]} atmosphere.",
        f"A fantasy depiction of {keywords[2]} within {themes[2]} surroundings."
    ]
    return prompts

def generate_image(prompt, section_number, attempt):
    print(f"[INFO] ({section_number}) Attempt {attempt}: Requesting image generation for prompt: {prompt}")
    response = requests.post(
        CRAIYON_API_URL,
        json={"prompt": prompt}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "job_id" in data:
            job_id = data["job_id"]
            print(f"[INFO] ({section_number}) Job ID received: {job_id}. Polling for completion...")
            return poll_for_image(job_id, section_number)
    
    print(f"[X] ({section_number}) Image generation request failed.")
    return None

def poll_for_image(job_id, section_number):
    for attempt in range(MAX_POLL_ATTEMPTS):
        time.sleep(POLLING_INTERVAL)
        response = requests.get(f"{CRAIYON_API_URL}/result/{job_id}")
        
        if response.status_code == 200:
            data = response.json()
            if "images" in data and data["images"]:
                print(f"[✓] ({section_number}) Image generation completed.")
                return data["images"][0]  # Return first image
        print(f"[INFO] ({section_number}) Poll attempt {attempt + 1} - Waiting for image...")
    
    print(f"[X] ({section_number}) Image generation timed out.")
    return None

def process_section(text_file, image_folder, output_folder):
    if not os.path.basename(text_file).startswith("en"):
        print(f"[X] Skipping {text_file}, not an 'en' file.")
        return
    
    section_number = os.path.splitext(os.path.basename(text_file))[0]
    existing_images = [f for f in os.listdir(image_folder) if f.startswith(f"{section_number}_") and f.endswith(".gif")]
    
    if len(existing_images) >= 3:
        print(f"[✓] Skipping section {section_number}, images already exist.")
        return
    
    with open(text_file, 'r', encoding='utf-8') as file:
        text = file.read()
    
    keywords = extract_keywords(text)
    themes = extract_themes(text)
    print(f"[INFO] ({section_number}) Keywords: {keywords}, Themes: {themes}")
    
    prompts = generate_prompts(keywords, themes)
    
    image_index = len(existing_images) + 1
    for i, prompt in enumerate(prompts):
        if image_index > 3:
            break
        
        image_url = generate_image(prompt, section_number, i + 1)
        if image_url:
            image_path = os.path.join(output_folder, f"{section_number}_{image_index}.gif")
            response = requests.get(image_url, stream=True)
            if response.status_code == 200:
                with open(image_path, 'wb') as img_file:
                    for chunk in response.iter_content(1024):
                        img_file.write(chunk)
                print(f"[✓] Image saved: {image_path}")
            
                # Apply black & white filter
                image = Image.open(image_path)
                bw_image = ImageOps.grayscale(image)
                bw_image.save(image_path)
                print(f"[✓] Black & white filter applied: {image_path}")
                
                image_index += 1

def process_first_section(text_folder, image_folder, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    text_files = sorted([os.path.join(text_folder, f) for f in os.listdir(text_folder) if f.startswith("en") and f.endswith(".txt")])
    
    if text_files:
        process_section(text_files[0], image_folder, output_folder)
        print("[✓] First section processed successfully.")
    else:
        print("[X] No 'en' text files found.")

# Example usage
process_first_section("C:\\Callisto\\lonewolf - 1 - fuga da escuridao", "C:\\Callisto\\lonewolf - 1 - fuga da escuridao\\images", "C:\\Callisto\\lonewolf - 1 - fuga da escuridao\\generated_images")
