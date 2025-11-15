import asyncio
import logging
import threading
import os
from pathlib import Path
from typing import Optional

import discord
from discord.ext import commands

from utils.env import (
    get_discord_bot_token,
    get_profile_url,
    get_profile_path,
)

logger = logging.getLogger(__name__)


class DiscordBotService:
    def __init__(self):
        self.bot: Optional[commands.Bot] = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._should_run = True
        self._reconnect_task: Optional[asyncio.Task] = None

        if not self.token:
            logger.warning("Token missing")

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

        @self.bot.event
        async def on_disconnect():
            logger.warning("Disconnected")
            self._ready = False

        @self.bot.event
        async def on_resumed():
            logger.info("Resumed")
            self._ready = True

        @self.bot.event
        async def on_error(event, *args, **kwargs):
            logger.error(f"Discord error in {event}")
            import traceback

            logger.error(traceback.format_exc())

        while self._should_run:
            try:
                self._loop.run_until_complete(
                    self.bot.start(self.token, reconnect=True)
                )
            except discord.ConnectionClosed as e:
                logger.warning(f"Connection closed: {e}")
                self._ready = False
                if self._should_run:
                    logger.info("Reconnecting in 5 seconds...")
                    asyncio.run(asyncio.sleep(5))
                else:
                    break
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt")
                break
            except Exception as e:
                logger.error(f"Start failed: {e}")
                import traceback

                logger.error(traceback.format_exc())
                self._ready = False
                if self._should_run:
                    logger.info("Reconnecting in 5 seconds...")
                    asyncio.run(asyncio.sleep(5))
                else:
                    break

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
                self._should_run = False

                if self._loop.is_running():
                    future = asyncio.run_coroutine_threadsafe(
                        self.bot.close(), self._loop
                    )
                    try:
                        future.result(timeout=5.0)
                        logger.info("Bot closed")
                    except Exception as e:
                        logger.warning(f"Bot close timeout or error: {e}")

                    self._loop.call_soon_threadsafe(self._loop.stop)
                    logger.info("Loop stop signal sent")

                if self._thread and self._thread.is_alive():
                    self._thread.join(timeout=5.0)
                    if self._thread.is_alive():
                        logger.warning("Thread still alive after timeout")
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
            logger.error("Not ready")
            return None

        profile_path = get_profile_path(discord_id)

        if profile_path.exists():
            return get_profile_url(discord_id)

        self._schedule_profile_download(discord_id)
        return None

    def _schedule_profile_download(self, discord_id: str) -> None:
        if not self._loop or not self._loop.is_running():
            logger.error("Loop not running")
            return

        async def _download_profile():
            try:
                profile_path = get_profile_path(discord_id)

                if profile_path.exists():
                    return

                user_id = int(discord_id)
                user = await self.bot.fetch_user(user_id)

                if not user:
                    logger.error(f"User not found: {discord_id}")
                    return

                profile_url = user.display_avatar.url

                import aiohttp

                async with aiohttp.ClientSession() as session:
                    async with session.get(profile_url) as response:
                        if response.status == 200:
                            profile_path.write_bytes(await response.read())
                            logger.info(f"Profile downloaded: {discord_id}")
                        else:
                            logger.warning(
                                f"Profile download failed: {response.status}"
                            )

            except ValueError:
                logger.error(f"Invalid discord_id format: {discord_id}")
            except Exception as e:
                logger.error(f"Profile fetch error {discord_id}: {e}")

        asyncio.run_coroutine_threadsafe(_download_profile(), self._loop)

    def refresh_profile(self, discord_id: str) -> None:
        if not discord_id or not discord_id.strip():
            return

        if not self._loop or not self._loop.is_running():
            logger.error("Loop not running")
            return

        profile_path = get_profile_path(discord_id)

        if profile_path.exists():
            try:
                profile_path.unlink()
                logger.info(f"Old profile deleted: {discord_id}")
            except Exception as e:
                logger.warning(f"Failed to delete old profile: {e}")

        self._schedule_profile_download(discord_id)

    def remove_profile(self, discord_id: str) -> None:
        if not discord_id or not discord_id.strip():
            return

        profile_path = get_profile_path(discord_id)

        if profile_path.exists():
            try:
                profile_path.unlink()
                logger.info(f"Profile removed: {discord_id}")
            except Exception as e:
                logger.warning(f"Failed to remove profile: {e}")


discord_service = DiscordBotService()
