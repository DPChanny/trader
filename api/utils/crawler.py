"""OP.GG 크롤링을 위한 공통 유틸리티"""

import re
import asyncio
import time
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Dict, Callable, Any, Optional, TypeVar, Generic
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)

_global_driver: Optional[webdriver.Chrome] = None
_driver_lock = asyncio.Lock()
_selenium_executor: Optional[ThreadPoolExecutor] = None

T = TypeVar("T")


def get_chrome_options():
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")

    chrome_options.add_experimental_option(
        "excludeSwitches", ["enable-automation"]
    )
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return chrome_options


def get_chrome_driver():
    chrome_options = get_chrome_options()
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


def get_selenium_executor():
    global _selenium_executor
    if _selenium_executor is None:
        _selenium_executor = ThreadPoolExecutor(
            max_workers=2, thread_name_prefix="selenium"
        )
        logger.info("Selenium ThreadPoolExecutor initialized")
    return _selenium_executor


async def get_global_driver():
    global _global_driver

    async with _driver_lock:
        if _global_driver is None:
            executor = get_selenium_executor()
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(
                executor, get_chrome_driver
            )
            logger.info("Global Chrome driver initialized")

        try:
            _ = _global_driver.current_url
        except:
            logger.warning("Driver restart required")
            executor = get_selenium_executor()
            loop = asyncio.get_event_loop()
            _global_driver = await loop.run_in_executor(
                executor, get_chrome_driver
            )

    return _global_driver


async def cleanup_driver():
    global _global_driver, _selenium_executor

    async with _driver_lock:
        if _global_driver is not None:
            try:
                _global_driver.quit()
                logger.info("Global Chrome driver closed")
            except Exception as e:
                logger.error(f"Error closing Chrome driver: {str(e)}")
            finally:
                _global_driver = None

        if _selenium_executor is not None:
            try:
                _selenium_executor.shutdown(wait=True, cancel_futures=True)
                logger.info("Selenium ThreadPoolExecutor shutdown")
            except Exception as e:
                logger.error(f"Error shutting down executor: {str(e)}")
            finally:
                _selenium_executor = None


def wait_for_page_load(driver: webdriver.Chrome, timeout: int = 10):
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

    time.sleep(0.8)

    try:
        wait.until(
            lambda d: d.execute_script(
                "return typeof jQuery === 'undefined' || jQuery.active === 0"
            )
        )
    except:
        pass


async def scrape_with_selenium(
    url: str,
    scraper_func: Callable[[webdriver.Chrome, WebDriverWait], Dict[str, Any]],
) -> Dict[str, Any]:
    driver = await get_global_driver()

    def _scrape_sync():
        try:
            driver.get(url)

            wait_for_page_load(driver, timeout=10)

            wait = WebDriverWait(driver, 10)
            return scraper_func(driver, wait)
        except Exception as e:
            logger.error(f"Crawling error for {url}: {str(e)}")
            return {}

    try:
        executor = get_selenium_executor()
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _scrape_sync)
        return result
    except Exception as e:
        logger.error(f"Executor error: {str(e)}")
        return {}


