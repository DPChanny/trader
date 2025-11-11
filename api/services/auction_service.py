from sqlalchemy.orm import Session, joinedload

from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from auction.auction_manager import auction_manager
from dtos.auction_dto import (
    CreateAuctionResponseDTO,
    GetAuctionListResponseDTO,
    GetAuctionDetailResponseDTO,
    DeleteAuctionResponseDTO,
    AuctionDTO,
    Team,
)
from exception import CustomException, handle_exception


def create_auction_service(
    preset_id: int, db: Session
) -> CreateAuctionResponseDTO:
    """경매 세션 생성"""
    try:
        # Preset 데이터 조회
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

        # 리더 정보 추출
        preset_leaders = preset.preset_leaders
        if not preset_leaders:
            raise CustomException(400, "No leaders found in preset.")

        # 유저 정보 추출
        preset_users = preset.preset_users
        if not preset_users:
            raise CustomException(400, "No users found in preset.")

        # 팀 구성 (리더별로 팀 생성)
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

        # 경매 대상 유저 목록 (preset_users에서 추출)
        user_ids = [pu.user_id for pu in preset_users]

        # 모든 참가자 ID (리더 + 유저)
        all_participant_ids = list(leader_user_ids) + user_ids

        # 경매 생성 및 토큰 생성
        auction_id, user_tokens = auction_manager.create_auction(
            preset_id=preset_id,
            teams=teams,
            user_ids=user_ids,
            leader_user_ids=leader_user_ids,
            all_participant_ids=all_participant_ids,
            time=preset.time,
        )

        # 응답 생성
        auction_dto = AuctionDTO(
            auction_id=auction_id,
            preset_id=preset_id,
            status="waiting",
        )

        return CreateAuctionResponseDTO(
            success=True,
            code=200,
            message="Auction created successfully.",
            data=auction_dto,
        )

    except Exception as e:
        handle_exception(e, db)


def get_auction_list_service() -> GetAuctionListResponseDTO:
    """경매 세션 리스트 조회"""
    try:
        auctions = auction_manager.get_all_auctions()
        auction_dtos = []

        for auction_id, auction in auctions.items():
            auction_dto = AuctionDTO(
                auction_id=auction_id,
                preset_id=auction.preset_id,
                status=auction.status.value,
            )
            auction_dtos.append(auction_dto)

        return GetAuctionListResponseDTO(
            success=True,
            code=200,
            message="Auction list retrieved successfully.",
            data=auction_dtos,
        )

    except Exception as e:
        raise CustomException(500, f"Failed to retrieve auction list: {str(e)}")


def get_auction_detail_service(auction_id: str) -> GetAuctionDetailResponseDTO:
    """경매 상태 조회"""
    try:
        auction = auction_manager.get_auction(auction_id)

        if not auction:
            raise CustomException(404, "Auction not found.")

        # 경매 상태 조회
        state = auction.get_state()

        return GetAuctionDetailResponseDTO(
            success=True,
            code=200,
            message="Auction detail retrieved successfully.",
            data=state,
        )

    except Exception as e:
        if isinstance(e, CustomException):
            raise e
        raise CustomException(
            500, f"Failed to retrieve auction detail: {str(e)}"
        )


def delete_auction_service(auction_id: str) -> DeleteAuctionResponseDTO:
    """경매 세션 삭제"""
    try:
        auction = auction_manager.get_auction(auction_id)

        if not auction:
            raise CustomException(404, "Auction not found.")

        # 경매 삭제
        auction_manager.remove_auction(auction_id)

        return DeleteAuctionResponseDTO(
            success=True,
            code=200,
            message="Auction deleted successfully.",
            data=None,
        )

    except Exception as e:
        if isinstance(e, CustomException):
            raise e
        raise CustomException(500, f"Failed to delete auction: {str(e)}")
