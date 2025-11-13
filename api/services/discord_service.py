import asyncio
import logging
import time
from typing import Optional, Dict, Tuple

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
        self._valid_id_cache: Dict[str, Tuple[bool, float]] = {}

        if not self.token:
            logger.warning("Discord token missing")

    async def start(self):
        if not self.token:
            logger.error("Bot token missing")
            return

        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        self.bot = commands.Bot(command_prefix="!", intents=intents)

        @self.bot.event
        async def on_ready():
            logger.info(f"Bot ready: {self.bot.user}")
            self._ready = True

        try:
            asyncio.create_task(self.bot.start(self.token))
            for _ in range(50):
                if self._ready:
                    break
                await asyncio.sleep(0.2)

            if not self._ready:
                logger.warning("Bot timeout")
        except Exception as e:
            logger.error(f"Bot start failed: {e}")

    async def stop(self):
        if self.bot:
            try:
                await self.bot.close()
                logger.info("Bot stopped")
            except Exception as e:
                logger.error(f"Bot stop error: {e}")

    async def is_valid_discord_id(self, discord_id: str) -> bool:
        if not discord_id or not discord_id.strip():
            return False

        try:
            user_id = int(discord_id)
        except (ValueError, TypeError):
            return False

        if not self.bot or not self._ready:
            logger.debug(f"Bot not ready: {discord_id}")
            return True

        if discord_id in self._valid_id_cache:
            is_valid, timestamp = self._valid_id_cache[discord_id]
            current_time = time.time()

            if current_time - timestamp < PROFILE_CACHE_TTL:
                return is_valid
            else:
                del self._valid_id_cache[discord_id]

        try:
            user = await self.bot.fetch_user(user_id)
            is_valid = user is not None

            current_time = time.time()
            self._valid_id_cache[discord_id] = (is_valid, current_time)

            if not is_valid:
                logger.warning(f"User not found: {discord_id}")

            return is_valid

        except discord.NotFound:
            self._valid_id_cache[discord_id] = (False, time.time())
            return False
        except Exception as e:
            logger.error(f"Validation error {discord_id}: {e}")
            return False

    async def send_auction_invite(
        self,
        discord_id: str,
        auction_url: str,
    ):
        if not discord_id or not discord_id.strip():
            return False

        if not await self.is_valid_discord_id(discord_id):
            logger.warning(f"Invalid ID: {discord_id}")
            return False

        if not self.bot or not self._ready:
            logger.error("Bot not ready")
            return False

        try:
            user_id = int(discord_id)
            user = await self.bot.fetch_user(user_id)

            if not user:
                logger.error(f"User not found: {discord_id}")
                return False

            embed = discord.Embed(
                title="창식이 롤 내전 경매",
            )
            embed.add_field(
                name="참가 링크",
                value=f"[참가]({auction_url})",
                inline=False,
            )

            await user.send(embed=embed)
            logger.info(f"Invite sent: {discord_id}")
            return True

        except discord.Forbidden:
            logger.error(f"DM blocked: {discord_id}")
            return False
        except Exception as e:
            logger.error(f"Invite error {discord_id}: {e}")
            return False

    async def send_auction_invites(
        self, invites: list[tuple[str, str]]
    ) -> dict[str, bool]:
        if not self.bot or not self._ready:
            logger.error("Bot not ready")
            return {discord_id: False for discord_id, _ in invites}

        results = await asyncio.gather(
            *[
                self.send_auction_invite(discord_id, auction_url)
                for discord_id, auction_url in invites
            ],
            return_exceptions=True,
        )

        result_dict = {}
        for (discord_id, _), result in zip(invites, results):
            if isinstance(result, Exception):
                logger.error(f"Invite failed {discord_id}: {result}")
                result_dict[discord_id] = False
            else:
                result_dict[discord_id] = result

        success_count = sum(1 for r in result_dict.values() if r)
        logger.info(f"Invites sent: {success_count}/{len(invites)}")
        return result_dict

    async def get_profile_url(self, discord_id: str) -> Optional[str]:
        if not discord_id or not discord_id.strip():
            return None

        if not await self.is_valid_discord_id(discord_id):
            logger.warning(f"Invalid ID: {discord_id}")
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


discord_service = DiscordBotService()
