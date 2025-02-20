import os
import re
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

# Configurable start section
START_SECTION = 0

# Configurable total sections (set to None for dynamic detection)
TOTAL_SECTIONS = None

# Configurable book id and name
BOOK_ID = "05sots"
BOOK_NAME = "ShadowOnTheSand"
# 01fftd - FlightFromTheDark    -- 350 SECTIONS
# 02fotw - FireOnTheWater       -- 350 SECTIONS
# 03tcok - TheCavernsOfKalte    -- 350 SECTIONS
# 04tcod - TheChasmOfDoom       -- 350 SECTIONS
# 05sots - ShadowOnTheSand      -- 400 SECTIONS

# Base URL for scraping
BASE_URL = rf"https://www.projectaon.org/en/xhtml/lw/{BOOK_ID}/"

# Folder structure
HTML_FOLDER = rf"..\public\{BOOK_NAME}\text\en"
IMAGE_FOLDER = os.path.join(HTML_FOLDER, "..", "..", "images")

# Ensure folders exist
os.makedirs(HTML_FOLDER, exist_ok=True)
os.makedirs(IMAGE_FOLDER, exist_ok=True)

def clean_text(text):
    """Remove square brackets and content inside them."""
    return re.sub(r'\[.*?\]', '', text)

def get_image_name(img_url):
    """Extract the original image filename from the URL and change the extension to .gif."""
    base_name = os.path.splitext(os.path.basename(urlparse(img_url).path))[0]
    return f"{base_name}.gif"

def download_image(img_url):
    """Download and save image using its original filename with .gif extension."""
    try:
        response = requests.get(img_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        response.raise_for_status()
        
        img_name = get_image_name(img_url)
        img_path = os.path.join(IMAGE_FOLDER, img_name)

        with open(img_path, "wb") as img_file:
            img_file.write(response.content)

        print(f"\n🖼️ Saved Image: {img_path}")
    except requests.RequestException as e:
        print(f"\n❌ Error downloading image {img_url}: {e}")

def download_map():
    """Download the book's map image."""
    map_url = urljoin(BASE_URL, "map.png")
    download_image(map_url)

def section_exists(section_number):
    """Check if a section exists by making a request."""
    url = f"{BASE_URL}{'tssf' if section_number == 0 else f'sect{section_number}'}.htm"
    try:
        response = requests.head(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False

def find_total_sections():
    """Find the total number of sections dynamically using parallel search."""
    section_number = START_SECTION
    step = 1
    
    while section_exists(section_number):
        section_number += step
        step *= 2
    
    return binary_search(section_number // 2, section_number)

def binary_search(low, high):
    """Perform binary search to find the exact last valid section."""
    while low < high:
        mid = (low + high) // 2
        if section_exists(mid):
            low = mid + 1
        else:
            high = mid
    return low - 1

def scrape_and_save(section_number):
    """Scrape text and images from the section and save them as HTML."""
    url = f"{BASE_URL}{'tssf' if section_number == 0 else f'sect{section_number}'}.htm"
    file_name = f"{section_number}.html"
    file_path = os.path.join(HTML_FOLDER, file_name)

    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        div = soup.find("div", class_="maintext")
        section = soup.find("section")

        content = ""

        if div:
            # Remove <sup> tags
            for sup in div.find_all("sup"):
                sup.decompose()

            # Extract paragraphs, but keep any inline elements like <i>, <b>, etc.
            paragraphs = div.find_all(["p", "figure"])
            cleaned_paragraphs = [clean_text(str(p)) for p in paragraphs]
            content += "".join(cleaned_paragraphs)

            # Extract and download images
            images = div.find_all("img")
            for img in images:
                img_src = img.get("src")
                if img_src:
                    img_url = urljoin(BASE_URL, img_src)
                    download_image(img_url)

        if section:
            # Remove <sup> tags
            for sup in section.find_all("sup"):
                sup.decompose()

            # Keep only <p> and <figure> elements from the section, remove others
            for child in section.find_all(recursive=False):
                if child.name not in ["p", "figure"]:
                    child.decompose()

            # Clean text inside <section>
            section_content = clean_text(str(section))
            content += section_content

        if not content:
            content = "<p>No content found.</p>"

        # Save content as HTML
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(f"<html><body>{content}</body></html>")

        print(f"\n✅ Saved HTML: {file_path}")
    except requests.RequestException as e:
        print(f"\n❌ Error fetching {url}: {e}")

if __name__ == "__main__":
    print("\n🚀 Starting web scraping...\n")
    
    print("🔍 Downloading map...")
    download_map()
    
    if TOTAL_SECTIONS is None:
        print("🔍 Detecting total sections dynamically...")
        TOTAL_SECTIONS = find_total_sections()
        print(f"📌 Dynamic detection found {TOTAL_SECTIONS} sections.")
        
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(scrape_and_save, range(START_SECTION, TOTAL_SECTIONS + 1))
    
    print("\n✅ Scraping completed! 🚀🔥")
