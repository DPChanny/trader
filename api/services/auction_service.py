from sqlalchemy.orm import Session, joinedload
import asyncio
import logging

from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from entities.user import User
from auction.auction_manager import auction_manager
from dtos.auction_dto import (
    CreateAuctionResponseDTO,
    AuctionDTO,
    Team,
)
from exception import CustomException, handle_exception
from services.discord_service import get_discord_service

logger = logging.getLogger(__name__)


def create_auction_service(
    preset_id: int, db: Session
) -> CreateAuctionResponseDTO:
    try:
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
            raise CustomException(404, "Preset not found.")

        preset_leaders = preset.preset_leaders
        if not preset_leaders:
            raise CustomException(400, "No leaders found in preset.")

        preset_users = preset.preset_users
        if not preset_users:
            raise CustomException(400, "No users found in preset.")

        teams = []
        leader_user_ids = set()
        for idx, leader in enumerate(preset_leaders):
            team = Team(
                team_id=idx + 1,
                leader_id=leader.user_id,
                member_id_list=[],
                points=preset.points,
            )
            teams.append(team)
            leader_user_ids.add(leader.user_id)

        user_ids = [preset_user.user_id for preset_user in preset_users]

        auction_id, user_tokens = auction_manager.create_auction(
            preset_id=preset_id,
            teams=teams,
            user_ids=user_ids,
            leader_user_ids=leader_user_ids,
            time=preset.time,
        )

        discord_service = get_discord_service()

        for user_id in user_ids:
            if user_id in user_tokens:
                token = user_tokens[user_id]

                user = db.query(User).filter(User.user_id == user_id).first()
                if user and user.discord_id:
                    try:
                        asyncio.create_task(
                            discord_service.send_auction_invite(
                                discord_id=user.discord_id,
                                auction_id=auction_id,
                                token=token,
                                user_name=user.name,
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

        auction_dto = AuctionDTO(
            auction_id=auction_id,
            preset_id=preset_id,
        )

        return CreateAuctionResponseDTO(
            success=True,
            code=200,
            message="Auction created successfully.",
            data=auction_dto,
        )

    except Exception as e:
        handle_exception(e, db)
