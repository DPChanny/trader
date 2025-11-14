import asyncio
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Optional

from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

from dtos.lol_dto import LolDto, ChampionDto, GetLolResponseDTO
from dtos.val_dto import ValDto, AgentDto, GetValResponseDTO
from utils.crawler import get_chrome_options

logger = logging.getLogger(__name__)


WEB_DRIVER_TIMEOUT = 10
PAGE_LOAD_TIMEOUT = 5
SCRIPT_TIMEOUT = 5


class CrawlerService:
    def __init__(self):
        self._lol_cache: Dict[int, GetLolResponseDTO] = {}
        self._val_cache: Dict[int, GetValResponseDTO] = {}
        self._ready = False

        self._refresh_queue: Optional[asyncio.Queue[int]] = None
        self._queue_processor_task: Optional[asyncio.Task] = None
        self._background_task: Optional[asyncio.Task] = None

        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._executor: Optional[ThreadPoolExecutor] = None
        self._chrome_service: Optional[Service] = None

    def _init_crawler(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._executor = ThreadPoolExecutor(
            max_workers=1, thread_name_prefix="Crawler"
        )

        try:
            self._chrome_service = Service(ChromeDriverManager().install())
            logger.info("Crawler ChromeDriver path initialized")

            self._refresh_queue = asyncio.Queue()
            self._queue_processor_task = self._loop.create_task(
                self._refresh_queue_task()
            )
            self._background_task = self._loop.create_task(
                self._auto_refresh_task()
            )
            logger.info("Crawler tasks started")
            self._ready = True

            self._loop.run_forever()
        except Exception as e:
            logger.error(f"Crawler thread error: {e}")
            import traceback

            logger.error(traceback.format_exc())
        finally:
            logger.info("Crawler thread cleanup started")
            self._ready = False

            if self._executor:
                try:
                    self._executor.shutdown(wait=True, cancel_futures=True)
                    logger.info("Crawler executor closed")
                except Exception as e:
                    logger.error(f"Executor shutdown error: {e}")

            try:
                self._loop.close()
                logger.info("Crawler loop closed")
            except Exception as e:
                logger.error(f"Loop close error: {e}")

    def _create_driver(self, user_id: int, game_type: str) -> webdriver.Chrome:
        chrome_options = get_chrome_options()
        chrome_options.page_load_strategy = "eager"
        driver = webdriver.Chrome(
            service=self._chrome_service, options=chrome_options
        )
        driver.execute_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
        driver.set_script_timeout(SCRIPT_TIMEOUT)
        driver.implicitly_wait(0)
        logger.info(f"{game_type} driver created for user {user_id}")
        return driver

    def _close_driver(
        self, driver: Optional[webdriver.Chrome], user_id: int, game_type: str
    ):
        if driver:
            try:
                driver.quit()
                logger.info(f"{game_type} driver closed for user {user_id}")
            except Exception as e:
                logger.error(f"{game_type} driver quit error: {e}")

    def _crawl_with_driver(
        self,
        user_id: int,
        game_name: str,
        tag_line: str,
        game_type: str,
        crawl_func,
    ):
        driver = None
        try:
            driver = self._create_driver(user_id, game_type)
            result = crawl_func(driver, game_name, tag_line)
            return result
        finally:
            self._close_driver(driver, user_id, game_type)

    def _update_lol_cache(self, user_id: int, lol_data: dict):
        top_champions = [
            ChampionDto(
                name=champ["name"],
                icon_url=champ["icon_url"],
                games=champ["games"],
                win_rate=champ["win_rate"],
            )
            for champ in lol_data["top_champions"]
        ]

        lol_dto = LolDto(
            tier=lol_data["tier"],
            rank=lol_data["rank"],
            lp=lol_data["lp"],
            top_champions=top_champions,
        )

        self._lol_cache[user_id] = GetLolResponseDTO(
            success=True,
            code=200,
            message="LOL info retrieved successfully.",
            data=lol_dto,
        )
        logger.info(f"Crawler LOL cache refreshed for user {user_id}")

    def _update_val_cache(self, user_id: int, val_data: dict):
        top_agents = [
            AgentDto(
                name=agent["name"],
                icon_url=agent["icon_url"],
                games=agent["games"],
                win_rate=agent["win_rate"],
            )
            for agent in val_data["top_agents"]
        ]

        val_dto = ValDto(
            tier=val_data["tier"],
            rank=val_data["rank"],
            rr=val_data["rr"],
            top_agents=top_agents,
        )

        self._val_cache[user_id] = GetValResponseDTO(
            success=True,
            code=200,
            message="VAL info retrieved successfully.",
            data=val_dto,
        )
        logger.info(f"Crawler VAL cache refreshed for user {user_id}")

    async def _refresh_cache(self, user_id: int):
        if not self._ready:
            logger.warning(f"Crawler not ready for user {user_id}")
            return

        try:
            from entities.user import User
            from utils.database import get_db

            db = next(get_db())
            user = db.query(User).filter(User.user_id == user_id).first()
            db.close()

            if not user:
                logger.warning(f"Crawler user {user_id} not found")
                self.remove_cache(user_id)
                return

            if not user.riot_id or "#" not in user.riot_id:
                logger.warning(
                    f"Crawler user {user_id} invalid riot_id: {user.riot_id}"
                )
                self.remove_cache(user_id)
                return

            game_name, tag_line = user.riot_id.split("#", 1)
        except Exception as e:
            logger.error(
                f"Crawler database error for user {user_id}: {type(e).__name__}"
            )
            return

        if not self._executor:
            logger.error(f"Crawler executor not ready for user {user_id}")
            return

        from services import lol_service

        try:
            logger.info(f"Crawler starting LOL crawl for user {user_id}")
            lol_future = self._executor.submit(
                self._crawl_with_driver,
                user_id,
                game_name,
                tag_line,
                "LOL",
                lol_service.crawl_lol,
            )
            lol_data = lol_future.result()
            self._update_lol_cache(user_id, lol_data)
        except Exception as e:
            logger.error(
                f"Crawler LOL refresh failed {user_id}: {type(e).__name__} - {str(e)}"
            )
            if user_id in self._lol_cache:
                del self._lol_cache[user_id]
                logger.info(f"LOL cache deleted for user {user_id}")

        from services import val_service

        try:
            logger.info(f"Crawler starting VAL crawl for user {user_id}")
            val_future = self._executor.submit(
                self._crawl_with_driver,
                user_id,
                game_name,
                tag_line,
                "VAL",
                val_service.crawl_val,
            )
            val_data = val_future.result()
            self._update_val_cache(user_id, val_data)
        except Exception as e:
            logger.error(
                f"Crawler VAL refresh failed {user_id}: {type(e).__name__} - {str(e)}"
            )
            if user_id in self._val_cache:
                del self._val_cache[user_id]
                logger.info(f"VAL cache deleted for user {user_id}")

        logger.info(f"Crawler finished processing user {user_id}")

    async def _refresh_queue_task(self):
        logger.info("Crawler refresh queue started")

        while self._ready:
            try:
                user_id = await self._refresh_queue.get()

                if not self._ready:
                    break

                logger.info(f"Crawler processing user {user_id}")
                await self._refresh_cache(user_id)
                self._refresh_queue.task_done()

            except asyncio.CancelledError:
                logger.info("Crawler refresh queue cancelled")
                break
            except Exception as e:
                logger.error(f"Crawler refresh queue error: {e}")
                await asyncio.sleep(3)

    async def _auto_refresh_task(self):
        logger.info("Crawler auto refresh started")

        while self._ready:
            try:
                logger.info("Crawler adding users to refresh queue")

                from entities.user import User
                from utils.database import get_db

                db = next(get_db())
                users = db.query(User).filter(User.riot_id.isnot(None)).all()

                user_count = 0
                for user in users:
                    if user.riot_id and "#" in user.riot_id:
                        self._refresh_queue.put_nowait(user.user_id)
                        user_count += 1

                db.close()
                logger.info(f"Crawler added {user_count} users to queue")

                await asyncio.sleep(3600)

            except asyncio.CancelledError:
                logger.info("Crawler auto refresh cancelled")
                break
            except Exception as e:
                logger.error(f"Crawler auto refresh error: {e}")
                await asyncio.sleep(60)

    async def start(self):
        self._thread = threading.Thread(
            target=self._init_crawler,
            daemon=False,
            name="CrawlerThread",
        )
        self._thread.start()

        for _ in range(60):
            if self._ready:
                break
            await asyncio.sleep(1)

        if not self._ready:
            logger.warning("Crawler timeout")

    async def stop(self):
        if self._loop:
            try:
                logger.info("Stopping Crawler service...")
                self._ready = False

                if self._loop.is_running():
                    if self._queue_processor_task:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                self._cancel_task(self._queue_processor_task),
                                self._loop,
                            ).result(timeout=5.0)
                            logger.info(
                                "Crawler queue processor task cancelled"
                            )
                        except Exception as e:
                            logger.warning(
                                f"Queue processor task cancel error: {e}"
                            )

                    if self._background_task:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                self._cancel_task(self._background_task),
                                self._loop,
                            ).result(timeout=5.0)
                            logger.info("Crawler background task cancelled")
                        except Exception as e:
                            logger.warning(f"Background task cancel error: {e}")

                    self._loop.call_soon_threadsafe(self._loop.stop)
                    logger.info("Crawler loop stop signal sent")

                if self._thread and self._thread.is_alive():
                    self._thread.join(timeout=5.0)
                    if self._thread.is_alive():
                        logger.warning(
                            "Crawler thread still alive after timeout"
                        )
                    else:
                        logger.info("Crawler thread stopped")

                logger.info("Crawler service stopped")
            except Exception as e:
                logger.error(f"Crawler stop error: {e}")
                import traceback

                logger.error(traceback.format_exc())

    async def _cancel_task(self, task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    def invalidate_cache(self, user_id: int):
        if not self._ready or not self._refresh_queue:
            logger.error("Crawler not ready")
            return

        if not self._loop or not self._loop.is_running():
            logger.error("Crawler loop not running")
            return

        async def _add_to_queue():
            await self._refresh_queue.put(user_id)

        asyncio.run_coroutine_threadsafe(_add_to_queue(), self._loop)
        logger.info(f"Crawler user {user_id} queued for refresh")

    def remove_cache(self, user_id: int):
        if user_id in self._lol_cache:
            del self._lol_cache[user_id]
            logger.info(f"Crawler LOL cache removed for user {user_id}")

        if user_id in self._val_cache:
            del self._val_cache[user_id]
            logger.info(f"Crawler VAL cache removed for user {user_id}")

    async def get_lol(self, user_id: int) -> Optional[GetLolResponseDTO]:
        if user_id in self._lol_cache:
            logger.debug(f"Crawler LOL cache hit for user {user_id}")
            return self._lol_cache[user_id]

        logger.debug(f"Crawler LOL cache miss for user {user_id}")
        return None

    async def get_val(self, user_id: int) -> Optional[GetValResponseDTO]:
        if user_id in self._val_cache:
            logger.debug(f"Crawler VAL cache hit for user {user_id}")
            return self._val_cache[user_id]

        logger.debug(f"Crawler VAL cache miss for user {user_id}")
        return None


crawler_service = CrawlerService()
