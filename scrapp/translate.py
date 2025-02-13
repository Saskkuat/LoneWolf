import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from deep_translator import GoogleTranslator
from bs4 import BeautifulSoup

# Configurable book name
BOOK_NAME = "FireOnTheWater"
# FlightFromTheDark
# FireOnTheWater

# Folder paths
TEXT_FOLDER = r"..\public\{}\text\{}"
EN_TEXT_FOLDER = TEXT_FOLDER.format(BOOK_NAME, "en")
BR_TEXT_FOLDER = TEXT_FOLDER.format(BOOK_NAME, "br")
os.makedirs(BR_TEXT_FOLDER, exist_ok=True)

# Initialize the translator
translator = GoogleTranslator(source="en", target="pt")

# Set up the Selenium WebDriver
options = webdriver.ChromeOptions()
options.headless = False
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

def process_html_file(file_name, index, total):
    en_file_path = os.path.join(EN_TEXT_FOLDER, file_name)
    br_file_path = os.path.join(BR_TEXT_FOLDER, file_name)

    try:
        with open(en_file_path, "r", encoding="utf-8") as file:
            soup = BeautifulSoup(file, "html.parser")

        # Translate the entire HTML content while preserving structure
        translated_html = translator.translate(str(soup))

        print(f"\n[{index}/{total}] Translating: {file_name}...")

        with open(br_file_path, "w", encoding="windows-1252", errors="replace") as file:
            file.write(translated_html)

        print(f"\n[{index}/{total}] ✅ Saved translation: {br_file_path}")

        time.sleep(2)
    except Exception as e:
        print(f"\n[{index}/{total}] ❌ Error processing {file_name}: {e}")

if __name__ == "__main__":
    files = [f for f in os.listdir(EN_TEXT_FOLDER) if f.endswith(".html")]
    total_files = len(files)

    print("\n🌍 Starting HTML translation process...\n")

    for idx, file in enumerate(files, start=1):
        # if idx > 1: break
        process_html_file(file, idx, total_files)

    print("\n✅ HTML Translation completed! 🌍🔥")

    driver.quit()
