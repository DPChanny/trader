import asyncio
import uuid
from typing import Dict, List, Optional
import random

from dtos.auction_dto import (
    AuctionDetailDTO,
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
        leader_access_codes: Dict[int, str],  # team_id -> access_code 매핑
        timer_duration: int = 5,
    ):
        self.session_id = session_id
        self.preset_id = preset_id
        self.status = AuctionStatus.WAITING
        self.teams = {team.team_id: team for team in teams}
        self.leader_access_codes = leader_access_codes  # team_id -> access_code
        self.connected_access_codes: Dict[str, int] = (
            {}
        )  # access_code -> team_id (현재 접속 중인 코드)

        # 유저 순서 섞기 (세션 생성 시)
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

    def connect_with_access_code(self, access_code: str) -> Dict:
        """access_code로 연결 시도"""
        # 이미 접속 중인지 확인
        if access_code in self.connected_access_codes:
            return {
                "success": False,
                "error": "This access code is already connected",
            }

        # 유효한 leader의 access_code인지 확인
        team_id = None
        for tid, code in self.leader_access_codes.items():
            if code == access_code:
                team_id = tid
                break

        if team_id is None:
            return {"success": False, "error": "Invalid access code"}

        # 연결 등록
        self.connected_access_codes[access_code] = team_id

        return {"success": True, "team_id": team_id}

    def disconnect_access_code(self, access_code: str):
        """access_code 연결 해제"""
        if access_code in self.connected_access_codes:
            del self.connected_access_codes[access_code]

    def are_all_leaders_connected(self) -> bool:
        """모든 리더가 연결되었는지 확인"""
        # 모든 팀의 access_code가 connected_access_codes에 있는지 확인
        return len(self.connected_access_codes) == len(self.leader_access_codes)

    def are_all_leaders_disconnected(self) -> bool:
        """모든 리더의 접속이 끊겼는지 확인"""
        return len(self.connected_access_codes) == 0

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

        await self.broadcast(
            {
                "type": MessageType.AUCTION_STARTED,
                "data": {},
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

    async def place_bid(self, access_code: str, amount: int) -> Dict:
        """입찰 처리 - access_code로 team_id 자동 찾기"""
        # access_code 검증 및 team_id 찾기
        if access_code not in self.connected_access_codes:
            return

        team_id = self.connected_access_codes[access_code]

        # 유효성 검사
        if self.status != AuctionStatus.IN_PROGRESS:
            return

        if self.current_user_id is None:
            return

        if team_id not in self.teams:
            return

        team = self.teams[team_id]

        # 포인트 확인
        if team.points < amount:
            return

        # 현재 입찰가보다 높은지 확인
        min_bid = (self.current_bid + 1) if self.current_bid else 1
        if amount < min_bid:
            return

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

    async def complete_auction(self):
        """경매 완료"""
        self.status = AuctionStatus.COMPLETED
        self.is_timer_running = False

        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        await self.broadcast(
            {
                "type": MessageType.AUCTION_COMPLETED,
                "data": {},
            }
        )

        # 경매 완료 후 5초 뒤 세션 종료 및 제거 예약
        asyncio.create_task(self._delayed_terminate())

    async def terminate_session(self):
        """세션 종료 - 모든 연결 해제 및 정리"""
        self.is_timer_running = False

        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        # 모든 연결 종료 알림
        await self.broadcast(
            {
                "type": MessageType.SESSION_TERMINATED,
                "data": {
                    "reason": "All leaders disconnected or auction completed"
                },
            }
        )

        # 모든 WebSocket 연결 종료
        for connection in self.connections[:]:  # 복사본으로 순회
            try:
                await connection.close()
            except Exception:
                pass

        self.connections.clear()
        self.connected_access_codes.clear()

    async def _delayed_terminate(self):
        """경매 완료 후 지연된 세션 종료"""
        await asyncio.sleep(5)  # 5초 대기
        await self.terminate_session()
        # 매니저에서 세션 제거는 매니저가 직접 처리
        from services.auction_service import auction_manager

        auction_manager.remove_session(self.session_id)


class AuctionManager:
    """경매 세션 관리"""

    def __init__(self):
        self.sessions: Dict[str, AuctionSession] = {}

    def create_session(
        self,
        preset_id: int,
        teams: List[Team],
        user_ids: List[int],
        leader_access_codes: Dict[int, str],
    ) -> str:
        """새 경매 세션 생성"""
        session_id = str(uuid.uuid4())
        session = AuctionSession(
            session_id, preset_id, teams, user_ids, leader_access_codes
        )
        self.sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[AuctionSession]:
        """세션 가져오기"""
        return self.sessions.get(session_id)

    def get_all_sessions(self) -> Dict[str, AuctionSession]:
        """모든 세션 가져오기"""
        return self.sessions

    def remove_session(self, session_id: str):
        """세션 제거"""
        if session_id in self.sessions:
            del self.sessions[session_id]


# 전역 매니저 인스턴스
auction_manager = AuctionManager()


# HTTP Service Functions
from sqlalchemy.orm import Session, joinedload
from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from dtos.auction_dto import (
    CreateAuctionResponseDTO,
    GetAuctionDetailResponseDTO,
    GetAuctionListResponseDTO,
    DeleteSessionResponseDTO,
    AuctionDTO,
    AuctionDetailDTO,
)
from exception import CustomException, handle_exception


def create_auction_session_service(
    preset_id: int, db: Session
) -> CreateAuctionResponseDTO:
    """경매 세션 생성 서비스"""
    try:
        # Preset 정보 가져오기
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            raise CustomException(404, "Preset not found")

        if not preset.preset_leaders:
            raise CustomException(400, "No leaders found in preset")

        if not preset.preset_users:
            raise CustomException(400, "No users found in preset")

        # 팀 생성 (리더 기반, 리더는 이미 팀에 포함)
        teams = []
        leader_access_codes = {}  # team_id -> access_code 매핑

        for leader in preset.preset_leaders:
            team_id = leader.preset_leader_id
            teams.append(
                Team(
                    team_id=team_id,
                    leader_id=leader.user_id,
                    member_id_list=[leader.user_id],  # 리더는 이미 팀에 포함
                    points=1000,  # 기본 포인트
                )
            )
            # leader의 user access_code 저장
            leader_access_codes[team_id] = leader.user.access_code

        # 경매할 유저 ID 목록 (리더 제외)
        leader_user_ids = {leader.user_id for leader in preset.preset_leaders}
        user_ids = [
            pu.user_id
            for pu in preset.preset_users
            if pu.user_id not in leader_user_ids
        ]

        # 세션 생성
        session_id = auction_manager.create_session(
            preset_id=preset_id,
            teams=teams,
            user_ids=user_ids,
            leader_access_codes=leader_access_codes,
        )

        return CreateAuctionResponseDTO(
            success=True,
            code=201,
            message="Auction session created successfully.",
            data=AuctionDTO(
                session_id=session_id,
                preset_id=preset_id,
                status=AuctionStatus.WAITING.value,
            ),
        )

    except Exception as e:
        handle_exception(e, db)


def get_auctionㄴ_service() -> GetAuctionListResponseDTO:
    """경매 세션 리스트 조회 서비스"""
    try:
        sessions = auction_manager.get_all_sessions()

        session_list = []
        for session_id, session in sessions.items():
            session_list.append(
                AuctionDTO(
                    session_id=session_id,
                    preset_id=session.preset_id,
                    status=session.status.value,
                )
            )

        return GetAuctionListResponseDTO(
            success=True,
            code=200,
            message="Auction sessions retrieved successfully.",
            data=session_list,
        )

    except Exception as e:
        raise CustomException(500, str(e))


def get_auction_detail_service(session_id: str) -> GetAuctionDetailResponseDTO:
    """경매 상태 조회 서비스"""
    try:
        session = auction_manager.get_session(session_id)
        if not session:
            raise CustomException(404, "Session not found")

        return GetAuctionDetailResponseDTO(
            success=True,
            code=200,
            message="Auction state retrieved successfully.",
            data=session.get_state(),
        )

    except Exception as e:
        if isinstance(e, CustomException):
            raise e
        raise CustomException(500, str(e))


def delete_auction_service(
    session_id: str,
) -> DeleteSessionResponseDTO:
    """경매 세션 삭제 서비스"""
    try:
        session = auction_manager.get_session(session_id)
        if not session:
            raise CustomException(404, "Session not found")

        auction_manager.remove_session(session_id)

        return DeleteSessionResponseDTO(
            success=True,
            code=200,
            message="Auction session deleted successfully.",
            data=None,
        )

    except Exception as e:
        if isinstance(e, CustomException):
            raise e
        raise CustomException(500, str(e))
