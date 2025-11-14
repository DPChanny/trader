import asyncio
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, Generic, Optional, TypeVar

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)

T = TypeVar("T")


def get_chrome_options() -> Options:
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    chrome_options.add_experimental_option(
        "excludeSwitches", ["enable-automation"]
    )
    chrome_options.add_experimental_option("useAutomationExtension", False)
    return chrome_options


def get_chrome_driver() -> webdriver.Chrome:
    chrome_options = get_chrome_options()
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    driver.set_page_load_timeout(8)
    driver.set_script_timeout(8)
    driver.implicitly_wait(5)
    return driver


def wait_for_page_load(driver: webdriver.Chrome, timeout: int = 5):
    wait = WebDriverWait(driver, timeout)

    try:
        wait.until(
            lambda d: d.execute_script("return document.readyState")
            == "complete"
        )
    except:
        pass

    try:
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    except:
        pass

    try:
        wait.until(
            lambda d: d.execute_script(
                "return typeof jQuery === 'undefined' || jQuery.active === 0"
            )
        )
    except:
        pass

    try:
        wait.until(
            lambda d: d.execute_script(
                """
                return window.performance.getEntriesByType('resource')
                    .every(r => r.responseEnd > 0);
                """
            )
        )
    except:
        pass

    time.sleep(0.3)


