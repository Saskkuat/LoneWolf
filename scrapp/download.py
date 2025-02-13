import os
import re
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

# Configurable start section
START_SECTION = 0  # Modify for other books

# Configurable total sections
TOTAL_SECTIONS = 350  # Modify for other books

# Configurable book id and name
BOOK_ID = "02fotw"
BOOK_NAME = "FireOnTheWater"
# 01fftd - FlightFromTheDark
# 02fotw - FireOnTheWater

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

def scrape_and_save(section_number):
    """Scrape text and images from the section and save them as HTML."""
    url = BASE_URL + "tssf.htm" if section_number == 0 else section_number + ".htm"
    print(f"\n{url}")
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
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(scrape_and_save, range(START_SECTION, TOTAL_SECTIONS + 1))
    
    print("\n✅ Scraping completed! 🚀🔥")
