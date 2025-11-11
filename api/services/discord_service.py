import discord
from discord.ext import commands
import logging
from typing import Optional, Dict, Tuple
from dotenv import load_dotenv
import asyncio
import time

from env import get_discord_bot_token

logger = logging.getLogger(__name__)

load_dotenv()

PROFILE_CACHE_TTL = 300


class DiscordBotService:
    def __init__(self):
        self.bot: Optional[commands.Bot] = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._profile_cache: Dict[str, Tuple[str, float]] = {}

        if not self.token:
            logger.warning(
                "DISCORD_BOT_TOKEN not found in environment variables"
            )

    async def start(self):
        if not self.token:
            logger.error("Cannot start Discord bot: no token provided")
            return

        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        self.bot = commands.Bot(command_prefix="!", intents=intents)

        @self.bot.event
        async def on_ready():
            logger.info(f"Discord bot logged in as {self.bot.user}")
            self._ready = True

        try:
            asyncio.create_task(self.bot.start(self.token))
            for _ in range(50):
                if self._ready:
                    break
                await asyncio.sleep(0.2)

            if not self._ready:
                logger.warning(
                    "Discord bot did not become ready within timeout"
                )
        except Exception as e:
            logger.error(f"Failed to start Discord bot: {e}")

    async def stop(self):
        if self.bot:
            try:
                await self.bot.close()
                logger.info("Discord bot stopped")
            except Exception as e:
                logger.error(f"Error stopping Discord bot: {e}")

    async def send_auction_invite(
        self,
        discord_id: str,
        auction_url: str,
    ):
        if not self.bot or not self._ready:
            logger.error("Discord bot is not ready, cannot send message")
            return False

        if not discord_id or not discord_id.strip():
            logger.error("Empty or invalid discord_id provided")
            return False

        try:
            user_id = int(discord_id)
        except ValueError:
            logger.error(f"Invalid Discord ID format: {discord_id}")
            return False

        try:
            user = await self.bot.fetch_user(user_id)

            if not user:
                logger.error(
                    f"Could not find Discord user with ID: {discord_id}"
                )
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
            logger.info(
                f"Sent auction invite to {discord_id} (Discord ID: {discord_id})"
            )
            return True

        except discord.Forbidden:
            logger.error(
                f"Cannot send DM to user {discord_id} (DMs might be disabled)"
            )
            return False
        except Exception as e:
            logger.error(f"Error sending auction invite to {discord_id}: {e}")
            return False

    async def get_profile_url(self, discord_id: str) -> Optional[str]:
        if not self.bot or not self._ready:
            logger.error("Discord bot is not ready")
            return None

        if not discord_id or not discord_id.strip():
            logger.error("Empty or invalid discord_id provided")
            return None

        if discord_id in self._profile_cache:
            profile_url, timestamp = self._profile_cache[discord_id]
            current_time = time.time()

            if current_time - timestamp < PROFILE_CACHE_TTL:
                logger.info(
                    f"Using cached profile URL for Discord ID: {discord_id}"
                )
                return profile_url
            else:
                logger.info(
                    f"Cache expired for Discord ID: {discord_id}, fetching new profile URL"
                )
                del self._profile_cache[discord_id]

        try:
            user_id = int(discord_id)
        except ValueError:
            logger.error(f"Invalid Discord ID format: {discord_id}")
            return None

        try:
            user = await self.bot.fetch_user(user_id)

            if not user:
                logger.error(
                    f"Could not find Discord user with ID: {discord_id}"
                )
                return None

            profile_url = user.display_avatar.url
            current_time = time.time()
            self._profile_cache[discord_id] = (profile_url, current_time)
            logger.info(
                f"Cached profile URL for Discord ID: {discord_id} (valid for {PROFILE_CACHE_TTL}s)"
            )
            return profile_url

        except Exception as e:
            logger.error(f"Error fetching profile URL for {discord_id}: {e}")
            return None


discord_service = DiscordBotService()
