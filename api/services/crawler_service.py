import asyncio
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Optional

from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

from dtos.lol_dto import GetLolResponseDTO
from dtos.val_dto import GetValResponseDTO
from utils.crawler import get_chrome_options

logger = logging.getLogger(__name__)


WEB_DRIVER_TIMEOUT = 20
PAGE_LOAD_TIMEOUT = 5
SCRIPT_TIMEOUT = 5
AUTO_REFRESH_INTERVAL = 1800


class Cache:
    def __init__(self):
        self.lol: Optional[GetLolResponseDTO] = None
        self.val: Optional[GetValResponseDTO] = None


class CrawlerService:
    def __init__(self):
        self._cache: Dict[int, Cache] = {}
        self._ready = False

        self._refresh_queue: Optional[asyncio.Queue[int]] = None
        self._handle_queue_task: Optional[asyncio.Task] = None
        self._auto_refresh_task: Optional[asyncio.Task] = None

        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._executor: Optional[ThreadPoolExecutor] = None
        self._chrome_service: Optional[Service] = None

    def _init(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._executor = ThreadPoolExecutor(
            max_workers=2, thread_name_prefix="Crawler"
        )

        try:
            self._chrome_service = Service(ChromeDriverManager().install())
            logger.info("ChromeDriver initialized")

            self._refresh_queue = asyncio.Queue()
            self._handle_queue_task = self._loop.create_task(
                self._handle_queue()
            )
            self._auto_refresh_task = self._loop.create_task(
                self._auto_refresh()
            )
            logger.info("Tasks started")
            self._ready = True

            self._loop.run_forever()
        except Exception as e:
            logger.error(f"Thread error: {e}")
            import traceback

            logger.error(traceback.format_exc())
        finally:
            logger.info("Thread cleanup started")
            self._ready = False

            if self._executor:
                try:
                    self._executor.shutdown(wait=True, cancel_futures=True)
                    logger.info("Executor closed")
                except Exception as e:
                    logger.error(f"Executor shutdown error: {e}")

            try:
                self._loop.close()
                logger.info("Loop closed")
            except Exception as e:
                logger.error(f"Loop close error: {e}")

    def _create_driver(self, user_id: int) -> webdriver.Chrome:
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
        logger.info(f"Driver created for user {user_id}")
        return driver

    def _close_driver(self, driver: Optional[webdriver.Chrome], user_id: int):
        if driver:
            try:
                driver.quit()
                logger.info(f"Driver closed for user {user_id}")
            except Exception as e:
                logger.error(f"Driver quit error: {e}")

    def _crawl(
        self,
        user_id: int,
        game_name: str,
        tag_line: str,
        crawl_func,
    ):
        driver = None
        try:
            driver = self._create_driver(user_id)
            result = crawl_func(driver, game_name, tag_line)
            return result
        finally:
            self._close_driver(driver, user_id)

    async def _refresh_cache(self, user_id: int):
        if not self._ready:
            logger.warning(f"Not ready: {user_id}")
            return

        try:
            from entities.user import User
            from utils.database import get_db

            db = next(get_db())
            user = db.query(User).filter(User.user_id == user_id).first()
            db.close()

            if not user:
                logger.error(f"User not found: {user_id}")
                self.remove_cache(user_id)
                return

            if not user.riot_id or "#" not in user.riot_id:
                self.remove_cache(user_id)
                return

            game_name, tag_line = user.riot_id.split("#", 1)
        except Exception as e:
            return

        if not self._executor:
            logger.error(f"Executor not ready: {user_id}")
            return

        from services import lol_service, val_service

        lol_future = self._executor.submit(
            self._crawl,
            user_id,
            game_name,
            tag_line,
            lol_service.crawl_lol,
        )

        try:
            lol_dto = lol_future.result()
            if user_id not in self._cache:
                self._cache[user_id] = Cache()
            self._cache[user_id].lol = GetLolResponseDTO(
                success=True,
                code=200,
                message="LOL info retrieved successfully.",
                data=lol_dto,
            )
            logger.info(f"LOL cached: {user_id}")
        except Exception as e:
            logger.error(
                f"LOL failed: {user_id} - {type(e).__name__}: {str(e)}"
            )
            if user_id in self._cache and self._cache[user_id].lol:
                self._cache[user_id].lol = None
                logger.info(f"LOL cache deleted: {user_id}")

        val_future = self._executor.submit(
            self._crawl,
            user_id,
            game_name,
            tag_line,
            val_service.crawl_val,
        )

        try:
            val_dto = val_future.result()
            if user_id not in self._cache:
                self._cache[user_id] = Cache()
            self._cache[user_id].val = GetValResponseDTO(
                success=True,
                code=200,
                message="VAL info retrieved successfully.",
                data=val_dto,
            )
            logger.info(f"VAL cached: {user_id}")
        except Exception as e:
            logger.error(
                f"VAL failed: {user_id} - {type(e).__name__}: {str(e)}"
            )
            if user_id in self._cache and self._cache[user_id].val:
                self._cache[user_id].val = None
                logger.info(f"VAL cache deleted: {user_id}")

        logger.info(f"Finished: {user_id}")

    async def _handle_queue(self):
        logger.info("Queue started")

        while self._ready:
            try:
                user_id = await self._refresh_queue.get()

                if not self._ready:
                    break

                logger.info(f"Processing: {user_id}")
                await self._refresh_cache(user_id)
                self._refresh_queue.task_done()

            except asyncio.CancelledError:
                logger.info("Queue cancelled")
                break
            except Exception as e:
                logger.error(f"Queue error: {e}")

    async def _auto_refresh(self):
        logger.info("Auto refresh started")

        while self._ready:
            try:
                logger.info("Adding users to queue")

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
                logger.info(f"Added {user_count} users to queue")

                await asyncio.sleep(AUTO_REFRESH_INTERVAL)

            except asyncio.CancelledError:
                logger.info("Auto refresh cancelled")
                break
            except Exception as e:
                logger.error(f"Auto refresh error: {e}")

    async def start(self):
        self._thread = threading.Thread(
            target=self._init,
            daemon=False,
            name="CrawlerThread",
        )
        self._thread.start()

        for _ in range(60):
            if self._ready:
                break
            await asyncio.sleep(1)

        if not self._ready:
            logger.warning("Startup timeout")

    async def stop(self):
        if self._loop:
            try:
                logger.info("Stopping...")
                self._ready = False

                if self._loop.is_running():
                    if self._handle_queue_task:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                self._cancel_task(self._handle_queue_task),
                                self._loop,
                            ).result(timeout=5.0)
                            logger.info("Queue task cancelled")
                        except Exception as e:
                            logger.warning(f"Queue task cancel error: {e}")

                    if self._auto_refresh_task:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                self._cancel_task(self._auto_refresh_task),
                                self._loop,
                            ).result(timeout=5.0)
                            logger.info("Background task cancelled")
                        except Exception as e:
                            logger.warning(f"Background task cancel error: {e}")

                    self._loop.call_soon_threadsafe(self._loop.stop)
                    logger.info("Loop stop signal sent")

                if self._thread and self._thread.is_alive():
                    self._thread.join(timeout=5.0)
                    if self._thread.is_alive():
                        logger.warning("Thread still alive after timeout")
                    else:
                        logger.info("Thread stopped")

                logger.info("Stopped")
            except Exception as e:
                logger.error(f"Stop error: {e}")
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
            logger.error("Not ready")
            return

        if not self._loop or not self._loop.is_running():
            logger.error("Loop not running")
            return

        async def _add_to_queue():
            await self._refresh_queue.put(user_id)

        asyncio.run_coroutine_threadsafe(_add_to_queue(), self._loop)
        logger.info(f"Queued: {user_id}")

    def remove_cache(self, user_id: int):
        if user_id in self._cache:
            del self._cache[user_id]
            logger.info(f"Cache removed: {user_id}")

    async def get_lol(self, user_id: int) -> Optional[GetLolResponseDTO]:
        if user_id in self._cache and self._cache[user_id].lol:
            logger.debug(f"LOL hit: {user_id}")
            return self._cache[user_id].lol

        logger.debug(f"LOL miss: {user_id}")
        return None

    async def get_val(self, user_id: int) -> Optional[GetValResponseDTO]:
        if user_id in self._cache and self._cache[user_id].val:
            logger.debug(f"VAL hit: {user_id}")
            return self._cache[user_id].val

        logger.debug(f"VAL miss: {user_id}")
        return None


crawler_service = CrawlerService()
