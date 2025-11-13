from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import re
import logging

from typing import Optional

from dtos.lol_dto import LolDto, ChampionDto, GetLolResponseDTO
from utils.crawler import scrape_with_selenium, CrawlerCacheManager
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)

_lol_cache_manager: CrawlerCacheManager[GetLolResponseDTO] = None


async def scrape_opgg_profile(game_name: str, tag_line: str) -> dict:
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://op.gg/ko/lol/summoners/kr/{encoded_name}-{tag_line}?queue_type=SOLORANKED"

    def scraper_logic(driver, wait):
        tier = "Unranked"
        rank = ""
        lp = 0
        top_champions = []

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
                    "strong.text-xl.first-letter\\:uppercase",
                    "strong[class*='text-xl']",
                    "div[class*='TierRankInfo'] strong",
                    "strong",
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
                    tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)(?:\s+(I|II|III|IV|1|2|3|4))?"
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

            except Exception as e:
                logger.error(f"Tier info extraction error: {str(e)}")
                tier = "Unranked"
                rank = ""
                lp = 0

            top_champions = []
            try:
                champ_elements = driver.find_elements(
                    By.CSS_SELECTOR,
                    "li.box-border.flex.w-full.items-center.border-b",
                )

                for idx, champ_element in enumerate(champ_elements[:3], 1):
                    try:
                        name = "Unknown"
                        icon_url = ""
                        games = 0
                        win_rate = 0.0

                        champ_text = champ_element.text

                        try:
                            champ_img = champ_element.find_element(
                                By.CSS_SELECTOR, "img.rounded-full"
                            )
                            name = champ_img.get_attribute("alt") or "Unknown"
                            icon_url = champ_img.get_attribute("src") or ""
                        except:
                            pass

                        try:
                            wr_span = champ_element.find_element(
                                By.CSS_SELECTOR,
                                "span[data-tooltip-content='승률']",
                            )
                            wr_text = wr_span.text.strip().replace("%", "")
                            win_rate = float(wr_text) if wr_text else 0.0
                        except:
                            wr_match = re.search(r"(\d+)%", champ_text)
                            if wr_match:
                                win_rate = float(wr_match.group(1))

                        games_match = re.search(r"(\d+)\s*게임", champ_text)
                        if games_match:
                            games = int(games_match.group(1))
                        else:
                            try:
                                small_spans = champ_element.find_elements(
                                    By.CSS_SELECTOR,
                                    "span.text-2xs.text-gray-400",
                                )
                                for span in small_spans:
                                    try:
                                        span_text = span.text.strip()
                                        games_match = re.search(
                                            r"(\d+)\s*게임", span_text
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
                            top_champions.append(
                                {
                                    "name": name,
                                    "icon_url": icon_url,
                                    "games": games,
                                    "win_rate": win_rate,
                                }
                            )

                    except Exception as e:
                        logger.error(f"Champion processing error: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Champion extraction error: {str(e)}")
                top_champions = []
        except Exception as e:
            logger.error(f"Crawling error: {str(e)}")

        return {
            "tier": tier,
            "rank": rank,
            "lp": lp,
            "top_champions": top_champions,
        }

    return await scrape_with_selenium(url, scraper_logic)


async def _get_lol(user_id: int) -> GetLolResponseDTO:
    from utils.database import get_db
    from entities.user import User

    db = next(get_db())
    try:
        logger.info(f"LOL info get: {user_id}")
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

        opgg_data = await scrape_opgg_profile(game_name, tag_line)

        top_champions = []
        for champ in opgg_data["top_champions"]:
            top_champions.append(
                ChampionDto(
                    name=champ["name"],
                    icon_url=champ["icon_url"],
                    games=champ["games"],
                    win_rate=champ["win_rate"],
                )
            )

        result = LolDto(
            tier=opgg_data["tier"],
            rank=opgg_data["rank"],
            lp=opgg_data["lp"],
            top_champions=top_champions,
        )

        return GetLolResponseDTO(
            success=True,
            code=200,
            message="LOL info retrieved successfully.",
            data=result,
        )

    except Exception as e:
        handle_exception(e, db)
    finally:
        db.close()


async def get_lol(user_id: int) -> Optional[GetLolResponseDTO]:
    global _lol_cache_manager
    if _lol_cache_manager is None:
        _lol_cache_manager = CrawlerCacheManager("LOL", _get_lol)
    return await _lol_cache_manager.get(user_id)


async def start_lol_cache_service():
    global _lol_cache_manager
    if _lol_cache_manager is None:
        _lol_cache_manager = CrawlerCacheManager("LOL", _get_lol)
    await _lol_cache_manager.start()


async def stop_lol_cache_service():
    global _lol_cache_manager
    if _lol_cache_manager:
        await _lol_cache_manager.stop()


async def refresh_cache(user_id: int):
    global _lol_cache_manager
    if _lol_cache_manager is None:
        _lol_cache_manager = CrawlerCacheManager("LOL", _get_lol)
    await _lol_cache_manager.refresh_cache(user_id)


def invalidate_cache(user_id: int):
    global _lol_cache_manager
    if _lol_cache_manager:
        _lol_cache_manager.invalidate_cache(user_id)
