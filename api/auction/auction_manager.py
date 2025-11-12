import uuid
from typing import Dict, Optional, List

from auction.auction import Auction
from dtos.auction_dto import Team


class Token:
    def __init__(self, auction_id: str, user_id: int, token: str, role: str):
        self.auction_id = auction_id
        self.user_id = user_id
        self.token = token
        self.role = role


class AuctionManager:
    def __init__(self):
        self.auctions: Dict[str, Auction] = {}
        self.token_to_auction: Dict[str, str] = {}
        self.tokens: Dict[str, Token] = {}
        self.auction_tokens: Dict[str, List[str]] = {}
        self.next_auction_id: int = 1

    def add_auction(
        self,
        preset_id: int,
        teams: list[Team],
        user_ids: list[int],
        leader_user_ids: set[int],
        time: int,
    ) -> tuple[str, Dict[int, str]]:
        auction_id = str(self.next_auction_id)
        self.next_auction_id += 1
        user_tokens = {}
        auction_token_list = []

        for user_id in user_ids:
            token = str(uuid.uuid4())
            user_tokens[user_id] = token

            token_info = Token(
                auction_id=auction_id,
                user_id=user_id,
                token=token,
                role="leader" if user_id in leader_user_ids else "observer",
            )
            self.tokens[token] = token_info
            self.token_to_auction[token] = auction_id
            auction_token_list.append(token)

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
        return self.auctions.get(auction_id)

    def get_auction_by_token(self, token: str) -> Optional[Auction]:
        auction_id = self.token_to_auction.get(token)
        if auction_id:
            return self.auctions.get(auction_id)
        return None

    def get_token(self, token: str) -> Optional[Token]:
        return self.tokens.get(token)

    def get_tokens(self, auction_id: str) -> List[Token]:
        token_list = self.auction_tokens.get(auction_id, [])
        return [self.tokens[token] for token in token_list if token in self.tokens]

    def get_user_token(self, auction_id: str, user_id: int) -> Optional[Token]:
        token_list = self.auction_tokens.get(auction_id, [])
        for token in token_list:
            token_info = self.tokens.get(token)
            if token_info and token_info.user_id == user_id:
                return token_info
        return None

    def remove_auction(self, auction_id: str):
        if auction_id in self.auctions:
            token_list = self.auction_tokens.get(auction_id, [])
            for token in token_list:
                if token in self.tokens:
                    del self.tokens[token]
                if token in self.token_to_auction:
                    del self.token_to_auction[token]

            if auction_id in self.auction_tokens:
                del self.auction_tokens[auction_id]

            del self.auctions[auction_id]


auction_manager = AuctionManager()
