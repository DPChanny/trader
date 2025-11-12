import json
import logging

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from dtos.auction_dto import AuctionStatus, MessageType
from services.auction_websocket_service import (
    handle_websocket_connect,
    handle_websocket_message,
    handle_websocket_disconnect,
)

logger = logging.getLogger(__name__)

auction_websocket_router = APIRouter(prefix="/auction", tags=["auction_websocket"])


@auction_websocket_router.websocket("/{token}")
async def auction_websocket(websocket: WebSocket, token: str):
    logger.info(f"WebSocket connection request received (token: {token[:8]}...)")

    auction, user_id, role, is_leader, team_id = await handle_websocket_connect(
        websocket, token
    )

    if not auction:
        return

    auction_id = auction.auction_id

    try:
        state = auction.get_state().model_dump()
        init = {
            **state,
            "team_id": team_id,
            "user_id": user_id,
            "role": role,
        }
        await websocket.send_json(
            {
                "type": MessageType.INIT,
                "data": init,
            }
        )
        logger.info(f"WebSocket initial state sent to user {user_id}")

        if is_leader and auction.are_all_leaders_connected():
            if auction.status == AuctionStatus.WAITING:
                await auction.set_status(AuctionStatus.IN_PROGRESS)

        logger.debug(f"WebSocket entering message loop for user {user_id}")
        while True:
            data = await websocket.receive_text()
            logger.debug(f"WebSocket message received from user {user_id}")
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, token, message, is_leader
            )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for user {user_id}")
        await handle_websocket_disconnect(auction, auction_id, token, websocket)

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        import traceback

        logger.error(traceback.format_exc())
        await handle_websocket_disconnect(auction, auction_id, token, websocket)
        await websocket.close()
