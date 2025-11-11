import asyncio
from typing import Dict, List, Optional
import random

from dtos.auction_dto import (
    AuctionStateDTO,
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
        user_tokens: Dict[int, str],
        timer_duration: int = 5,
    ):
        self.auction_id = auction_id
        self.preset_id = preset_id
        self.status = AuctionStatus.WAITING
        self.teams = {team.team_id: team for team in teams}
        self.user_tokens = user_tokens
        self.token_to_user: Dict[str, int] = {
            token: user_id for user_id, token in user_tokens.items()
        }
        self.connected_tokens: Dict[str, int] = {}
        self.leader_user_ids = {team.leader_id for team in teams}

        auction_users = [
            uid for uid in user_ids if uid not in self.leader_user_ids
        ]
        shuffled_users = auction_users.copy()
        random.shuffle(shuffled_users)
        self.auction_queue = shuffled_users

        self.unsold_queue: List[int] = []
        self.current_user_id: Optional[int] = None
        self.current_bid: Optional[int] = None
        self.current_bidder: Optional[int] = None
        self.timer_duration = timer_duration
        self.timer = timer_duration
        self.timer_task: Optional[asyncio.Task] = None
        self.connections: List = []
        self.auto_delete_task: Optional[asyncio.Task] = None

        # For pause/resume functionality
        self.paused_timer: Optional[int] = None
        self.was_in_progress: bool = False

        # Start with auto-delete task since initial status is WAITING
        self._start_auto_delete_task()

    def _start_auto_delete_task(self):
        """Start auto-delete task for WAITING status"""
        if self.auto_delete_task and not self.auto_delete_task.done():
            self.auto_delete_task.cancel()
        self.auto_delete_task = asyncio.create_task(self._auto_delete())

    def _cancel_auto_delete_task(self):
        """Cancel auto-delete task"""
        if self.auto_delete_task and not self.auto_delete_task.done():
            self.auto_delete_task.cancel()
            self.auto_delete_task = None

    async def _auto_delete(self):
        await asyncio.sleep(300)
        if self.status == AuctionStatus.WAITING:
            print(
                f"Auto-deleting auction {self.auction_id} - still in WAITING after 5 minutes"
            )
            await self.terminate_auction()
            from auction.auction_manager import auction_manager

            auction_manager.remove_auction(self.auction_id)

    def connect(self, token: str) -> Dict:
        if token not in self.token_to_user:
            return {"success": False, "error": "Invalid token"}

        if token in self.connected_tokens:
            return {
                "success": False,
                "error": "This token is already connected",
            }

        user_id = self.token_to_user[token]
        is_leader = user_id in self.leader_user_ids

        team_id = None
        if is_leader:
            for tid, team in self.teams.items():
                if team.leader_id == user_id:
                    team_id = tid
                    break

        self.connected_tokens[token] = user_id

        return {
            "success": True,
            "user_id": user_id,
            "is_leader": is_leader,
            "team_id": team_id,
            "reconnected": False,
        }

    def disconnect_token(self, token: str):
        if token in self.connected_tokens:
            del self.connected_tokens[token]

    def are_all_leaders_connected(self) -> bool:
        connected_user_ids = set(self.connected_tokens.values())
        return self.leader_user_ids.issubset(connected_user_ids)

    def add_connection(self, websocket):
        self.connections.append(websocket)

    def remove_connection(self, websocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(self, message: Dict):
        disconnected = []
        for connection in self.connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.remove_connection(conn)

    def get_state(self) -> AuctionStateDTO:
        return AuctionStateDTO(
            auction_id=self.auction_id,
            preset_id=self.preset_id,
            status=self.status,
            current_user_id=self.current_user_id,
            current_bid=self.current_bid,
            current_bidder=self.current_bidder,
            timer=self.timer,
            teams=list(self.teams.values()),
            auction_queue=self.auction_queue,
            unsold_queue=self.unsold_queue,
        )

    async def set_status(self, new_status: AuctionStatus):
        if self.status == new_status:
            return

        old_status = self.status

        if new_status == AuctionStatus.WAITING:
            if old_status == AuctionStatus.IN_PROGRESS:
                self.was_in_progress = True
                is_timer_running = (
                    self.timer_task
                    and not self.timer_task.done()
                    and not self.timer_task.cancelled()
                )
                self.paused_timer = self.timer if is_timer_running else None

            self._stop_timer()
            self._start_auto_delete_task()

        elif new_status == AuctionStatus.IN_PROGRESS:
            self._cancel_auto_delete_task()

            if old_status == AuctionStatus.WAITING and self.was_in_progress:
                self.was_in_progress = False
                await self._start_timer()

        elif new_status == AuctionStatus.COMPLETED:
            self._stop_timer()
            self._cancel_auto_delete_task()

        self.status = new_status

        await self.broadcast(
            {
                "type": MessageType.STATUS,
                "data": {"status": self.status.value},
            }
        )

    def _stop_timer(self):
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

    async def _start_timer(self):
        if self.paused_timer is not None:
            self.timer = self.paused_timer
            self.paused_timer = None
        else:
            self.timer = self.timer_duration

        self.timer_task = asyncio.create_task(self._timer())

    async def start(self):
        if self.status != AuctionStatus.WAITING:
            raise ValueError("Auction already started")

        await self.set_status(AuctionStatus.IN_PROGRESS)
        await self.next_user()

    async def next_user(self):
        self._stop_timer()

        incomplete_teams = [
            team for team in self.teams.values() if len(team.member_id_list) < 5
        ]

        if len(incomplete_teams) == 1:
            incomplete_team = incomplete_teams[0]
            remaining_users = self.auction_queue + self.unsold_queue

            for user_id in remaining_users:
                incomplete_team.member_id_list.append(user_id)

            self.auction_queue = []
            self.unsold_queue = []

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

            await self.complete_auction()
            return

        if not self.auction_queue and self.unsold_queue:
            self.auction_queue = self.unsold_queue.copy()
            self.unsold_queue = []

        if self.auction_queue:
            self.current_user_id = self.auction_queue.pop(0)
        else:
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

        await self._start_timer()

    async def _timer(self):
        try:
            while self.timer > 0:
                await asyncio.sleep(1)
                self.timer -= 1

                await self.broadcast(
                    {
                        "type": MessageType.TIMER,
                        "data": {
                            "timer": self.timer,
                        },
                    }
                )

            await self.timer_expired()
        except asyncio.CancelledError:
            pass

    async def timer_expired(self):
        if self.current_bid is None or self.current_bidder is None:
            self.unsold_queue.append(self.current_user_id)

            await self.broadcast(
                {
                    "type": MessageType.USER_UNSOLD,
                    "data": {},
                }
            )
        else:
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

        await self.next_user()

    async def place_bid(self, token: str, amount: int) -> Dict:
        if token not in self.connected_tokens:
            return {"success": False, "error": "Token not connected"}

        user_id = self.connected_tokens[token]

        if user_id not in self.leader_user_ids:
            return {"success": False, "error": "Only leaders can place bids"}

        team_id = None
        for tid, team in self.teams.items():
            if team.leader_id == user_id:
                team_id = tid
                break

        if team_id is None:
            return {"success": False, "error": "Team not found"}

        if self.status != AuctionStatus.IN_PROGRESS:
            return {"success": False, "error": "Auction not in progress"}

        if self.current_user_id is None:
            return {"success": False, "error": "No user being auctioned"}

        if team_id not in self.teams:
            return {"success": False, "error": "Team not found"}

        team = self.teams[team_id]

        if len(team.member_id_list) >= 5:
            return {"success": False, "error": "Team already has 5 members"}

        remaining_slots = 5 - len(team.member_id_list)
        min_points_to_reserve = remaining_slots - 1
        max_allowed_bid = team.points - min_points_to_reserve

        if amount > max_allowed_bid:
            return {
                "success": False,
                "error": f"Bid too high. Must keep {min_points_to_reserve} points for {remaining_slots - 1} remaining slots (max: {max_allowed_bid})",
            }

        if team.points < amount:
            return {"success": False, "error": "Insufficient points"}

        min_bid = (self.current_bid + 1) if self.current_bid else 1
        if amount < min_bid:
            return {
                "success": False,
                "error": f"Bid must be at least {min_bid}",
            }

        self.current_bid = amount
        self.current_bidder = team_id

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

        await self._start_timer()

        return {"success": True}

    async def complete_auction(self):
        self.current_user_id = None
        self.current_bid = None
        self.current_bidder = None

        await self.set_status(AuctionStatus.COMPLETED)
        asyncio.create_task(self._delayed_terminate())

    async def check_and_resume(self):
        if (
            self.status == AuctionStatus.WAITING
            and self.was_in_progress
            and self.are_all_leaders_connected()
        ):
            await self.set_status(AuctionStatus.IN_PROGRESS)

    async def terminate_auction(self):
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        for connection in self.connections[:]:
            try:
                await connection.close()
            except Exception:
                pass

        self.connections.clear()
        self.connected_tokens.clear()

    async def _delayed_terminate(self):
        await asyncio.sleep(5)
        await self.terminate_auction()
        from auction.auction_manager import auction_manager

        auction_manager.remove_auction(self.auction_id)