class CrawlerCacheManager(Generic[T]):
    def __init__(
        self,
        name: str,
        fetch_func: Callable[[int], Any],
        cache_duration_minutes: int = 5,
        max_concurrent: int = 2,
    ):
        self.name = name
        self.fetch_func = fetch_func
        self._cache: Dict[int, tuple[T, datetime]] = {}
        self._cache_duration = timedelta(minutes=cache_duration_minutes)
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._is_refreshing = False
        self._background_task: Optional[asyncio.Task] = None
        self._is_running = False

    async def get(self, user_id: int) -> Optional[T]:
        if user_id in self._cache:
            data, timestamp = self._cache[user_id]
            if datetime.now() - timestamp < self._cache_duration:
                logger.debug(f"{self.name} cache hit for user {user_id}")
                return data
            else:
                logger.debug(f"{self.name} cache expired for user {user_id}")

        async with self._semaphore:
            if user_id in self._cache:
                data, timestamp = self._cache[user_id]
                if datetime.now() - timestamp < self._cache_duration:
                    logger.debug(
                        f"{self.name} cache hit after wait for user {user_id}"
                    )
                    return data

            try:
                logger.info(
                    f"Fetching fresh {self.name} data for user {user_id}"
                )
                data = await self.fetch_func(user_id)
                self._cache[user_id] = (data, datetime.now())
                return data
            except Exception as e:
                logger.error(
                    f"Failed to fetch {self.name} info for user {user_id}: {str(e)}"
                )
                if user_id in self._cache:
                    logger.warning(
                        f"Returning stale {self.name} cache for user {user_id}"
                    )
                    return self._cache[user_id][0]
                raise

    async def start(self):
        if self._is_running:
            logger.warning(f"{self.name} cache service is already running")
            return

        self._is_running = True
        logger.info(f"Starting {self.name} cache service...")
        self._background_task = asyncio.create_task(self._background_refresh())
        logger.info(f"{self.name} cache service started successfully")

    async def stop(self):
        self._is_running = False
        if self._background_task:
            self._background_task.cancel()
            try:
                await self._background_task
            except asyncio.CancelledError:
                pass
        logger.info(f"{self.name} cache service stopped")

    def invalidate_cache(self, user_id: int):
        """캐시 무효화"""
        if user_id in self._cache:
            del self._cache[user_id]
            logger.info(f"{self.name} cache invalidated for user {user_id}")

    async def refresh_cache(self, user_id: int):
        """특정 사용자 캐시 즉시 갱신"""
        try:
            logger.info(
                f"Force refreshing {self.name} cache for user {user_id}"
            )
            data = await self.fetch_func(user_id)
            self._cache[user_id] = (data, datetime.now())
            logger.info(f"{self.name} cache force refreshed for user {user_id}")
        except Exception as e:
            logger.error(
                f"Failed to force refresh {self.name} cache for user {user_id}: {str(e)}"
            )

    async def _refresh_all(self):
        if self._is_refreshing:
            logger.info(
                f"{self.name} cache refresh already in progress, skipping..."
            )
            return

        self._is_refreshing = True
        from utils.database import get_db
        from entities.user import User

        logger.info(f"Starting {self.name} cache refresh for all users...")

        try:
            db = next(get_db())
            users = db.query(User).filter(User.riot_id.isnot(None)).all()
            logger.info(
                f"Found {len(users)} users with Riot ID for {self.name}"
            )

            tasks = []
            for user in users:
                if user.riot_id and "#" in user.riot_id:
                    tasks.append(self._refresh_single(user.user_id))

            for i in range(0, len(tasks), 1):
                batch = tasks[i : i + 1]
                await asyncio.gather(*batch, return_exceptions=True)
                await asyncio.sleep(3)

            logger.info(
                f"{self.name} cache refresh completed. Cached: {len(self._cache)}"
            )

        except Exception as e:
            logger.error(f"Error during {self.name} cache refresh: {str(e)}")
        finally:
            self._is_refreshing = False
            db.close()

    async def _refresh_single(self, user_id: int):
        try:
            data = await self.fetch_func(user_id)
            self._cache[user_id] = (data, datetime.now())
            logger.debug(f"{self.name} cache refreshed for user {user_id}")
        except Exception as e:
            logger.warning(
                f"Failed to refresh {self.name} cache for user {user_id}: {str(e)}"
            )

    async def _background_refresh(self):
        if self._is_running:
            logger.info(f"Initial {self.name} cache refresh triggered")
            await self._refresh_all()

        while self._is_running:
            try:
                await asyncio.sleep(300)
                if self._is_running:
                    logger.info(
                        f"Background {self.name} cache refresh triggered"
                    )
                    await self._refresh_all()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Error in {self.name} background refresh: {str(e)}"
                )
