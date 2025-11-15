import logging

from sqlalchemy.orm import Session, joinedload

from auction.auction_manager import auction_manager
from dtos.auction_dto import (
    AddAuctionResponseDTO,
    AuctionDTO,
    Team,
)
from entities.preset import Preset
from entities.preset_user import PresetUser
from entities.user import User
from services.discord_service import discord_service
from utils.env import get_auction_url
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


def add_auction_service(
    preset_id: int, db: Session
) -> AddAuctionResponseDTO | None:
    try:
        logger.info(f"Adding: {preset_id}")
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            logger.warning(f"Preset missing: {preset_id}")
            raise CustomException(404, "Preset not found.")

        preset_users = preset.preset_users
        if not preset_users:
            logger.warning(f"Users empty: {preset_id}")
            raise CustomException(400, "No users found in preset.")

        leaders = [pu for pu in preset_users if pu.is_leader]
        if not leaders:
            logger.warning(f"Leaders empty: {preset_id}")
            raise CustomException(400, "No leaders found in preset.")

        if len(leaders) < 2:
            logger.warning(f"Leaders < 2: {len(leaders)}")
            raise CustomException(
                400, "At least 2 leaders are required to start an auction."
            )

        required_users = len(leaders) * 5
        if len(preset_users) < required_users:
            logger.warning(f"Users < {required_users}: {len(preset_users)}")
            raise CustomException(
                400,
                f"At least {required_users} users are required ({len(leaders)} leaders × 5 members each).",
            )

        teams = []
        leader_user_ids = set()
        for idx, leader in enumerate(leaders):
            team = Team(
                team_id=idx + 1,
                leader_id=leader.user_id,
                member_id_list=[leader.user_id],
                points=preset.points,
            )
            teams.append(team)
            leader_user_ids.add(leader.user_id)

        user_ids = [preset_user.user_id for preset_user in preset_users]

        auction_id, user_tokens = auction_manager.add_auction(
            preset_id=preset_id,
            teams=teams,
            user_ids=user_ids,
            leader_user_ids=leader_user_ids,
            time=preset.time,
        )

        logger.info(f"Added: {auction_id}, users: {len(user_ids)}")

        invites = []
        for user_id in user_ids:
            if user_id in user_tokens:
                token = user_tokens[user_id]
                user = db.query(User).filter(User.user_id == user_id).first()

                if not user:
                    logger.warning(f"User missing: {user_id}")
                    continue

                auction_url = get_auction_url(token)
                invites.append((user.discord_id, auction_url))

        if invites:
            discord_service.send_auction_urls(invites)

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
