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
        self.is_timer_running = False
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

    def is_any_leader_disconnected(self) -> bool:
        """Check if any leader is disconnected"""
        connected_user_ids = set(self.connected_tokens.values())
        return not self.leader_user_ids.issubset(connected_user_ids)

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
        """
        Centralized status management with automatic task and timer handling
        All state saving and broadcasting is done automatically.

        Args:
            new_status: Target status to set
        """
        old_status = self.status

        # Handle status-specific logic BEFORE changing status
        if new_status == AuctionStatus.WAITING:
            # Save state if transitioning from IN_PROGRESS (for pause/resume)
            if old_status == AuctionStatus.IN_PROGRESS:
                self.was_in_progress = True
                self.paused_timer = (
                    self.timer if self.is_timer_running else None
                )

            # Stop timer
            self.is_timer_running = False
            if self.timer_task and not self.timer_task.done():
                self.timer_task.cancel()

            # Start auto-delete task
            self._start_auto_delete_task()

        elif new_status == AuctionStatus.IN_PROGRESS:
            # Cancel auto-delete task
            self._cancel_auto_delete_task()

            # Resume timer if coming from pause
            if old_status == AuctionStatus.WAITING and self.was_in_progress:
                self.was_in_progress = False
                if self.paused_timer is not None:
                    await self._resume_timer()

        elif new_status == AuctionStatus.COMPLETED:
            # Stop timer
            self.is_timer_running = False
            if self.timer_task and not self.timer_task.done():
                self.timer_task.cancel()

            # Cancel auto-delete task
            self._cancel_auto_delete_task()

        # Change status
        self.status = new_status

        # Always broadcast status change
        await self.broadcast(
            {
                "type": MessageType.STATUS,
                "data": {"status": self.status.value},
            }
        )

    async def _resume_timer(self):
        """Resume timer from paused state (internal use by set_status)"""
        if self.paused_timer is not None:
            self.timer = self.paused_timer
            self.paused_timer = None
        else:
            self.timer = self.timer_duration

        self.is_timer_running = True
        self.timer_task = asyncio.create_task(self._timer())

    async def start(self):
        if self.status != AuctionStatus.WAITING:
            raise ValueError("Auction already started")

        await self.set_status(AuctionStatus.IN_PROGRESS)
        await self.next_user()

    async def next_user(self):
        # Timer control is handled by set_status, just stop current timer
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
            self.is_timer_running = False

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

        await self.start_timer()

    async def start_timer(self):
        """Start new timer for current bid"""
        self.timer = self.timer_duration
        self.is_timer_running = True
        self.timer_task = asyncio.create_task(self._timer())

    async def _timer(self):
        try:
            while self.timer > 0 and self.is_timer_running:
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

            if self.is_timer_running:
                await self.timer_expired()
        except asyncio.CancelledError:
            pass

    async def timer_expired(self):
        self.is_timer_running = False

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

        await self.start_timer()

        return {"success": True}

    async def complete_auction(self):
        await self.set_status(AuctionStatus.COMPLETED)
        asyncio.create_task(self._delayed_terminate())

    async def pause_auction(self):
        """Pause auction and return to WAITING status when a leader disconnects"""
        await self.set_status(AuctionStatus.WAITING)

    async def resume_auction(self):
        """Resume auction to IN_PROGRESS when all leaders reconnect"""
        if not self.was_in_progress:
            return

        await self.set_status(AuctionStatus.IN_PROGRESS)

    async def check_and_resume(self):
        """Check if all leaders are connected and resume if paused"""
        if (
            self.status == AuctionStatus.WAITING
            and self.was_in_progress
            and self.are_all_leaders_connected()
        ):
            await self.resume_auction()

    async def terminate_auction(self):
        self.is_timer_running = False

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
