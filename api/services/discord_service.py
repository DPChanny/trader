import discord
from discord.ext import commands
import logging
import os
from typing import Optional, Dict
from dotenv import load_dotenv
import asyncio

logger = logging.getLogger(__name__)

load_dotenv()


class DiscordBotService:
    def __init__(self):
        self.bot: Optional[commands.Bot] = None
        self.token = os.getenv("DISCORD_BOT_TOKEN")
        self.host = os.getenv("HOST", "localhost")
        self.port = os.getenv("PORT", "5173")
        self._ready = False
        self._profile_cache: Dict[str, str] = {}

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
        self, discord_id: str, auction_id: str, token: str, user_name: str
    ):
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

            auction_url = (
                f"http://{self.host}:{self.port}/auction.html?token={token}"
            )

            embed = discord.Embed(
                title="🎮 경매 초대",
                description=f"{user_name}님, 새로운 경매가 시작되었습니다!",
                color=discord.Color.blue(),
            )
            embed.add_field(name="경매 ID", value=auction_id, inline=False)
            embed.add_field(
                name="참가 링크",
                value=f"[여기를 클릭하여 참가하세요]({auction_url})",
                inline=False,
            )
            embed.set_footer(text="링크는 본인만 사용할 수 있습니다.")

            await user.send(embed=embed)
            logger.info(
                f"Sent auction invite to {user_name} (Discord ID: {discord_id})"
            )
            return True

        except ValueError:
            logger.error(f"Invalid Discord ID format: {discord_id}")
            return False
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

        if discord_id in self._profile_cache:
            return self._profile_cache[discord_id]

        try:
            user_id = int(discord_id)
            user = await self.bot.fetch_user(user_id)

            if not user:
                logger.error(
                    f"Could not find Discord user with ID: {discord_id}"
                )
                return None

            profile_url = user.display_avatar.url
            self._profile_cache[discord_id] = profile_url
            logger.info(f"Cached profile URL for Discord ID: {discord_id}")
            return profile_url

        except ValueError:
            logger.error(f"Invalid Discord ID format: {discord_id}")
            return None
        except Exception as e:
            logger.error(f"Error fetching profile URL for {discord_id}: {e}")
            return None


discord_service = DiscordBotService()
