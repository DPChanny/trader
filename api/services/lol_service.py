from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import re
import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta

from dtos.lol_dto import LolDto, ChampionDto, GetLolResponseDTO
from utils.crawler import scrape_with_selenium
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)

# 캐시 관리
_lol_cache: Dict[int, tuple[GetLolResponseDTO, datetime]] = {}
_cache_duration = timedelta(minutes=5)
_crawl_semaphore = asyncio.Semaphore(2)
_is_refreshing = False
_background_task: Optional[asyncio.Task] = None
_is_running = False


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
                            small_spans = champ_element.find_elements(
                                By.CSS_SELECTOR,
                                "span.text-2xs.text-gray-400",
                            )
                            for span in small_spans:
                                span_text = span.text.strip()
                                games_match = re.search(
                                    r"(\d+)\s*게임", span_text
                                )
                                if games_match:
                                    games = int(games_match.group(1))
                                    break

                            if games == 0:
                                games_match = re.search(
                                    r"(\d+)\s*게임", champ_text
                                )
                                if games_match:
                                    games = int(games_match.group(1))
                        except Exception as e:
                            logger.error(f"Games extraction error: {str(e)}")
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


async def _get_lol(user_id: int) -> GetLolResponseDTO:
    from utils.database import get_db
    from entities.user import User

    try:
        logger.info(f"LOL info get: {user_id}")
        db = next(get_db())
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


async def get_lol(user_id: int) -> Optional[GetLolResponseDTO]:
    """LOL 정보 조회 (캐시 우선)"""
    # 캐시 확인
    if user_id in _lol_cache:
        data, timestamp = _lol_cache[user_id]
        if datetime.now() - timestamp < _cache_duration:
            logger.debug(f"LOL cache hit for user {user_id}")
            return data
        else:
            logger.debug(f"LOL cache expired for user {user_id}")

    # 캐시 미스 또는 만료 - 새로 조회 (세마포어로 동시성 제한)
    async with _crawl_semaphore:
        # 세마포어 획득 중 다른 요청이 캐시를 채웠을 수 있으니 다시 확인
        if user_id in _lol_cache:
            data, timestamp = _lol_cache[user_id]
            if datetime.now() - timestamp < _cache_duration:
                logger.debug(f"LOL cache hit after wait for user {user_id}")
                return data

        try:
            logger.info(f"Fetching fresh LOL data for user {user_id}")
            data = await _get_lol(user_id)
            _lol_cache[user_id] = (data, datetime.now())
            return data
        except Exception as e:
            logger.error(
                f"Failed to fetch LOL info for user {user_id}: {str(e)}"
            )
            # 캐시에 오래된 데이터라도 있으면 반환
            if user_id in _lol_cache:
                logger.warning(f"Returning stale LOL cache for user {user_id}")
                return _lol_cache[user_id][0]
            raise


async def start_lol_cache_service():
    """LOL 캐시 서비스 시작"""
    global _is_running, _background_task

    if _is_running:
        logger.warning("LOL cache service is already running")
        return

    _is_running = True
    logger.info("Starting LOL cache service...")
    _background_task = asyncio.create_task(_background_refresh())
    logger.info("LOL cache service started successfully")


async def stop_lol_cache_service():
    """LOL 캐시 서비스 중지"""
    global _is_running, _background_task

    _is_running = False
    if _background_task:
        _background_task.cancel()
        try:
            await _background_task
        except asyncio.CancelledError:
            pass
    logger.info("LOL cache service stopped")


async def _refresh_all_lol_caches():
    """모든 사용자의 LOL 정보 캐시 갱신"""
    global _is_refreshing

    if _is_refreshing:
        logger.info("LOL cache refresh already in progress, skipping...")
        return

    _is_refreshing = True
    from utils.database import get_db
    from entities.user import User

    logger.info("Starting LOL cache refresh for all users...")

    try:
        db = next(get_db())
        users = db.query(User).filter(User.riot_id.isnot(None)).all()
        logger.info(f"Found {len(users)} users with Riot ID for LOL")

        tasks = []
        for user in users:
            if user.riot_id and "#" in user.riot_id:
                tasks.append(_refresh_lol_cache(user.user_id))

        # 한 번에 1개씩만 처리
        for i in range(0, len(tasks), 1):
            batch = tasks[i : i + 1]
            await asyncio.gather(*batch, return_exceptions=True)
            await asyncio.sleep(3)

        logger.info(f"LOL cache refresh completed. Cached: {len(_lol_cache)}")

    except Exception as e:
        logger.error(f"Error during LOL cache refresh: {str(e)}")
    finally:
        _is_refreshing = False


async def _refresh_lol_cache(user_id: int):
    """단일 사용자 LOL 캐시 갱신"""
    try:
        data = await _get_lol(user_id)
        _lol_cache[user_id] = (data, datetime.now())
        logger.debug(f"LOL cache refreshed for user {user_id}")
    except Exception as e:
        logger.warning(
            f"Failed to refresh LOL cache for user {user_id}: {str(e)}"
        )


async def _background_refresh():
    """5분마다 캐시를 갱신하는 백그라운드 작업"""
    # 시작 직후 즉시 첫 크롤링 실행
    if _is_running:
        logger.info("Initial LOL cache refresh triggered")
        await _refresh_all_lol_caches()

    while _is_running:
        try:
            await asyncio.sleep(300)  # 5분 대기
            if _is_running:
                logger.info("Background LOL cache refresh triggered")
                await _refresh_all_lol_caches()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in LOL background refresh: {str(e)}")
