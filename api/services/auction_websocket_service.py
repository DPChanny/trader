import logging
from typing import Optional, Tuple

from fastapi import WebSocket

from auction.auction import Auction
from auction.auction_manager import auction_manager
from dtos.auction_dto import MessageType, AuctionStatus

logger = logging.getLogger(__name__)


async def handle_websocket_connect(
    websocket: WebSocket, token: str
) -> Tuple[Optional[Auction], Optional[int], bool, Optional[int]]:
    auction = auction_manager.get_auction_by_token(token)

    if not auction:
        logger.warning(
            "WebSocket connection failed: Auction not found for token"
        )
        await websocket.close(code=4004, reason="Auction not found")
        return None, None, False, None

    token_info = auction_manager.get_token(token)

    if not token_info:
        logger.warning("WebSocket connection failed: Invalid token")
        await websocket.close(code=4001, reason="Invalid token")
        return None, None, False, None

    user_id = token_info.user_id
    is_leader = token_info.is_leader

    await websocket.accept()
    logger.info(f"WebSocket connection accepted for user {user_id}")

    result = auction.connect(token)

    if not result["success"]:
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": result["error"]}}
        )
        await websocket.close()
        return None, None, False, None

    team_id = result.get("team_id")

    auction.add_connection(websocket)

    return auction, user_id, is_leader, team_id


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
            logger.warning("Bid attempt by non-leader rejected")
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
            logger.warning("Bid attempt without amount")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Amount required"},
                }
            )
            return

        logger.info(f"Placing bid: amount={amount}")
        bid_result = await auction.place_bid(token, amount)

        if not bid_result.get("success"):
            logger.warning(f"Bid failed: {bid_result.get('error')}")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": bid_result.get("error", "Bid failed")},
                }
            )


async def handle_websocket_disconnect(
    auction: Auction,
    token: str,
    websocket: WebSocket,
) -> None:
    auction.disconnect_token(token)
    auction.remove_connection(websocket)
    logger.info(f"WebSocket disconnected successfully")

    if (
        auction.status == AuctionStatus.IN_PROGRESS
        and not auction.are_all_leaders_connected()
    ):
        logger.warning(
            f"Leader disconnected during auction, pausing to WAITING status"
        )
        await auction.set_status(AuctionStatus.WAITING)
