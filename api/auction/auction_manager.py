import uuid
import secrets
from typing import Dict, Optional, List

from auction.auction import Auction
from dtos.auction_dto import Team


class AuctionTokenInfo:
    """경매 토큰 정보"""

    def __init__(self, auction_id: str, user_id: int, token: str, role: str):
        self.auction_id = auction_id
        self.user_id = user_id
        self.token = token
        self.role = role  # 'leader' or 'observer'


class AuctionManager:
    """경매 관리 및 토큰 메모리 관리"""

    def __init__(self):
        self.auctions: Dict[str, Auction] = {}  # auction_id -> Auction
        self.token_to_auction: Dict[str, str] = {}  # token -> auction_id
        self.tokens: Dict[str, AuctionTokenInfo] = (
            {}
        )  # token -> AuctionTokenInfo
        self.auction_tokens: Dict[str, List[str]] = (
            {}
        )  # auction_id -> list of tokens

    def create_auction(
        self,
        preset_id: int,
        teams: list[Team],
        user_ids: list[int],
        leader_user_ids: set[int],
        all_participant_ids: list[int],
        time: int,
    ) -> tuple[str, Dict[int, str]]:
        """새 경매 생성 및 토큰 생성"""
        auction_id = str(uuid.uuid4())
        user_tokens = {}  # user_id -> token
        auction_token_list = []

        # 리더용 토큰 생성
        for leader_id in leader_user_ids:
            token = secrets.token_urlsafe(32)
            user_tokens[leader_id] = token

            # 토큰 정보 저장
            token_info = AuctionTokenInfo(
                auction_id=auction_id,
                user_id=leader_id,
                token=token,
                role="leader",
            )
            self.tokens[token] = token_info
            self.token_to_auction[token] = auction_id
            auction_token_list.append(token)

        # 일반 참가자용 관전 토큰 생성
        for user_id in all_participant_ids:
            if user_id in user_tokens:  # 이미 리더 토큰이 있으면 스킵
                continue

            token = secrets.token_urlsafe(32)
            user_tokens[user_id] = token

            # 토큰 정보 저장
            token_info = AuctionTokenInfo(
                auction_id=auction_id,
                user_id=user_id,
                token=token,
                role="observer",
            )
            self.tokens[token] = token_info
            self.token_to_auction[token] = auction_id
            auction_token_list.append(token)

        # 경매 생성
        auction = Auction(
            auction_id,
            preset_id,
            teams,
            user_ids,
            user_tokens,
            time,
        )
        self.auctions[auction_id] = auction
        self.auction_tokens[auction_id] = auction_token_list

        return auction_id, user_tokens

    def get_auction(self, auction_id: str) -> Optional[Auction]:
        """경매 가져오기"""
        return self.auctions.get(auction_id)

    def get_auction_by_token(self, token: str) -> Optional[Auction]:
        """토큰으로 경매 가져오기"""
        auction_id = self.token_to_auction.get(token)
        if auction_id:
            return self.auctions.get(auction_id)
        return None

    def get_token_info(self, token: str) -> Optional[AuctionTokenInfo]:
        """토큰 정보 가져오기"""
        return self.tokens.get(token)

    def get_auction_tokens(self, auction_id: str) -> List[AuctionTokenInfo]:
        """경매의 모든 토큰 정보 가져오기"""
        token_list = self.auction_tokens.get(auction_id, [])
        return [
            self.tokens[token] for token in token_list if token in self.tokens
        ]

    def get_user_auction_token(
        self, auction_id: str, user_id: int
    ) -> Optional[AuctionTokenInfo]:
        """특정 유저의 경매 토큰 정보 가져오기"""
        token_list = self.auction_tokens.get(auction_id, [])
        for token in token_list:
            token_info = self.tokens.get(token)
            if token_info and token_info.user_id == user_id:
                return token_info
        return None

    def get_all_auctions(self) -> Dict[str, Auction]:
        """모든 경매 가져오기"""
        return self.auctions

    def remove_auction(self, auction_id: str):
        """경매 제거"""
        if auction_id in self.auctions:
            # 해당 경매의 모든 토큰 제거
            token_list = self.auction_tokens.get(auction_id, [])
            for token in token_list:
                if token in self.tokens:
                    del self.tokens[token]
                if token in self.token_to_auction:
                    del self.token_to_auction[token]

            # 경매 토큰 목록 제거
            if auction_id in self.auction_tokens:
                del self.auction_tokens[auction_id]

            # 경매 제거
            del self.auctions[auction_id]


# 전역 매니저 인스턴스
auction_manager = AuctionManager()
