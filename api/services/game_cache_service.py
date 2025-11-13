"""LOL 및 VAL 게임 정보 캐시 서비스"""

import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

from dtos.lol_dto import LolDto, GetLolInfoResponseDTO
from dtos.val_dto import ValDto, GetValInfoResponseDTO
from services.lol_service import _get_lol
from services.val_service import _get_val

logger = logging.getLogger(__name__)


class GameCacheService:
    def __init__(self):
        self._lol_cache: Dict[int, tuple[LolDto, datetime]] = {}
        self._val_cache: Dict[int, tuple[ValDto, datetime]] = {}
        self._cache_duration = timedelta(minutes=5)
        self._background_task: Optional[asyncio.Task] = None
        self._is_running = False
        # 크롤링 동시성 제한을 위한 세마포어
        self._crawl_semaphore = asyncio.Semaphore(2)  # 최대 2개만 동시 크롤링
        self._is_refreshing = False  # 리프레시 중인지 확인

    async def start(self):
        """캐시 서비스 시작 및 백그라운드 작업 실행"""
        if self._is_running:
            logger.warning("Cache service is already running")
            return

        self._is_running = True
        logger.info("Starting game cache service...")

        # 백그라운드 작업 시작 (초기 크롤링은 백그라운드에서)
        self._background_task = asyncio.create_task(self._background_refresh())
        logger.info("Game cache service started successfully")

    async def stop(self):
        """캐시 서비스 중지"""
        self._is_running = False
        if self._background_task:
            self._background_task.cancel()
            try:
                await self._background_task
            except asyncio.CancelledError:
                pass
        logger.info("Game cache service stopped")

    async def get_lol_info(
        self, user_id: int
    ) -> Optional[GetLolInfoResponseDTO]:
        """LOL 정보 조회 (캐시 우선)"""
        # 캐시 확인
        if user_id in self._lol_cache:
            data, timestamp = self._lol_cache[user_id]
            if datetime.now() - timestamp < self._cache_duration:
                logger.debug(f"LOL cache hit for user {user_id}")
                return data
            else:
                logger.debug(f"LOL cache expired for user {user_id}")

        # 캐시 미스 또는 만료 - 새로 조회 (세마포어로 동시성 제한)
        async with self._crawl_semaphore:
            # 세마포어 획득 중 다른 요청이 캐시를 채웠을 수 있으니 다시 확인
            if user_id in self._lol_cache:
                data, timestamp = self._lol_cache[user_id]
                if datetime.now() - timestamp < self._cache_duration:
                    logger.debug(f"LOL cache hit after wait for user {user_id}")
                    return data

            try:
                logger.info(f"Fetching fresh LOL data for user {user_id}")
                data = await _get_lol(user_id)
                self._lol_cache[user_id] = (data, datetime.now())
                return data
            except Exception as e:
                logger.error(
                    f"Failed to fetch LOL info for user {user_id}: {str(e)}"
                )
                # 캐시에 오래된 데이터라도 있으면 반환
                if user_id in self._lol_cache:
                    logger.warning(
                        f"Returning stale LOL cache for user {user_id}"
                    )
                    return self._lol_cache[user_id][0]
                raise

    async def get_val_info(
        self, user_id: int
    ) -> Optional[GetValInfoResponseDTO]:
        """VAL 정보 조회 (캐시 우선)"""
        # 캐시 확인
        if user_id in self._val_cache:
            data, timestamp = self._val_cache[user_id]
            if datetime.now() - timestamp < self._cache_duration:
                logger.debug(f"VAL cache hit for user {user_id}")
                return data
            else:
                logger.debug(f"VAL cache expired for user {user_id}")

        # 캐시 미스 또는 만료 - 새로 조회 (세마포어로 동시성 제한)
        async with self._crawl_semaphore:
            # 세마포어 획득 중 다른 요청이 캐시를 채웠을 수 있으니 다시 확인
            if user_id in self._val_cache:
                data, timestamp = self._val_cache[user_id]
                if datetime.now() - timestamp < self._cache_duration:
                    logger.debug(f"VAL cache hit after wait for user {user_id}")
                    return data

            try:
                logger.info(f"Fetching fresh VAL data for user {user_id}")
                data = await _get_val(user_id)
                self._val_cache[user_id] = (data, datetime.now())
                return data
            except Exception as e:
                logger.error(
                    f"Failed to fetch VAL info for user {user_id}: {str(e)}"
                )
                # 캐시에 오래된 데이터라도 있으면 반환
                if user_id in self._val_cache:
                    logger.warning(
                        f"Returning stale VAL cache for user {user_id}"
                    )
                    return self._val_cache[user_id][0]
                raise

    async def _refresh_all_caches(self):
        """모든 사용자의 게임 정보 캐시 갱신"""
        if self._is_refreshing:
            logger.info("Cache refresh already in progress, skipping...")
            return

        self._is_refreshing = True
        from utils.database import get_db
        from entities.user import User

        logger.info("Starting cache refresh for all users...")

        try:
            db = next(get_db())
            users = db.query(User).filter(User.riot_id.isnot(None)).all()

            logger.info(f"Found {len(users)} users with Riot ID")

            # LOL 정보 갱신
            lol_tasks = []
            val_tasks = []

            for user in users:
                if user.riot_id and "#" in user.riot_id:
                    lol_tasks.append(self._refresh_lol_cache(user.user_id))
                    val_tasks.append(self._refresh_val_cache(user.user_id))

            # 동시 실행을 더 제한 (1개씩 처리하고 대기 시간 증가)
            batch_size = 1  # 한 번에 1개씩만 처리

            for i in range(0, len(lol_tasks), batch_size):
                batch = lol_tasks[i : i + batch_size]
                await asyncio.gather(*batch, return_exceptions=True)
                await asyncio.sleep(3)  # 배치 간 3초 대기

            for i in range(0, len(val_tasks), batch_size):
                batch = val_tasks[i : i + batch_size]
                await asyncio.gather(*batch, return_exceptions=True)
                await asyncio.sleep(3)  # 배치 간 3초 대기

            logger.info(
                f"Cache refresh completed. LOL: {len(self._lol_cache)}, VAL: {len(self._val_cache)}"
            )

        except Exception as e:
            logger.error(f"Error during cache refresh: {str(e)}")
        finally:
            self._is_refreshing = False

    async def _refresh_lol_cache(self, user_id: int):
        """단일 사용자 LOL 캐시 갱신"""
        try:
            data = await _get_lol(user_id)
            self._lol_cache[user_id] = (data, datetime.now())
            logger.debug(f"LOL cache refreshed for user {user_id}")
        except Exception as e:
            logger.warning(
                f"Failed to refresh LOL cache for user {user_id}: {str(e)}"
            )

    async def _refresh_val_cache(self, user_id: int):
        """단일 사용자 VAL 캐시 갱신"""
        try:
            data = await _get_val(user_id)
            self._val_cache[user_id] = (data, datetime.now())
            logger.debug(f"VAL cache refreshed for user {user_id}")
        except Exception as e:
            logger.warning(
                f"Failed to refresh VAL cache for user {user_id}: {str(e)}"
            )

    async def _background_refresh(self):
        """5분마다 캐시를 갱신하는 백그라운드 작업"""
        # 시작 직후 즉시 첫 크롤링 실행
        if self._is_running:
            logger.info("Initial cache refresh triggered")
            await self._refresh_all_caches()

        while self._is_running:
            try:
                await asyncio.sleep(300)  # 5분 대기
                if self._is_running:
                    logger.info("Background cache refresh triggered")
                    await self._refresh_all_caches()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in background refresh: {str(e)}")


# 싱글톤 인스턴스
game_cache_service = GameCacheService()
