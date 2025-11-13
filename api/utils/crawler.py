"""OP.GG 크롤링을 위한 공통 유틸리티"""

import re
import asyncio
from typing import Dict, List, Callable, Any
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def get_chrome_driver():
    """Chrome 드라이버 설정"""
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

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


async def scrape_with_selenium(
    url: str,
    scraper_func: Callable[[webdriver.Chrome, WebDriverWait], Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Selenium을 사용하여 웹페이지를 크롤링하는 공통 함수

    Args:
        url: 크롤링할 URL
        scraper_func: WebDriver와 WebDriverWait를 받아 크롤링 로직을 수행하는 함수

    Returns:
        크롤링 결과 딕셔너리
    """

    def _scrape_sync():
        driver = None
        try:
            driver = get_chrome_driver()
            driver.get(url)

            # JavaScript 렌더링을 위한 추가 대기
            import time

            time.sleep(3)

            wait = WebDriverWait(driver, 15)

            return scraper_func(driver, wait)
        finally:
            if driver:
                driver.quit()

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _scrape_sync)
    return result


def extract_tier_rank(page_text: str, tier_pattern: str) -> tuple[str, str]:
    """
    페이지 텍스트에서 티어와 랭크를 추출

    Args:
        page_text: 페이지 소스 텍스트
        tier_pattern: 티어 패턴 (정규표현식)

    Returns:
        (tier, rank) 튜플
    """
    tier_match = re.search(tier_pattern, page_text, re.IGNORECASE)
    if tier_match:
        tier = tier_match.group(1)
        rank = tier_match.group(2) if tier_match.group(2) else ""
        return tier, rank
    return "Unranked", ""


def extract_points(page_text: str, point_pattern: str) -> int:
    """
    페이지 텍스트에서 포인트(LP/RR) 추출

    Args:
        page_text: 페이지 소스 텍스트
        point_pattern: 포인트 패턴 (정규표현식, 예: r"(\d+)\s*LP")

    Returns:
        포인트 값
    """
    point_match = re.search(point_pattern, page_text)
    return int(point_match.group(1)) if point_match else 0


def extract_win_rate(page_text: str) -> float:
    """
    페이지 텍스트에서 승률 추출

    Args:
        page_text: 페이지 소스 텍스트

    Returns:
        승률 (%)
    """
    winrate_match = re.search(r"(\d+)W\s+(\d+)L", page_text)
    if winrate_match:
        wins = int(winrate_match.group(1))
        losses = int(winrate_match.group(2))
        total = wins + losses
        if total > 0:
            return round((wins / total) * 100, 1)
    return 0.0


def extract_character_stats(
    driver: webdriver.Chrome,
    css_selector: str,
    image_pattern: str,
    max_count: int = 3,
) -> List[Dict[str, Any]]:
    """
    챔피언/에이전트 통계 추출

    Args:
        driver: Selenium WebDriver
        css_selector: 캐릭터 요소를 찾기 위한 CSS 선택자
        image_pattern: 이미지 URL을 찾기 위한 정규표현식 패턴
        max_count: 추출할 최대 캐릭터 수

    Returns:
        캐릭터 통계 리스트 [{"name": str, "icon_url": str, "games": int, "win_rate": float}, ...]
    """
    character_stats = []
    elements = driver.find_elements(By.CSS_SELECTOR, css_selector)

    for elem in elements[:max_count]:
        try:
            elem_text = elem.text
            elem_html = elem.get_attribute("innerHTML")

            # 이름 추출
            name_match = re.search(
                r"<[^>]*>([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)<", elem_html
            )
            name = name_match.group(1) if name_match else "Unknown"

            # 이미지 URL 추출
            img_match = re.search(image_pattern, elem_html)
            icon_url = img_match.group(1) if img_match else ""
            if icon_url and not icon_url.startswith("http"):
                icon_url = f"https:{icon_url}"

            # 게임 수 추출
            games_match = re.search(r"(\d+)\s*게임|(\d+)\s*Games", elem_text)
            games = (
                int(games_match.group(1) or games_match.group(2))
                if games_match
                else 0
            )

            # 승률 추출
            winrate_match = re.search(r"(\d+(?:\.\d+)?)%", elem_text)
            win_rate = float(winrate_match.group(1)) if winrate_match else 0.0

            if games > 0:
                character_stats.append(
                    {
                        "name": name,
                        "icon_url": icon_url,
                        "games": games,
                        "win_rate": win_rate,
                    }
                )
        except Exception:
            continue

    return character_stats
