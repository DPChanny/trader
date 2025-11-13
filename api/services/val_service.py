from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import re
import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta

from dtos.val_dto import ValDto, AgentDto, GetValResponseDTO
from utils.crawler import scrape_with_selenium
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)

# 캐시 관리
_val_cache: Dict[int, tuple[GetValResponseDTO, datetime]] = {}
_cache_duration = timedelta(minutes=5)
_crawl_semaphore = asyncio.Semaphore(2)
_is_refreshing = False
_background_task: Optional[asyncio.Task] = None
_is_running = False


async def scrape_opgg_valorant_profile(game_name: str, tag_line: str) -> dict:
    """OP.GG Valorant 프로필 페이지를 Selenium으로 크롤링하여 랭크 정보 및 에이전트 통계 추출"""
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

            time.sleep(1.5)

            try:
                tier_div = driver.find_element(
                    By.CSS_SELECTOR,
                    "div.text-\\[14px\\].font-bold.md\\:text-\\[20px\\]",
                )
                tier_text = tier_div.text.strip()

                tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant)(?:\s+(1|2|3))?"
                tier_match = re.search(tier_pattern, tier_text, re.IGNORECASE)

                if tier_match:
                    tier = tier_match.group(1).capitalize()
                    rank = tier_match.group(2) if tier_match.group(2) else ""
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
                            name = "Unknown"
                            icon_url = ""

                        games = 0
                        win_rate = 0.0

                        try:
                            try:
                                wr_span = agent_element.find_element(
                                    By.CSS_SELECTOR,
                                    "span.text-\\[12px\\].text-main-500",
                                )
                                wr_text = wr_span.text.strip().replace("%", "")
                                win_rate = float(wr_text) if wr_text else 0.0
                            except:
                                wr_spans = agent_element.find_elements(
                                    By.CSS_SELECTOR, "span.text-\\[12px\\]"
                                )
                                for span in wr_spans:
                                    text = span.text.strip()
                                    if "%" in text:
                                        win_rate = float(text.replace("%", ""))
                                        break
                        except:
                            wr_match = re.search(r"(\d+)%", agent_text)
                            if wr_match:
                                win_rate = float(wr_match.group(1))

                        try:
                            small_spans = agent_element.find_elements(
                                By.CSS_SELECTOR,
                                "span.text-\\[11px\\].text-darkpurple-400",
                            )
                            for span in small_spans:
                                span_text = span.text.strip()
                                games_match = re.search(
                                    r"(\d+)\s*매치", span_text
                                )
                                if games_match:
                                    games = int(games_match.group(1))
                                    break

                            if games == 0:
                                games_match = re.search(
                                    r"(\d+)\s*매치", agent_text
                                )
                                if games_match:
                                    games = int(games_match.group(1))
                        except Exception as e:
                            logger.error(f"Games extraction error: {str(e)}")
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

    try:
        logger.info(f"VAL info get: {user_id}")
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


async def get_val(user_id: int) -> Optional[GetValResponseDTO]:
    """VAL 정보 조회 (캐시 우선)"""
    # 캐시 확인
    if user_id in _val_cache:
        data, timestamp = _val_cache[user_id]
        if datetime.now() - timestamp < _cache_duration:
            logger.debug(f"VAL cache hit for user {user_id}")
            return data
        else:
            logger.debug(f"VAL cache expired for user {user_id}")

    # 캐시 미스 또는 만료 - 새로 조회 (세마포어로 동시성 제한)
    async with _crawl_semaphore:
        # 세마포어 획득 중 다른 요청이 캐시를 채웠을 수 있으니 다시 확인
        if user_id in _val_cache:
            data, timestamp = _val_cache[user_id]
            if datetime.now() - timestamp < _cache_duration:
                logger.debug(f"VAL cache hit after wait for user {user_id}")
                return data

        try:
            logger.info(f"Fetching fresh VAL data for user {user_id}")
            data = await _get_val(user_id)
            _val_cache[user_id] = (data, datetime.now())
            return data
        except Exception as e:
            logger.error(
                f"Failed to fetch VAL info for user {user_id}: {str(e)}"
            )
            # 캐시에 오래된 데이터라도 있으면 반환
            if user_id in _val_cache:
                logger.warning(f"Returning stale VAL cache for user {user_id}")
                return _val_cache[user_id][0]
            raise


async def start_val_cache_service():
    """VAL 캐시 서비스 시작"""
    global _is_running, _background_task

    if _is_running:
        logger.warning("VAL cache service is already running")
        return

    _is_running = True
    logger.info("Starting VAL cache service...")
    _background_task = asyncio.create_task(_background_refresh())
    logger.info("VAL cache service started successfully")


async def stop_val_cache_service():
    """VAL 캐시 서비스 중지"""
    global _is_running, _background_task

    _is_running = False
    if _background_task:
        _background_task.cancel()
        try:
            await _background_task
        except asyncio.CancelledError:
            pass
    logger.info("VAL cache service stopped")


async def _refresh_all_val_caches():
    """모든 사용자의 VAL 정보 캐시 갱신"""
    global _is_refreshing

    if _is_refreshing:
        logger.info("VAL cache refresh already in progress, skipping...")
        return

    _is_refreshing = True
    from utils.database import get_db
    from entities.user import User

    logger.info("Starting VAL cache refresh for all users...")

    try:
        db = next(get_db())
        users = db.query(User).filter(User.riot_id.isnot(None)).all()
        logger.info(f"Found {len(users)} users with Riot ID for VAL")

        tasks = []
        for user in users:
            if user.riot_id and "#" in user.riot_id:
                tasks.append(_refresh_val_cache(user.user_id))

        # 한 번에 1개씩만 처리
        for i in range(0, len(tasks), 1):
            batch = tasks[i : i + 1]
            await asyncio.gather(*batch, return_exceptions=True)
            await asyncio.sleep(3)

        logger.info(f"VAL cache refresh completed. Cached: {len(_val_cache)}")

    except Exception as e:
        logger.error(f"Error during VAL cache refresh: {str(e)}")
    finally:
        _is_refreshing = False


async def _refresh_val_cache(user_id: int):
    """단일 사용자 VAL 캐시 갱신"""
    try:
        data = await _get_val(user_id)
        _val_cache[user_id] = (data, datetime.now())
        logger.debug(f"VAL cache refreshed for user {user_id}")
    except Exception as e:
        logger.warning(
            f"Failed to refresh VAL cache for user {user_id}: {str(e)}"
        )


async def _background_refresh():
    """5분마다 캐시를 갱신하는 백그라운드 작업"""
    # 시작 직후 즉시 첫 크롤링 실행
    if _is_running:
        logger.info("Initial VAL cache refresh triggered")
        await _refresh_all_val_caches()

    while _is_running:
        try:
            await asyncio.sleep(300)  # 5분 대기
            if _is_running:
                logger.info("Background VAL cache refresh triggered")
                await _refresh_all_val_caches()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in VAL background refresh: {str(e)}")
