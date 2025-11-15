import logging
import re
from typing import Optional

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from dtos.lol_dto import GetLolResponseDTO, LolDto, ChampionDto
from services.crawler_service import crawler_service, WEB_DRIVER_TIMEOUT

logger = logging.getLogger(__name__)


def crawl_lol(
    driver: webdriver.Chrome, game_name: str, tag_line: str
) -> LolDto:
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://op.gg/ko/lol/summoners/kr/{encoded_name}-{tag_line}?queue_type=SOLORANKED"

    tier = "Unranked"
    rank = ""
    lp = 0
    top_champions = []

    try:
        logger.info(f"Scraping: {url}")
        driver.get(url)
        logger.info(f"Page loaded: {url}")
    except TimeoutException as e:
        logger.warning(f"Page load timeout: {url}")
        return LolDto(
            tier=tier,
            rank=rank,
            lp=lp,
            top_champions=top_champions,
        )
    except Exception as e:
        logger.warning(f"Page load error: {url} - {type(e).__name__}")
        return LolDto(
            tier=tier,
            rank=rank,
            lp=lp,
            top_champions=top_champions,
        )

    try:
        wait = WebDriverWait(driver, WEB_DRIVER_TIMEOUT)
        tier_element = None
        tier_selectors = [
            "strong.text-xl.first-letter\\:uppercase",
            "strong[class*='text-xl']",
            "div[class*='TierRankInfo'] strong",
            "strong",
        ]

        for selector in tier_selectors:
            try:
                tier_element = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                if tier_element and tier_element.text.strip():
                    break
            except:
                continue

        if tier_element:
            tier_text = tier_element.text.strip()

            tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)(?:\s+(I|II|III|IV|1|2|3|4))?"
            tier_match = re.search(tier_pattern, tier_text, re.IGNORECASE)

            if tier_match:
                tier = tier_match.group(1).capitalize()
                rank = tier_match.group(2) if tier_match.group(2) else ""
            else:
                tier = "Unranked"
                rank = ""

            try:
                lp_span = driver.find_element(
                    By.CSS_SELECTOR, "span.text-xs.text-gray-500"
                )
                lp_text = lp_span.text.strip()
                lp_match = re.search(r"(\d+)\s*LP", lp_text)
                lp = int(lp_match.group(1)) if lp_match else 0
            except:
                lp = 0
        else:
            tier = "Unranked"
            rank = ""
            lp = 0
    except TimeoutException as e:
        logger.warning(f"Tier info timeout: {url}")
    except Exception as e:
        logger.warning(f"Tier info error: {url} - {type(e).__name__}")

    try:
        wait = WebDriverWait(driver, WEB_DRIVER_TIMEOUT)

        wait.until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    "li.box-border.flex.w-full.items-center.border-b",
                )
            )
        )

        champ_elements = driver.find_elements(
            By.CSS_SELECTOR, "li.box-border.flex.w-full.items-center.border-b"
        )

        for champ_element in champ_elements[:3]:
            try:
                name = "Unknown"
                icon_url = ""
                games = 0
                win_rate = 0.0

                champ_img = champ_element.find_element(
                    By.CSS_SELECTOR, "img.rounded-full"
                )
                name = champ_img.get_attribute("alt") or "Unknown"
                icon_url = champ_img.get_attribute("src") or ""

                win_rate_container = champ_element.find_element(
                    By.CSS_SELECTOR,
                    "div.flex.basis-\\[92px\\].flex-col.text-right",
                )
                wr_span = win_rate_container.find_element(
                    By.CSS_SELECTOR, "span.text-xs"
                )
                wr_text = wr_span.text.strip().replace("%", "")
                win_rate = float(wr_text) if wr_text and wr_text != "" else 0.0

                games_span = win_rate_container.find_element(
                    By.CSS_SELECTOR, "span.text-2xs"
                )
                games_text = games_span.text.strip()
                games_match = re.search(r"(\d+)\s*게임", games_text)
                games = int(games_match.group(1)) if games_match else 0

                if name != "Unknown" and games > 0:
                    top_champions.append(
                        ChampionDto(
                            name=name,
                            icon_url=icon_url,
                            games=games,
                            win_rate=win_rate,
                        )
                    )
            except Exception as e:
                logger.debug(f"Champion parsing error: {type(e).__name__}")
                continue
    except TimeoutException as e:
        logger.warning(f"Champion list timeout: {url}")
    except Exception as e:
        logger.warning(f"Champion list error: {url} - {type(e).__name__}")

    return LolDto(
        tier=tier,
        rank=rank,
        lp=lp,
        top_champions=top_champions,
    )


async def get_lol(user_id: int) -> Optional[GetLolResponseDTO]:
    return await crawler_service.get_lol(user_id)
