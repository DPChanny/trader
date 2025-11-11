import discord
from discord.ext import commands
import logging
from typing import Optional, Dict, Tuple
import asyncio
import time

from utils.env import get_discord_bot_token

logger = logging.getLogger(__name__)

PROFILE_CACHE_TTL = 300


class DiscordBotService:
    def __init__(self):
        self.bot: Optional[commands.Bot] = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._profile_cache: Dict[str, Tuple[str, float]] = {}
        self._valid_id_cache: Dict[str, Tuple[bool, float]] = {}

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

    async def is_valid_discord_id(self, discord_id: str) -> bool:
        """
        Validate Discord ID by checking format and verifying user exists via bot.
        Uses caching to avoid repeated API calls.

        Args:
            discord_id: The Discord ID to validate

        Returns:
            True if valid and user exists, False otherwise
        """
        # Basic format validation
        if not discord_id or not discord_id.strip():
            return False

        try:
            user_id = int(discord_id)
        except (ValueError, TypeError):
            return False

        # If bot is not ready, return basic format validation result
        if not self.bot or not self._ready:
            logger.debug(
                f"Bot not ready, returning basic validation for {discord_id}"
            )
            return True  # Assume valid if we can't check with bot

        # Check cache first
        if discord_id in self._valid_id_cache:
            is_valid, timestamp = self._valid_id_cache[discord_id]
            current_time = time.time()

            if current_time - timestamp < PROFILE_CACHE_TTL:
                logger.debug(
                    f"Using cached validation result for Discord ID: {discord_id}"
                )
                return is_valid
            else:
                del self._valid_id_cache[discord_id]

        # Verify user exists via bot
        try:
            user = await self.bot.fetch_user(user_id)
            is_valid = user is not None

            # Cache the result
            current_time = time.time()
            self._valid_id_cache[discord_id] = (is_valid, current_time)

            if is_valid:
                logger.debug(f"Discord ID {discord_id} validated successfully")
            else:
                logger.warning(f"Discord user not found for ID: {discord_id}")

            return is_valid

        except discord.NotFound:
            logger.warning(f"Discord user not found for ID: {discord_id}")
            self._valid_id_cache[discord_id] = (False, time.time())
            return False
        except Exception as e:
            logger.error(f"Error validating Discord ID {discord_id}: {e}")
            # Don't cache errors, return False
            return False

    async def send_auction_invite(
        self,
        discord_id: str,
        auction_url: str,
    ):
        """
        Send auction invite to a Discord user.
        Validates discord_id before sending.
        """
        if not await self.is_valid_discord_id(discord_id):
            logger.warning(f"Invalid Discord ID: {discord_id}")
            return False

        if not self.bot or not self._ready:
            logger.error("Discord bot is not ready, cannot send message")
            return False

        try:
            user_id = int(discord_id)
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
            logger.info(f"Sent auction invite to Discord ID: {discord_id}")
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
        """
        Get Discord user profile picture URL.
        Validates discord_id before fetching.
        """
        if not await self.is_valid_discord_id(discord_id):
            logger.warning(f"Invalid Discord ID: {discord_id}")
            return None

        if not self.bot or not self._ready:
            logger.error("Discord bot is not ready")
            return None

        # Check cache first
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
