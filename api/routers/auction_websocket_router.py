from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)
import json

from services.auction_websocket_service import (
    handle_websocket_connection,
    handle_websocket_message,
    handle_websocket_disconnect,
)
from dtos.auction_dto import MessageType

auction_websocket_router = APIRouter()


@auction_websocket_router.websocket("/{token}")
async def auction_websocket(websocket: WebSocket, token: str):
    print(f"[WebSocket] Connection request with token: {token[:8]}...")

    auction, user_id, role, is_leader, team_id = (
        await handle_websocket_connection(websocket, token)
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
        print(f"[WebSocket] Initial state with connection info sent")

        if (
            auction.are_all_leaders_connected()
            and auction.status.value == "waiting"
        ):
            print(f"[WebSocket] All leaders connected, auto-starting auction")
            await auction.start()

        print(f"[WebSocket] Entering message loop")
        while True:
            data = await websocket.receive_text()
            print(f"[WebSocket] Received message: {data}")
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, token, message, is_leader
            )

    except WebSocketDisconnect:
        print(f"[WebSocket] Disconnected normally")
        await handle_websocket_disconnect(auction, auction_id, token, websocket)

    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        import traceback

        traceback.print_exc()
        await handle_websocket_disconnect(auction, auction_id, token, websocket)
        await websocket.close()