class CrawlerCacheManager(Generic[T]):
    def __init__(self, name: str, fetch_func: Callable[[int], Any]):
        self.name = name
        self.fetch_func = fetch_func

        self._cache: Dict[int, T] = {}
        self._is_running = False

        self._background_queue: Optional[asyncio.Queue[int]] = None
        self._queue_processor_task: Optional[asyncio.Task] = None
        self._background_task: Optional[asyncio.Task] = None

        self._driver: Optional[webdriver.Chrome] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._executor: Optional[ThreadPoolExecutor] = None
        self._driver_lock: threading.Lock = threading.Lock()

    def _run_selenium(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._executor = ThreadPoolExecutor(
            max_workers=1, thread_name_prefix=f"{self.name}-Selenium"
        )

        try:
            self._driver = get_chrome_driver()
            logger.info(f"{self.name} Chrome driver initialized")

            self._background_queue = asyncio.Queue()
            self._queue_processor_task = self._loop.create_task(
                self._process_queue()
            )
            self._background_task = self._loop.create_task(
                self._periodic_refresh()
            )
            logger.info(f"{self.name} background tasks started")

            self._loop.run_forever()
        except Exception as e:
            logger.error(f"{self.name} thread error: {e}")
        finally:
            if self._executor:
                try:
                    self._executor.shutdown(wait=True, cancel_futures=True)
                    logger.info(f"{self.name} executor closed")
                except:
                    pass
            if self._driver:
                try:
                    self._driver.quit()
                    logger.info(f"{self.name} driver closed")
                except:
                    pass
            self._loop.close()

    def _ensure_thread_started(self):
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(
                target=self._run_selenium,
                daemon=True,
                name=f"Crawler-{self.name}",
            )
            self._thread.start()

            for _ in range(50):
                if self._driver is not None and self._executor is not None:
                    break
                time.sleep(0.1)

    async def _scrape_with_selenium(
        self,
        url: str,
        scraper_func: Callable[
            [webdriver.Chrome, WebDriverWait], Dict[str, Any]
        ],
        timeout: int = 8,
    ) -> Dict[str, Any]:
        if not self._is_running:
            logger.debug(f"{self.name} service stopped, skipping scrape")
            return {}

        self._ensure_thread_started()

        if not self._driver or not self._loop:
            logger.error(f"{self.name} Selenium not ready")
            return {}

        def _scrape_sync():
            logger.debug(f"{self.name} scraping started for {url}")
            with self._driver_lock:
                try:
                    logger.debug(f"{self.name} lock acquired, loading page")
                    self._driver.get(url)
                    wait_for_page_load(self._driver, timeout=5)
                    wait = WebDriverWait(self._driver, 5)
                    result = scraper_func(self._driver, wait)
                    logger.debug(f"{self.name} scraping completed for {url}")
                    return result
                except Exception as e:
                    import traceback

                    logger.error(
                        f"{self.name} crawling error for {url}: {str(e)}"
                    )
                    logger.error(traceback.format_exc())
                    return {}

        try:
            if not self._executor:
                logger.error(f"{self.name} executor not ready")
                return {}

            logger.debug(f"{self.name} submitting scrape task")
            future = self._executor.submit(_scrape_sync)
            result = future.result(timeout=timeout)
            return result
        except Exception as e:
            import traceback

            logger.error(f"{self.name} scraping error: {str(e)}")
            logger.error(traceback.format_exc())
            return {}

    async def get(self, user_id: int) -> Optional[T]:
        if user_id in self._cache:
            logger.debug(f"{self.name} cache hit for user {user_id}")
            return self._cache[user_id]

        logger.debug(f"{self.name} cache miss for user {user_id}")
        return None

    async def start(self):
        if self._is_running:
            logger.warning(f"{self.name} service already running")
            return

        self._is_running = True
        logger.info(f"Starting {self.name} service...")

        self._ensure_thread_started()

        for _ in range(50):
            if self._queue_processor_task and self._background_task:
                break
            await asyncio.sleep(0.1)

        logger.info(f"{self.name} service started")

    async def stop(self):
        self._is_running = False
        logger.info(f"Stopping {self.name} service...")

        if self._loop and self._loop.is_running():
            if self._queue_processor_task:
                self._loop.call_soon_threadsafe(
                    self._queue_processor_task.cancel
                )
            if self._background_task:
                self._loop.call_soon_threadsafe(self._background_task.cancel)

            if self._driver:
                try:
                    self._loop.call_soon_threadsafe(self._driver.quit)
                    logger.info(f"{self.name} driver closed")
                except:
                    pass

            await asyncio.sleep(0.5)
            self._loop.call_soon_threadsafe(self._loop.stop)
            logger.info(f"{self.name} loop stopped")

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3.0)
            logger.info(f"{self.name} thread stopped")

        logger.info(f"{self.name} service stopped")

    def invalidate_cache(self, user_id: int):
        if self._background_queue:
            self._background_queue.put_nowait(user_id)
            logger.info(f"{self.name} user {user_id} queued for refresh")

    async def _refresh_cache(self, user_id: int):
        if not self._is_running:
            return

        from entities.user import User
        from utils.database import get_db

        try:
            db = next(get_db())
            user = db.query(User).filter(User.user_id == user_id).first()
            db.close()

            if not user:
                logger.warning(f"{self.name} user {user_id} not found")
                return

            if not user.riot_id or "#" not in user.riot_id:
                logger.debug(f"{self.name} user {user_id} invalid riot_id")
                return

            data = await asyncio.wait_for(self.fetch_func(user_id), timeout=9)
            self._cache[user_id] = data
            logger.debug(f"{self.name} cache refreshed: {user_id}")

        except asyncio.TimeoutError:
            logger.warning(f"{self.name} refresh timeout: {user_id}")
        except Exception as e:
            logger.warning(f"{self.name} refresh failed {user_id}: {e}")

    async def _process_queue(self):
        logger.info(f"{self.name} queue processor started")

        while self._is_running:
            try:
                user_id = await self._background_queue.get()

                if not self._is_running:
                    break

                logger.info(f"{self.name} processing user {user_id}")
                await self._refresh_cache(user_id)
                self._background_queue.task_done()

                await asyncio.sleep(3)

            except asyncio.CancelledError:
                logger.info(f"{self.name} queue processor cancelled")
                break
            except Exception as e:
                logger.error(f"{self.name} queue processor error: {e}")
                await asyncio.sleep(5)

    async def _periodic_refresh(self):
        logger.info(f"{self.name} periodic refresh started")

        while self._is_running:
            try:
                logger.info(f"{self.name} adding users to refresh queue")

                from entities.user import User
                from utils.database import get_db

                db = next(get_db())
                users = db.query(User).filter(User.riot_id.isnot(None)).all()

                user_count = 0
                for user in users:
                    if user.riot_id and "#" in user.riot_id:
                        self._background_queue.put_nowait(user.user_id)
                        user_count += 1

                db.close()
                logger.info(f"{self.name} added {user_count} users to queue")

                await asyncio.sleep(600)

            except asyncio.CancelledError:
                logger.info(f"{self.name} periodic refresh cancelled")
                break
            except Exception as e:
                logger.error(f"{self.name} periodic refresh error: {e}")
                await asyncio.sleep(60)
