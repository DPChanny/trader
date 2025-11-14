import logging
import re
from typing import Optional

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from dtos.val_dto import GetValResponseDTO
from services.crawler_service import crawler_service, DRIVER_TIMEOUT

logger = logging.getLogger(__name__)


def crawl_val(driver: webdriver.Chrome, game_name: str, tag_line: str) -> dict:
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://op.gg/ko/valorant/profile/{encoded_name}-{tag_line}"

    tier = "Unranked"
    rank = ""
    rr = 0
    top_agents = []

    try:
        logger.info(f"VAL scraping started: {url}")
        driver.get(url)
        logger.info(f"VAL page loaded: {url}")
    except TimeoutException as e:
        logger.warning(f"VAL page load timeout: {url}")
        return {
            "tier": tier,
            "rank": rank,
            "rr": rr,
            "top_agents": top_agents,
        }
    except Exception as e:
        logger.warning(f"VAL page load error: {url} - {type(e).__name__}")
        return {
            "tier": tier,
            "rank": rank,
            "rr": rr,
            "top_agents": top_agents,
        }

    try:
        wait = WebDriverWait(driver, DRIVER_TIMEOUT)
        tier_element = None
        tier_selectors = [
            "div.text-\\[14px\\].font-bold.md\\:text-\\[20px\\]",
            "div[class*='font-bold'][class*='text-']",
            "div.font-bold",
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

            tier_kr_pattern = r"(언랭크|아이언|브론즈|실버|골드|플래티넘|다이아몬드|초월자|불멸|레디언트)(?:\s+(1|2|3))?"
            tier_kr_match = re.search(tier_kr_pattern, tier_text)

            if tier_kr_match:
                tier_kr = tier_kr_match.group(1)
                rank = tier_kr_match.group(2) if tier_kr_match.group(2) else ""

                tier_map = {
                    "언랭크": "Unranked",
                    "아이언": "Iron",
                    "브론즈": "Bronze",
                    "실버": "Silver",
                    "골드": "Gold",
                    "플래티넘": "Platinum",
                    "다이아몬드": "Diamond",
                    "초월자": "Ascendant",
                    "불멸": "Immortal",
                    "레디언트": "Radiant",
                }
                tier = tier_map.get(tier_kr, "Unranked")
            else:
                tier_en_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant)(?:\s+(1|2|3))?"
                tier_en_match = re.search(
                    tier_en_pattern, tier_text, re.IGNORECASE
                )

                if tier_en_match:
                    tier = tier_en_match.group(1).capitalize()
                    rank = (
                        tier_en_match.group(2) if tier_en_match.group(2) else ""
                    )
                else:
                    tier = "Unranked"
                    rank = ""
        else:
            tier = "Unranked"
            rank = ""
            rr = 0

        try:
            rr_span = driver.find_element(
                By.CSS_SELECTOR, "span.text-xs.text-gray-500"
            )
            rr_text = rr_span.text.strip()
            rr_match = re.search(r"(\d+)\s*RR", rr_text)
            rr = int(rr_match.group(1)) if rr_match else 0
        except:
            rr = 0
    except TimeoutException as e:
        logger.warning(f"VAL tier info timeout: {url}")
    except Exception as e:
        logger.warning(f"VAL tier info error: {url} - {type(e).__name__}")

    try:
        agent_list_selectors = [
            "div.border-t.border-darkpurple-900 ul",
            "ul.flex.w-full.flex-col",
            "div[class*='border-t'] ul",
        ]

        agent_list = None
        for selector in agent_list_selectors:
            try:
                agent_list = driver.find_element(By.CSS_SELECTOR, selector)
                if agent_list:
                    break
            except:
                continue

        agent_elements = []
        if agent_list:
            agent_elements = agent_list.find_elements(
                By.CSS_SELECTOR, "li.box-border"
            )

        if not agent_elements:
            wait = WebDriverWait(driver, DRIVER_TIMEOUT)
            wait.until(
                EC.presence_of_element_located(
                    (
                        By.CSS_SELECTOR,
                        "li.box-border.flex.h-\\[50px\\].w-full",
                    )
                )
            )
            agent_elements = driver.find_elements(
                By.CSS_SELECTOR,
                "li.box-border.flex.h-\\[50px\\].w-full",
            )

        for agent_element in agent_elements[:3]:
            try:
                name = "Unknown"
                icon_url = ""
                games = 0
                win_rate = 0.0

                agent_text = agent_element.text

                try:
                    agent_img = agent_element.find_element(
                        By.CSS_SELECTOR, "img[alt='agent image']"
                    )
                    icon_url = agent_img.get_attribute("src") or ""

                    name_selectors = [
                        "div.text-\\[12px\\].font-bold",
                        "div.font-bold",
                    ]

                    for selector in name_selectors:
                        try:
                            name_div = agent_element.find_element(
                                By.CSS_SELECTOR, selector
                            )
                            name = name_div.text.strip()
                            if name:
                                break
                        except:
                            continue

                    win_rate_container = agent_element.find_element(
                        By.CSS_SELECTOR, "div.flex.flex-col.items-end"
                    )
                    wr_span = win_rate_container.find_element(
                        By.CSS_SELECTOR, "span.text-\\[12px\\]"
                    )
                    wr_text = wr_span.text.strip().replace("%", "")
                    win_rate = (
                        float(wr_text) if wr_text and wr_text != "" else 0.0
                    )
                except:
                    wr_match = re.search(r"(\d+(?:\.\d+)?)%", agent_text)
                    if wr_match:
                        win_rate = float(wr_match.group(1))

                games_match = re.search(r"(\d+)\s*매치", agent_text)
                if games_match:
                    games = int(games_match.group(1))

                if name != "Unknown" and (games > 0 or win_rate > 0):
                    top_agents.append(
                        {
                            "name": name,
                            "icon_url": icon_url,
                            "games": games,
                            "win_rate": win_rate,
                        }
                    )
            except Exception:
                continue
    except TimeoutException as e:
        logger.warning(f"VAL agent list timeout: {url}")
    except Exception as e:
        logger.warning(f"VAL agent list error: {url} - {type(e).__name__}")

    return {
        "tier": tier,
        "rank": rank,
        "rr": rr,
        "top_agents": top_agents,
    }


async def get_val(user_id: int) -> Optional[GetValResponseDTO]:
    return await crawler_service.get_val(user_id)
