import asyncio
import uuid
from typing import Dict, List, Optional
import random

from dtos.auction_dto import (
    AuctionState,
    AuctionStatus,
    Team,
    MessageType,
)


class AuctionSession:
    def __init__(
        self,
        session_id: str,
        preset_id: int,
        teams: List[Team],
        user_ids: List[int],
        timer_duration: int = 30,
    ):
        self.session_id = session_id
        self.preset_id = preset_id
        self.status = AuctionStatus.WAITING
        self.teams = {team.team_id: team for team in teams}
        self.auction_queue = user_ids.copy()
        self.unsold_queue: List[int] = []
        self.current_user_id: Optional[int] = None
        self.current_bid: Optional[int] = None
        self.current_bidder: Optional[int] = None
        self.timer_duration = timer_duration
        self.timer = timer_duration
        self.timer_task: Optional[asyncio.Task] = None
        self.connections: List = []  # WebSocket connections
        self.is_timer_running = False

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

    def get_state(self) -> AuctionState:
        """현재 경매 상태 반환"""
        return AuctionState(
            session_id=self.session_id,
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

        # 유저 순서 섞기
        random.shuffle(self.auction_queue)

        await self.broadcast(
            {
                "type": MessageType.AUCTION_STARTED,
                "data": {
                    "auction_queue": self.auction_queue,
                },
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

        # 큐에서 다음 유저 가져오기
        if self.auction_queue:
            self.current_user_id = self.auction_queue.pop(0)
        elif self.unsold_queue:
            # 유찰 큐에서 가져오기
            self.current_user_id = self.unsold_queue.pop(0)
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
                },
            }
        )

        # 타이머 시작
        await self.start_timer()

    async def start_timer(self):
        """타이머 시작"""
        self.timer = self.timer_duration
        self.is_timer_running = True

        await self.broadcast(
            {
                "type": MessageType.TIMER_STARTED,
                "data": {"timer": self.timer},
            }
        )

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
                    "data": {
                        "user_id": self.current_user_id,
                    },
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
                    "data": {},
                }
            )

        # 다음 유저
        await self.next_user()

    async def place_bid(self, team_id: int, amount: int) -> Dict:
        """입찰 처리"""
        # 유효성 검사
        if self.status != AuctionStatus.IN_PROGRESS:
            return {
                "success": False,
                "error": "Auction is not in progress",
            }

        if self.current_user_id is None:
            return {"success": False, "error": "No current user"}

        if team_id not in self.teams:
            return {"success": False, "error": "Invalid team ID"}

        team = self.teams[team_id]

        # 포인트 확인
        if team.points < amount:
            return {
                "success": False,
                "error": f"Insufficient points. Available: {team.points}, Bid: {amount}",
            }

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
                    "amount": amount,
                },
            }
        )

        # 타이머 재시작
        await self.start_timer()

        return {"success": True, "bid": amount}

    async def complete_auction(self):
        """경매 완료"""
        self.status = AuctionStatus.COMPLETED
        self.is_timer_running = False

        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        await self.broadcast(
            {
                "type": MessageType.AUCTION_COMPLETED,
                "data": {
                    "teams": [
                        team.model_dump() for team in self.teams.values()
                    ],
                    "unsold_queue": self.unsold_queue,
                },
            }
        )


class AuctionManager:
    """경매 세션 관리"""

    def __init__(self):
        self.sessions: Dict[str, AuctionSession] = {}

    def create_session(
        self,
        preset_id: int,
        teams: List[Team],
        user_ids: List[int],
    ) -> str:
        """새 경매 세션 생성"""
        session_id = str(uuid.uuid4())
        session = AuctionSession(session_id, preset_id, teams, user_ids)
        self.sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[AuctionSession]:
        """세션 가져오기"""
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str):
        """세션 제거"""
        if session_id in self.sessions:
            del self.sessions[session_id]


# 전역 매니저 인스턴스
auction_manager = AuctionManager()
