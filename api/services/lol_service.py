from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import re
import logging

from dtos.lol_dto import LolDto, ChampionDto
from utils.crawler import scrape_with_selenium

logger = logging.getLogger(__name__)


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

            time.sleep(1.5)

            try:
                tier_strong = driver.find_element(
                    By.CSS_SELECTOR, "strong.text-xl.first-letter\\:uppercase"
                )
                tier_text = tier_strong.text.strip()

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
                        champ_text = champ_element.text

                        try:
                            champ_img = champ_element.find_element(
                                By.CSS_SELECTOR, "img.rounded-full"
                            )
                            name = champ_img.get_attribute("alt") or "Unknown"
                            icon_url = champ_img.get_attribute("src") or ""
                        except:
                            name = "Unknown"
                            icon_url = ""

                        games = 0
                        win_rate = 0.0

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

                        try:
                            games_span = champ_element.find_element(
                                By.CSS_SELECTOR,
                                "span.whitespace-nowrap.text-2xs.text-gray-400",
                            )
                            games_text = games_span.text.strip()
                            games_match = re.search(r"(\d+)\s*게임", games_text)
                            if games_match:
                                games = int(games_match.group(1))
                        except:
                            games_match = re.search(r"(\d+)\s*게임", champ_text)
                            if games_match:
                                games = int(games_match.group(1))

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


async def get_lol_info_by_user_id(user_id: int) -> LolDto:
    from utils.database import get_db
    from entities.user import User

    logger.info(f"LOL info get: {user_id}")
    db = next(get_db())
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")

    if not user.riot_id:
        raise ValueError(f"User {user.name} does not have a Riot ID")

    if "#" not in user.riot_id:
        raise ValueError(f"Invalid Riot ID format: {user.riot_id}")

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

    return result
