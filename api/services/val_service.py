from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import re
import logging

from typing import Optional

from dtos.val_dto import ValDto, AgentDto, GetValResponseDTO
from utils.crawler import scrape_with_selenium, CrawlerCacheManager
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)

_val_cache_manager: CrawlerCacheManager[GetValResponseDTO] = None


async def scrape_opgg_valorant_profile(game_name: str, tag_line: str) -> dict:
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://op.gg/ko/valorant/profile/kr/{encoded_name}-{tag_line}"

    def scraper_logic(driver, wait):
        tier = "Unranked"
        rank = ""
        rr = 0
        top_agents = []

        try:
            try:
                wait.until(
                    EC.presence_of_element_located(
                        (
                            By.CSS_SELECTOR,
                            "[class*='GameStat'], [class*='Content'], main, #content-container",
                        )
                    )
                )
            except:
                pass

            import time

            time.sleep(1)

            try:
                tier_element = None
                tier_selectors = [
                    "div.text-\\[14px\\].font-bold.md\\:text-\\[20px\\]",
                    "div[class*='font-bold'][class*='text-']",
                    "div[class*='TierInfo'] div.font-bold",
                    "div.font-bold",
                ]

                for selector in tier_selectors:
                    try:
                        tier_element = driver.find_element(
                            By.CSS_SELECTOR, selector
                        )
                        if tier_element and tier_element.text.strip():
                            break
                    except:
                        continue

                if tier_element:
                    tier_text = tier_element.text.strip()
                    tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant)(?:\s+(1|2|3))?"
                    tier_match = re.search(
                        tier_pattern, tier_text, re.IGNORECASE
                    )

                    if tier_match:
                        tier = tier_match.group(1).capitalize()
                        rank = (
                            tier_match.group(2) if tier_match.group(2) else ""
                        )
                    else:
                        tier = "Unranked"
                        rank = ""
                else:
                    tier = "Unranked"
                    rank = ""

                rr = 0

            except Exception as e:
                logger.error(f"Tier info extraction error: {str(e)}")
                tier = "Unranked"
                rank = ""
                rr = 0

            top_agents = []
            try:
                agent_elements = driver.find_elements(
                    By.CSS_SELECTOR,
                    "li.box-border.flex.h-\\[50px\\].w-full.items-center.justify-between",
                )

                for idx, agent_element in enumerate(agent_elements[:3], 1):
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
                            name_div = agent_element.find_element(
                                By.CSS_SELECTOR, "div.text-\\[12px\\].font-bold"
                            )
                            name = name_div.text.strip()
                            icon_url = agent_img.get_attribute("src") or ""
                        except:
                            pass

                        try:
                            wr_span = agent_element.find_element(
                                By.CSS_SELECTOR,
                                "span.text-\\[12px\\].text-main-500",
                            )
                            wr_text = wr_span.text.strip().replace("%", "")
                            win_rate = float(wr_text) if wr_text else 0.0
                        except:
                            try:
                                wr_spans = agent_element.find_elements(
                                    By.CSS_SELECTOR, "span.text-\\[12px\\]"
                                )
                                for span in wr_spans:
                                    try:
                                        text = span.text.strip()
                                        if "%" in text:
                                            win_rate = float(
                                                text.replace("%", "")
                                            )
                                            break
                                    except:
                                        continue
                            except:
                                wr_match = re.search(r"(\d+)%", agent_text)
                                if wr_match:
                                    win_rate = float(wr_match.group(1))

                        games_match = re.search(r"(\d+)\s*매치", agent_text)
                        if games_match:
                            games = int(games_match.group(1))
                        else:
                            try:
                                small_spans = agent_element.find_elements(
                                    By.CSS_SELECTOR,
                                    "span.text-\\[11px\\].text-darkpurple-400",
                                )
                                for span in small_spans:
                                    try:
                                        span_text = span.text.strip()
                                        games_match = re.search(
                                            r"(\d+)\s*매치", span_text
                                        )
                                        if games_match:
                                            games = int(games_match.group(1))
                                            break
                                    except:
                                        continue
                            except Exception as e:
                                logger.debug(
                                    f"Span extraction failed: {str(e)}"
                                )

                        if name != "Unknown" and (games > 0 or win_rate > 0):
                            top_agents.append(
                                {
                                    "name": name,
                                    "icon_url": icon_url,
                                    "games": games,
                                    "win_rate": win_rate,
                                }
                            )

                    except Exception as e:
                        logger.error(f"Agent processing error: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Agent extraction error: {str(e)}")
                top_agents = []
        except Exception as e:
            logger.error(f"Crawling error: {str(e)}")

        return {
            "tier": tier,
            "rank": rank,
            "rr": rr,
            "top_agents": top_agents,
        }

    return await scrape_with_selenium(url, scraper_logic)


async def _get_val(user_id: int) -> GetValResponseDTO:
    from utils.database import get_db
    from entities.user import User

    db = next(get_db())
    try:
        logger.info(f"VAL info get: {user_id}")
        user = db.query(User).filter(User.user_id == user_id).first()

        if not user:
            raise CustomException(404, f"User with id {user_id} not found")

        if not user.riot_id:
            raise CustomException(
                404, f"User {user.name} does not have a Riot ID"
            )

        if "#" not in user.riot_id:
            raise CustomException(
                400, f"Invalid Riot ID format: {user.riot_id}"
            )

        game_name, tag_line = user.riot_id.split("#", 1)

        opgg_data = await scrape_opgg_valorant_profile(game_name, tag_line)

        top_agents = []
        for agent in opgg_data["top_agents"]:
            top_agents.append(
                AgentDto(
                    name=agent["name"],
                    icon_url=agent["icon_url"],
                    games=agent["games"],
                    win_rate=agent["win_rate"],
                )
            )

        result = ValDto(
            tier=opgg_data["tier"],
            rank=opgg_data["rank"],
            rr=opgg_data["rr"],
            top_agents=top_agents,
        )

        return GetValResponseDTO(
            success=True,
            code=200,
            message="VAL info retrieved successfully.",
            data=result,
        )

    except Exception as e:
        handle_exception(e, db)
    finally:
        db.close()


async def get_val(user_id: int) -> Optional[GetValResponseDTO]:
    global _val_cache_manager
    if _val_cache_manager is None:
        _val_cache_manager = CrawlerCacheManager("VAL", _get_val)
    return await _val_cache_manager.get(user_id)


async def start_val_cache_service():
    global _val_cache_manager
    if _val_cache_manager is None:
        _val_cache_manager = CrawlerCacheManager("VAL", _get_val)
    await _val_cache_manager.start()


async def stop_val_cache_service():
    global _val_cache_manager
    if _val_cache_manager:
        await _val_cache_manager.stop()


async def refresh_cache(user_id: int):
    """특정 사용자 VAL 캐시 즉시 갱신"""
    global _val_cache_manager
    if _val_cache_manager is None:
        _val_cache_manager = CrawlerCacheManager("VAL", _get_val)
    await _val_cache_manager.refresh_cache(user_id)


def invalidate_cache(user_id: int):
    """특정 사용자 VAL 캐시 무효화"""
    global _val_cache_manager
    if _val_cache_manager:
        _val_cache_manager.invalidate_cache(user_id)
