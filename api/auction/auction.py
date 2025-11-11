import asyncio
from typing import Dict, List, Optional
import random

from dtos.auction_dto import (
    AuctionDetailDTO,
    AuctionStatus,
    Team,
    MessageType,
)


class Auction:
    def __init__(
        self,
        auction_id: str,
        preset_id: int,
        teams: List[Team],
        user_ids: List[int],
        user_tokens: Dict[int, str],  # user_id -> token 매핑
        timer_duration: int = 5,
    ):
        self.auction_id = auction_id
        self.preset_id = preset_id
        self.status = AuctionStatus.WAITING
        self.teams = {team.team_id: team for team in teams}
        self.user_tokens = user_tokens  # user_id -> token
        self.token_to_user: Dict[str, int] = {
            token: user_id for user_id, token in user_tokens.items()
        }  # token -> user_id (역매핑)
        self.connected_tokens: Dict[str, int] = (
            {}
        )  # token -> user_id (현재 접속 중인 토큰)
        self.leader_user_ids = {
            team.leader_id for team in teams
        }  # 리더 user_id 집합

        # 유저 순서 섞기 (경매 생성 시)
        shuffled_users = user_ids.copy()
        random.shuffle(shuffled_users)
        self.auction_queue = shuffled_users

        self.unsold_queue: List[int] = []
        self.current_user_id: Optional[int] = None
        self.current_bid: Optional[int] = None
        self.current_bidder: Optional[int] = None
        self.timer_duration = timer_duration
        self.timer = timer_duration
        self.timer_task: Optional[asyncio.Task] = None
        self.connections: List = []  # WebSocket connections
        self.is_timer_running = False
        self.auto_delete_task: Optional[asyncio.Task] = None

        # 1분 후 자동 삭제 태스크 시작
        self.auto_delete_task = asyncio.create_task(
            self._auto_delete_if_waiting()
        )

    async def _auto_delete_if_waiting(self):
        """1분 후에도 WAITING 상태면 경매 자동 삭제"""
        await asyncio.sleep(60)  # 1분 대기
        if self.status == AuctionStatus.WAITING:
            print(
                f"Auto-deleting auction {self.auction_id} - still in WAITING after 1 minute"
            )
            await self.terminate_auction()
            # AuctionManager에서 경매 제거
            from auction.auction_manager import auction_manager

            auction_manager.remove_auction(self.auction_id)

    def connect_with_token(self, token: str) -> Dict:
        """토큰으로 연결 시도"""
        # 토큰 유효성 검사
        if token not in self.token_to_user:
            return {"success": False, "error": "Invalid token"}

        # 이미 접속 중인지 확인
        if token in self.connected_tokens:
            return {
                "success": False,
                "error": "This token is already connected",
            }

        user_id = self.token_to_user[token]

        # 리더인지 확인
        is_leader = user_id in self.leader_user_ids

        # 리더라면 team_id 찾기
        team_id = None
        if is_leader:
            for tid, team in self.teams.items():
                if team.leader_id == user_id:
                    team_id = tid
                    break

        # 연결 등록
        self.connected_tokens[token] = user_id

        return {
            "success": True,
            "user_id": user_id,
            "is_leader": is_leader,
            "team_id": team_id,
        }

    def disconnect_token(self, token: str):
        """토큰 연결 해제"""
        if token in self.connected_tokens:
            del self.connected_tokens[token]

    def are_all_leaders_connected(self) -> bool:
        """모든 리더가 연결되었는지 확인"""
        connected_user_ids = set(self.connected_tokens.values())
        return self.leader_user_ids.issubset(connected_user_ids)

    def are_all_leaders_disconnected(self) -> bool:
        """모든 리더의 접속이 끊겼는지 확인"""
        connected_user_ids = set(self.connected_tokens.values())
        return not any(
            uid in self.leader_user_ids for uid in connected_user_ids
        )

    def add_connection(self, websocket):
        self.connections.append(websocket)

    def remove_connection(self, websocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(self, message: Dict):
        """모든 연결된 클라이언트에게 메시지 전송"""
        disconnected = []
        for connection in self.connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # 연결 끊긴 클라이언트 제거
        for conn in disconnected:
            self.remove_connection(conn)

    def get_state(self) -> AuctionDetailDTO:
        """현재 경매 상태 반환"""
        return AuctionDetailDTO(
            auction_id=self.auction_id,
            status=self.status,
            current_user_id=self.current_user_id,
            current_bid=self.current_bid,
            current_bidder=self.current_bidder,
            timer=self.timer,
            teams=list(self.teams.values()),
            auction_queue=self.auction_queue,
            unsold_queue=self.unsold_queue,
        )

    async def start_auction(self):
        """경매 시작"""
        if self.status != AuctionStatus.WAITING:
            raise ValueError("Auction already started")

        self.status = AuctionStatus.IN_PROGRESS

        # 자동 삭제 태스크 취소
        if self.auto_delete_task and not self.auto_delete_task.done():
            self.auto_delete_task.cancel()

        await self.broadcast(
            {
                "type": MessageType.STATE_CHANGED,
                "data": {"status": self.status.value},
            }
        )

        # 첫 번째 유저 경매 시작
        await self.next_user()

    async def next_user(self):
        """다음 유저 경매 시작"""
        # 타이머가 실행 중이면 중지
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
            self.is_timer_running = False

        # 경매 순서가 비었으면 유찰 목록을 경매 순서로 이동
        if not self.auction_queue and self.unsold_queue:
            self.auction_queue = self.unsold_queue.copy()
            self.unsold_queue = []

        # 큐에서 다음 유저 가져오기
        if self.auction_queue:
            self.current_user_id = self.auction_queue.pop(0)
        else:
            # 모든 경매 완료
            await self.complete_auction()
            return

        self.current_bid = None
        self.current_bidder = None
        self.timer = self.timer_duration

        await self.broadcast(
            {
                "type": MessageType.NEXT_USER,
                "data": {
                    "user_id": self.current_user_id,
                    "auction_queue": self.auction_queue,
                    "unsold_queue": self.unsold_queue,
                },
            }
        )

        # 타이머 시작
        await self.start_timer()

    async def start_timer(self):
        """타이머 시작"""
        self.timer = self.timer_duration
        self.is_timer_running = True

        self.timer_task = asyncio.create_task(self._run_timer())

    async def _run_timer(self):
        """타이머 실행"""
        try:
            while self.timer > 0 and self.is_timer_running:
                await asyncio.sleep(1)
                self.timer -= 1

                # 매초 간단한 틱 이벤트만 전송
                await self.broadcast(
                    {
                        "type": MessageType.TIMER_TICK,
                        "data": {
                            "timer": self.timer,
                        },
                    }
                )

            # 타이머 종료
            if self.is_timer_running:
                await self.timer_expired()
        except asyncio.CancelledError:
            # 타이머가 취소됨 (새 입찰로 인해)
            pass

    async def timer_expired(self):
        """타이머 만료 처리"""
        self.is_timer_running = False

        if self.current_bid is None or self.current_bidder is None:
            # 입찰 없음 - 유찰
            self.unsold_queue.append(self.current_user_id)

            await self.broadcast(
                {
                    "type": MessageType.USER_UNSOLD,
                    "data": {},
                }
            )
        else:
            # 낙찰
            team = self.teams[self.current_bidder]
            team.points -= self.current_bid
            team.member_id_list.append(self.current_user_id)

            await self.broadcast(
                {
                    "type": MessageType.USER_SOLD,
                    "data": {
                        "teams": [
                            team.model_dump() for team in self.teams.values()
                        ],
                    },
                }
            )

        # 다음 유저
        await self.next_user()

    async def place_bid(self, token: str, amount: int) -> Dict:
        """입찰 처리 - 토큰으로 user_id 및 team_id 자동 찾기"""
        # 토큰 검증 및 user_id 찾기
        if token not in self.connected_tokens:
            return {"success": False, "error": "Token not connected"}

        user_id = self.connected_tokens[token]

        # 리더인지 확인
        if user_id not in self.leader_user_ids:
            return {"success": False, "error": "Only leaders can place bids"}

        # team_id 찾기
        team_id = None
        for tid, team in self.teams.items():
            if team.leader_id == user_id:
                team_id = tid
                break

        if team_id is None:
            return {"success": False, "error": "Team not found"}

        # 유효성 검사
        if self.status != AuctionStatus.IN_PROGRESS:
            return {"success": False, "error": "Auction not in progress"}

        if self.current_user_id is None:
            return {"success": False, "error": "No user being auctioned"}

        if team_id not in self.teams:
            return {"success": False, "error": "Team not found"}

        team = self.teams[team_id]

        # 포인트 확인
        if team.points < amount:
            return {"success": False, "error": "Insufficient points"}

        # 현재 입찰가보다 높은지 확인
        min_bid = (self.current_bid + 1) if self.current_bid else 1
        if amount < min_bid:
            return {
                "success": False,
                "error": f"Bid must be at least {min_bid}",
            }

        # 입찰 성공
        self.current_bid = amount
        self.current_bidder = team_id

        # 타이머 리셋
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        await self.broadcast(
            {
                "type": MessageType.BID_PLACED,
                "data": {
                    "team_id": team_id,
                    "leader_id": team.leader_id,
                    "amount": amount,
                },
            }
        )

        # 타이머 재시작
        await self.start_timer()

        return {"success": True}

    async def complete_auction(self):
        """경매 완료"""
        self.status = AuctionStatus.COMPLETED
        self.is_timer_running = False

        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        await self.broadcast(
            {
                "type": MessageType.STATE_CHANGED,
                "data": {"status": self.status.value},
            }
        )

        # 경매 완료 후 5초 뒤 경매 종료 및 제거 예약
        asyncio.create_task(self._delayed_terminate())

    async def terminate_auction(self):
        """경매 종료 - 모든 연결 해제 및 정리"""
        self.is_timer_running = False

        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        # 모든 WebSocket 연결 종료
        for connection in self.connections[:]:  # 복사본으로 순회
            try:
                await connection.close()
            except Exception:
                pass

        self.connections.clear()
        self.connected_tokens.clear()

    async def _delayed_terminate(self):
        """경매 완료 후 지연된 경매 종료"""
        await asyncio.sleep(5)  # 5초 대기
        await self.terminate_auction()
        # 매니저에서 경매 제거는 매니저가 직접 처리
        from auction.auction_manager import auction_manager

        auction_manager.remove_auction(self.auction_id)
