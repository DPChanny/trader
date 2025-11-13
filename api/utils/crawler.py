"""OP.GG 크롤링을 위한 공통 유틸리티"""

import re
import asyncio
import time
import logging
from typing import Dict, List, Callable, Any, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)

_global_driver: Optional[webdriver.Chrome] = None
_driver_lock = asyncio.Lock()


def get_chrome_options():
    """Chrome 옵션 설정"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option(
        "excludeSwitches", ["enable-automation"]
    )
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return chrome_options


def get_chrome_driver():
    chrome_options = get_chrome_options()
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


async def get_global_driver():
    global _global_driver

    async with _driver_lock:
        if _global_driver is None:
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(None, get_chrome_driver)
            logger.info("Global Chrome driver initialized")

        try:
            _ = _global_driver.current_url
        except:
            logger.warning("Driver restart required")
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(None, get_chrome_driver)

    return _global_driver


async def cleanup_driver():
    global _global_driver

    async with _driver_lock:
        if _global_driver is not None:
            try:
                _global_driver.quit()
                logger.info("Global Chrome driver closed")
            except Exception as e:
                logger.error(f"Error closing Chrome driver: {str(e)}")
            finally:
                _global_driver = None


def wait_for_page_load(driver: webdriver.Chrome, timeout: int = 10):
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

    time.sleep(0.8)

    try:
        wait.until(
            lambda d: d.execute_script(
                "return typeof jQuery === 'undefined' || jQuery.active === 0"
            )
        )
    except:
        pass


async def scrape_with_selenium(
    url: str,
    scraper_func: Callable[[webdriver.Chrome, WebDriverWait], Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Selenium을 사용하여 웹페이지를 크롤링하는 공통 함수 (전역 드라이버 재사용)

    Args:
        url: 크롤링할 URL
        scraper_func: WebDriver와 WebDriverWait를 받아 크롤링 로직을 수행하는 함수

    Returns:
        크롤링 결과 딕셔너리
    """
    driver = await get_global_driver()

    def _scrape_sync():
        try:
            driver.get(url)

            wait_for_page_load(driver, timeout=10)

            wait = WebDriverWait(driver, 10)
            return scraper_func(driver, wait)
        except Exception as e:
            logger.error(f"Crawling error for {url}: {str(e)}")
            return {}

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _scrape_sync)
        return result
    except Exception as e:
        logger.error(f"Executor error: {str(e)}")
        return {}
