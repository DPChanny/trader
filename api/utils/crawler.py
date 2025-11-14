import logging
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)


def get_chrome_options() -> Options:
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    chrome_options.add_experimental_option(
        "excludeSwitches", ["enable-automation"]
    )
    chrome_options.add_experimental_option("useAutomationExtension", False)
    return chrome_options


def wait_for_page_load(driver: webdriver.Chrome, timeout: int = 5):
    wait = WebDriverWait(driver, timeout)

    try:
        wait.until(
            lambda d: d.execute_script("return document.readyState")
            == "complete"
        )
    except:
        pass

    try:
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    except:
        pass

    try:
        wait.until(
            lambda d: d.execute_script(
                "return typeof jQuery === 'undefined' || jQuery.active === 0"
            )
        )
    except:
        pass

    try:
        wait.until(
            lambda d: d.execute_script(
                """
                return window.performance.getEntriesByType('resource')
                    .every(r => r.responseEnd > 0);
                """
            )
        )
    except:
        pass

    time.sleep(0.3)
