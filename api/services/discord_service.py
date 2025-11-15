import asyncio
import logging
import threading
from typing import Optional, Dict

import discord
from discord.ext import commands

from utils.env import get_discord_bot_token

logger = logging.getLogger(__name__)

PROFILE_CACHE_TTL = 300


class DiscordBotService:
    def __init__(self):
        self.bot: Optional[commands.Bot] = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._profile_cache: Dict[str, str] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None

        if not self.token:
            logger.warning("Discord token missing")

    def _run_bot(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)

        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        self.bot = commands.Bot(command_prefix="!", intents=intents)

        @self.bot.event
        async def on_ready():
            logger.info(f"Ready: {self.bot.user}")
            self._ready = True

        try:
            self._loop.run_until_complete(self.bot.start(self.token))
        except Exception as e:
            logger.error(f"Start failed: {e}")

    async def start(self):
        if not self.token:
            logger.error("Token missing")
            return

        self._thread = threading.Thread(
            target=self._run_bot,
            daemon=False,
            name="DiscordBotThread",
        )
        self._thread.start()

        for _ in range(60):
            if self._ready:
                break
            await asyncio.sleep(1)

        if not self._ready:
            logger.warning("Startup timeout")

    async def stop(self):
        if self.bot and self._loop:
            try:
                logger.info("Stopping...")

                if self._loop.is_running():
                    future = asyncio.run_coroutine_threadsafe(
                        self.bot.close(), self._loop
                    )
                    try:
                        future.result(timeout=5.0)
                        logger.info("Bot closed")
                    except Exception as e:
                        logger.warning(
                            f"Discord bot close timeout or error: {e}"
                        )

                    self._loop.call_soon_threadsafe(self._loop.stop)
                    logger.info("Loop stop signal sent")

                if self._thread and self._thread.is_alive():
                    self._thread.join(timeout=5.0)
                    if self._thread.is_alive():
                        logger.warning(
                            "Discord thread still alive after timeout"
                        )
                    else:
                        logger.info("Thread stopped")

                self._ready = False
                logger.info("Stopped")
            except Exception as e:
                logger.error(f"Stop error: {e}")
                import traceback

                logger.error(traceback.format_exc())

    def send_auction_urls(self, invites: list[tuple[str, str]]) -> None:
        if not self.bot or not self._ready:
            logger.error("Not ready")
            return 0

        if not self._loop or not self._loop.is_running():
            logger.error("Loop not running")
            return

        asyncio.run_coroutine_threadsafe(
            self._send_auction_urls(invites), self._loop
        )

    async def _send_auction_urls(
        self, invites: list[tuple[str, str]]
    ) -> dict[str, bool]:
        async def _send_one(discord_id: str, auction_url: str):
            try:
                if not discord_id or not discord_id.strip():
                    logger.debug(f"Empty discord_id")
                    return False

                user_id = int(discord_id)
                user = await self.bot.fetch_user(user_id)

                if not user:
                    logger.error(f"User not found: {discord_id}")
                    return False

                embed = discord.Embed(title="창식이 내전 경매")
                embed.add_field(
                    name="참가 링크",
                    value=f"[참가]({auction_url})",
                    inline=False,
                )

                await user.send(embed=embed)
                logger.info(f"Sent: {discord_id}")
                return True

            except discord.Forbidden:
                logger.debug(f"DM blocked: {discord_id}")
                return False
            except ValueError:
                logger.debug(f"Invalid discord_id format: {discord_id}")
                return False
            except Exception as e:
                logger.debug(f"Invite error {discord_id}: {e}")
                return False

        try:
            results = await asyncio.gather(
                *[
                    _send_one(discord_id, auction_url)
                    for discord_id, auction_url in invites
                ],
                return_exceptions=True,
            )

            result_dict = {}
            for (discord_id, auction_url), result in zip(invites, results):
                if isinstance(result, Exception):
                    result_dict[discord_id] = False
                    logger.debug(f"Invite failed: {discord_id} {auction_url}")
                elif not result:
                    logger.info(f"Failed: {discord_id}")
                    result_dict[discord_id] = False
                else:
                    result_dict[discord_id] = result

            success_count = sum(1 for r in result_dict.values() if r)
            logger.info(f"Invites sent: {success_count}/{len(invites)}")
            return result_dict
        except Exception as e:
            logger.error(f"Batch invite error: {e}")
            return {discord_id: False for discord_id, _ in invites}

    async def get_profile_url(self, discord_id: str) -> Optional[str]:
        if not discord_id or not discord_id.strip():
            return None

        if not self.bot or not self._ready:
            logger.error("Bot not ready")
            return None

        if discord_id in self._profile_cache:
            cached_url = self._profile_cache[discord_id]

            try:
                import aiohttp

                async with aiohttp.ClientSession() as session:
                    async with session.head(
                        cached_url, timeout=aiohttp.ClientTimeout(total=3)
                    ) as response:
                        if response.status == 200:
                            return cached_url
                        else:
                            logger.debug(f"Cache invalid: {response.status}")
                            del self._profile_cache[discord_id]
            except Exception as e:
                logger.debug(f"Cache check error: {e}")
                del self._profile_cache[discord_id]

        async def _fetch_profile():
            try:
                user_id = int(discord_id)
                user = await self.bot.fetch_user(user_id)

                if not user:
                    logger.error(f"User not found: {discord_id}")
                    return None

                profile_url = user.display_avatar.url
                self._profile_cache[discord_id] = profile_url
                return profile_url

            except Exception as e:
                logger.error(f"Profile fetch error {discord_id}: {e}")
                return None

        try:
            future = asyncio.run_coroutine_threadsafe(
                _fetch_profile(), self._loop
            )
            return future.result(timeout=5.0)
        except Exception as e:
            logger.error(f"Profile fetch error {discord_id}: {e}")
            return None


discord_service = DiscordBotService()
