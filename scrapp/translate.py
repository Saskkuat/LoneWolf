import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# Configurable book name
BOOK_ID = "01fftd"
# 01fftd - FlightFromTheDark    -- 350 SECTIONS
# 02fotw - FireOnTheWater       -- 350 SECTIONS
# 03tcok - TheCavernsOfKalte    -- 350 SECTIONS
# 04tcod - TheChasmOfDoom       -- 350 SECTIONS
# 05sots - ShadowOnTheSand      -- 400 SECTIONS

# Folder paths
TEXT_FOLDER = r"..\public\{}\text\{}"
EN_TEXT_FOLDER = TEXT_FOLDER.format(BOOK_ID, "en")
BR_TEXT_FOLDER = TEXT_FOLDER.format(BOOK_ID, "br")
os.makedirs(BR_TEXT_FOLDER, exist_ok=True)

# Options
KEEP_BROWSER_OPEN = False  # Change to False to close automatically
HEADLESS_MODE = False  # Change to True to hide the browser window
# WARNING: HEADLESS_MODE=True - google will detects selenium and alters behavior

# Set up Selenium WebDriver
options = webdriver.ChromeOptions()
if HEADLESS_MODE:
    options.add_argument("--headless=new")  # Modern headless mode

# Trick Google into Thinking It's a Regular User
# If not the result's gonna differ from a regular browser (text and html tags) 
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option("useAutomationExtension", False)

# service = Service('C:/chromedriver-win64/chromedriver.exe')
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

# Remove WebDriver flags
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

def translate_with_selenium(text):
    """Translate text using Google Translate via Selenium."""
    url = "https://translate.google.com/?sl=en&tl=pt&op=translate"

    try:
        driver.get(url)

        # Try finding the input field with either "Source text" or "Texto de origem"
        input_field = None
        aria_labels = ["Source text", "Texto de origem"]
        for label in aria_labels:
            try:
                input_field = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, f"textarea[aria-label='{label}']"))
                )
                break  # If found, exit loop
            except:
                continue

        if not input_field:
            print("❌ Could not find input field.")
            return ""

        input_field.clear()
        input_field.send_keys(text)

        # Wait for the "Tradução" or "Translation" div to appear
        translation_label = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[@aria-hidden='true' and (text()='Tradução' or text()='Translation')]"))
        )

        # Find the next div with both jsname and jsaction attributes
        output_element = translation_label.find_element(By.XPATH, "following-sibling::div[@jsname and @jsaction]")

        # Wait for translation to be ready
        WebDriverWait(driver, 10).until(lambda d: output_element.text.strip() != "")

        return output_element.text.strip()

    except Exception as e:
        print(f"❌ Error translating text: {e}")
        return ""

def process_html_file(file_name, index, total):
    en_file_path = os.path.join(EN_TEXT_FOLDER, file_name)
    br_file_path = os.path.join(BR_TEXT_FOLDER, file_name)

    try:
        with open(en_file_path, "r", encoding="utf-8") as file:
            soup = BeautifulSoup(file, "html.parser")

        print(f"\n[{index}/{total}] Translating: {file_name}...")
        
        # Translate text using Selenium
        translated_text = translate_with_selenium(str(soup))

        # Save translated HTML
        with open(br_file_path, "w", encoding="utf-8", errors="replace") as file:
            file.write(translated_text)

        print(f"\n[{index}/{total}] ✅ Saved translation: {br_file_path}")

        time.sleep(2)
    except Exception as e:
        print(f"\n[{index}/{total}] ❌ Error processing {file_name}: {e}")

if __name__ == "__main__":
    files = [f for f in os.listdir(EN_TEXT_FOLDER) if f.endswith(".html")]
    total_files = len(files)

    print("\n🌍 Starting HTML translation process...\n")

    for idx, file in enumerate(files, start=1):
        process_html_file(file, idx, total_files)

    print("\n✅ HTML Translation completed! 🌍🔥")

    if KEEP_BROWSER_OPEN:
        print("\n🛑 **Browser will remain open. Close it manually when done!**")
        input("Press ENTER to exit and close the browser...")

    driver.quit()
