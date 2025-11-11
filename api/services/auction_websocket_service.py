from fastapi import WebSocket
from typing import Optional, Tuple

from auction.auction_manager import auction_manager
from auction.auction import Auction
from dtos.auction_dto import MessageType


async def handle_websocket_connection(
    websocket: WebSocket, token: str
) -> Tuple[
    Optional[Auction], Optional[int], Optional[str], bool, Optional[int]
]:
    auction = auction_manager.get_auction_by_token(token)

    if not auction:
        print(f"[WebSocket] Auction not found for token")
        await websocket.close(code=4004, reason="Auction not found")
        return None, None, None, False, None

    token_info = auction_manager.get_token(token)

    if not token_info:
        print(f"[WebSocket] Invalid token")
        await websocket.close(code=4001, reason="Invalid token")
        return None, None, None, False, None

    user_id = token_info.user_id
    role = token_info.role

    print(
        f"[WebSocket] Token validated: auction={auction.auction_id}, user={user_id}, role={role}"
    )

    await websocket.accept()
    print(f"[WebSocket] Connection accepted")

    result = auction.connect(token)

    if not result["success"]:
        print(f"[WebSocket] Connection failed: {result.get('error')}")
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": result["error"]}}
        )
        await websocket.close()
        return None, None, None, False, None

    is_leader = result["is_leader"]
    team_id = result.get("team_id")

    auction.add_connection(websocket)
    print(
        f"[WebSocket] Connection added (leader={is_leader}, team_id={team_id})"
    )

    return auction, user_id, role, is_leader, team_id


async def handle_websocket_message(
    websocket: WebSocket,
    auction: Auction,
    token: str,
    message: dict,
    is_leader: bool,
) -> None:
    message_type = message.get("type")

    if message_type == MessageType.PLACE_BID.value:
        if not is_leader:
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Only leaders can place bids"},
                }
            )
            return

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Amount required"},
                }
            )
            return

        bid_result = await auction.place_bid(token, amount)

        if not bid_result.get("success"):
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": bid_result.get("error", "Bid failed")},
                }
            )


async def handle_websocket_disconnect(
    auction: Auction,
    auction_id: int,
    token: str,
    websocket: WebSocket,
) -> None:
    auction.disconnect_token(token)
    auction.remove_connection(websocket)

    if (
        auction.status.value == "in_progress"
        and auction.are_all_leaders_disconnected()
    ):
        print(f"[WebSocket] All leaders disconnected, terminating auction")
        await auction.terminate_auction()
        auction_manager.remove_auction(auction_id)
