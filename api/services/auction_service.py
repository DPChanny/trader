import os
from sqlalchemy.orm import Session, joinedload
import asyncio
import logging

from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from entities.user import User
from auction.auction_manager import auction_manager
from dtos.auction_dto import (
    AddAuctionResponseDTO,
    AuctionDTO,
    Team,
)
from exception import CustomException, handle_exception
from services.discord_service import discord_service

logger = logging.getLogger(__name__)


def add_auction_service(preset_id: int, db: Session) -> AddAuctionResponseDTO:
    try:
        logger.info(f"Creating auction for preset_id: {preset_id}")
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            logger.warning(f"Preset not found: {preset_id}")
            raise CustomException(404, "Preset not found.")

        preset_leaders = preset.preset_leaders
        if not preset_leaders:
            logger.warning(f"No leaders found in preset: {preset_id}")
            raise CustomException(400, "No leaders found in preset.")

        if len(preset_leaders) < 2:
            logger.warning(
                f"Not enough leaders in preset {preset_id}: {len(preset_leaders)}"
            )
            raise CustomException(
                400, "At least 2 leaders are required to start an auction."
            )

        preset_users = preset.preset_users
        if not preset_users:
            logger.warning(f"No users found in preset: {preset_id}")
            raise CustomException(400, "No users found in preset.")

        required_users = len(preset_leaders) * 5
        if len(preset_users) < required_users:
            logger.warning(
                f"Not enough users in preset {preset_id}: {len(preset_users)}/{required_users}"
            )
            raise CustomException(
                400,
                f"At least {required_users} users are required ({len(preset_leaders)} leaders × 5 members each).",
            )

        teams = []
        leader_user_ids = set()
        for idx, leader in enumerate(preset_leaders):
            team = Team(
                team_id=idx + 1,
                leader_id=leader.user_id,
                member_id_list=[leader.user_id],  # 리더를 팀에 포함
                points=preset.points,
            )
            teams.append(team)
            leader_user_ids.add(leader.user_id)

        # 모든 유저 포함 (리더 포함)
        user_ids = [preset_user.user_id for preset_user in preset_users]

        auction_id, user_tokens = auction_manager.add_auction(
            preset_id=preset_id,
            teams=teams,
            user_ids=user_ids,
            leader_user_ids=leader_user_ids,
            time=preset.time,
        )

        logger.info(
            f"Auction added with ID: {auction_id}, notifying {len(user_ids)} users"
        )

        for user_id in user_ids:
            if user_id in user_tokens:
                token = user_tokens[user_id]

                user = db.query(User).filter(User.user_id == user_id).first()

                auction_url = f"http://{os.getenv('HOST', 'localhost')}:{os.getenv('PORT', '5173')}/auction.html?token={token}"
                logger.info(
                    f"[DEBUG] Sending auction URL to {user.name}: {auction_url}"
                )

                if user and user.discord_id:
                    try:
                        asyncio.create_task(
                            discord_service.send_auction_invite(
                                discord_id=user.discord_id,
                                token=token,
                            )
                        )
                        logger.info(
                            f"Scheduled Discord invite for user {user.name} (ID: {user_id})"
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to send Discord invite to {user.name}: {e}"
                        )
                else:
                    logger.warning(
                        f"User {user_id} has no discord_id, skipping DM"
                    )

        logger.info(f"Auction {auction_id} added successfully")
        auction_dto = AuctionDTO(
            auction_id=auction_id,
            preset_id=preset_id,
        )

        return AddAuctionResponseDTO(
            success=True,
            code=200,
            message="Auction added successfully.",
            data=auction_dto,
        )

    except Exception as e:
        handle_exception(e, db)
