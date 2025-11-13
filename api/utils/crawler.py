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

# 전역 드라이버 인스턴스
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
    """새로운 Chrome 드라이버 인스턴스 생성"""
    chrome_options = get_chrome_options()
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


async def get_global_driver():
    """전역 드라이버 인스턴스 가져오기 또는 생성"""
    global _global_driver

    async with _driver_lock:
        if _global_driver is None:
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(None, get_chrome_driver)
            logger.info("Global Chrome driver initialized")

        # 드라이버가 살아있는지 확인
        try:
            _ = _global_driver.current_url
        except:
            logger.warning("Driver restart required")
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(None, get_chrome_driver)

    return _global_driver


async def cleanup_driver():
    """전역 드라이버 정리"""
    global _global_driver

    async with _driver_lock:
        if _global_driver is not None:
            try:
                _global_driver.quit()
                logger.info("Global Chrome driver closed")
            except:
                pass
            _global_driver = None


def wait_for_page_load(driver: webdriver.Chrome, timeout: int = 10):
    """
    페이지가 완전히 로드될 때까지 체계적으로 대기

    Args:
        driver: Selenium WebDriver
        timeout: 최대 대기 시간(초)
    """
    wait = WebDriverWait(driver, timeout)

    # 1. document.readyState가 complete가 될 때까지 대기
    try:
        wait.until(
            lambda d: d.execute_script("return document.readyState")
            == "complete"
        )
    except:
        pass

    # 2. body 요소가 로드될 때까지 대기
    try:
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    except:
        pass

    # 3. JavaScript 실행 완료를 위한 추가 대기
    time.sleep(0.8)

    # 4. jQuery가 있다면 ajax 완료 대기
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

            # 체계적인 페이지 로딩 대기
            wait_for_page_load(driver, timeout=10)

            wait = WebDriverWait(driver, 10)
            return scraper_func(driver, wait)
        except Exception as e:
            logger.error(f"Crawling error: {str(e)}")
            raise

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

    print(f"[extract_character_stats] 총 {len(elements)}개 요소 검사 시작")

    for i, elem in enumerate(elements):
        if len(character_stats) >= max_count:
            break

        try:
            # 부모 요소들도 함께 확인 (챔피언 정보는 상위 컨테이너에 있을 수 있음)
            parent = elem
            for _ in range(3):  # 최대 3단계 상위까지 확인
                try:
                    parent_text = parent.text
                    parent_html = parent.get_attribute("outerHTML")

                    # 이미지 URL 추출
                    img_elem = (
                        parent.find_element(By.TAG_NAME, "img")
                        if parent.tag_name != "img"
                        else parent
                    )
                    icon_url = img_elem.get_attribute("src") or ""

                    if not icon_url or (
                        "champion" not in icon_url.lower()
                        and "agent" not in icon_url.lower()
                    ):
                        parent = parent.find_element(By.XPATH, "..")
                        continue

                    # 챔피언/에이전트 이름 추출 (alt 속성 우선)
                    name = img_elem.get_attribute("alt") or "Unknown"

                    # 상위 요소의 텍스트에서 게임 수와 승률 추출
                    full_text = parent_text

                    # 디버깅
                    if i < 5:
                        print(
                            f"[extract_character_stats] 요소 {i}: name={name}, text_sample={full_text[:100] if full_text else '(empty)'}"
                        )

                    # 게임 수 추출 - 다양한 패턴 시도
                    games = 0
                    games_patterns = [
                        r"(\d+)\s*게임",
                        r"(\d+)\s*[Gg]ames?",
                        r"(\d+)\s*played",
                        r"^(\d+)$",  # 숫자만 있는 경우
                    ]

                    for pattern in games_patterns:
                        games_match = re.search(pattern, full_text)
                        if games_match:
                            games = int(games_match.group(1))
                            break

                    # 승률 추출
                    win_rate = 0.0
                    winrate_patterns = [
                        r"(\d+(?:\.\d+)?)%",
                        r"Win Rate[:\s]*(\d+(?:\.\d+)?)%",
                    ]

                    for pattern in winrate_patterns:
                        winrate_match = re.search(pattern, full_text)
                        if winrate_match:
                            win_rate = float(winrate_match.group(1))
                            break

                    # 유효한 데이터가 있으면 추가
                    if icon_url and (games > 0 or win_rate > 0):
                        if not icon_url.startswith("http"):
                            icon_url = (
                                f"https:{icon_url}"
                                if icon_url.startswith("//")
                                else f"https://op.gg{icon_url}"
                            )

                        character_stats.append(
                            {
                                "name": name,
                                "icon_url": icon_url,
                                "games": games,
                                "win_rate": win_rate,
                            }
                        )
                        print(
                            f"[extract_character_stats] 추출 성공: {name} - {games}게임, {win_rate}%"
                        )
                        break

                    parent = parent.find_element(By.XPATH, "..")
                except:
                    break

        except Exception as e:
            if i < 5:
                print(
                    f"[extract_character_stats] 요소 {i} 처리 중 에러: {str(e)}"
                )
            continue

    print(f"[extract_character_stats] 최종 추출: {len(character_stats)}개")
    return character_stats
