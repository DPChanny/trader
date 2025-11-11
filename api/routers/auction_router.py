from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
)
from sqlalchemy.orm import Session
import json

from database import get_db
from auction.auction_manager import auction_manager
from services.auction_service import create_auction_service
from dtos.auction_dto import (
    MessageType,
    CreateAuctionResponseDTO,
)

auction_router = APIRouter()


@auction_router.post("/{preset_id}", response_model=CreateAuctionResponseDTO)
async def create_auction(
    preset_id: int, db: Session = Depends(get_db)
) -> CreateAuctionResponseDTO:
    return create_auction_service(preset_id, db)


@auction_router.websocket("/ws/{token}")
async def auction_websocket(websocket: WebSocket, token: str):
    print(f"[WebSocket] Connection request with token: {token[:8]}...")

    auction = auction_manager.get_auction_by_token(token)

    if not auction:
        print(f"[WebSocket] Auction not found for token")
        await websocket.close(code=4004, reason="Auction not found")
        return

    auction_id = auction.auction_id

    token_info = auction_manager.get_token(token)

    if not token_info:
        print(f"[WebSocket] Invalid token")
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = token_info.user_id
    role = token_info.role

    print(
        f"[WebSocket] Token validated: auction={auction_id}, user={user_id}, role={role}"
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
        return

    is_leader = result["is_leader"]
    team_id = result.get("team_id")

    auction.add_connection(websocket)
    print(
        f"[WebSocket] Connection added (leader={is_leader}, team_id={team_id})"
    )

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
            message_type = message.get("type")

            if message_type == MessageType.PLACE_BID.value:
                if not is_leader:
                    await websocket.send_json(
                        {
                            "type": MessageType.ERROR,
                            "data": {"error": "Only leaders can place bids"},
                        }
                    )
                    continue

                bid_data = message.get("data", {})
                amount = bid_data.get("amount")

                if amount is None:
                    await websocket.send_json(
                        {
                            "type": MessageType.ERROR,
                            "data": {"error": "Amount required"},
                        }
                    )
                    continue

                bid_result = await auction.place_bid(token, amount)

                if not bid_result.get("success"):
                    await websocket.send_json(
                        {
                            "type": MessageType.ERROR,
                            "data": {
                                "error": bid_result.get("error", "Bid failed")
                            },
                        }
                    )

    except WebSocketDisconnect:
        print(f"[WebSocket] Disconnected normally")
        auction.disconnect_token(token)
        auction.remove_connection(websocket)

        if (
            auction.status.value == "in_progress"
            and auction.are_all_leaders_disconnected()
        ):
            print(f"[WebSocket] All leaders disconnected, terminating auction")
            await auction.terminate_auction()
            auction_manager.remove_auction(auction_id)

    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        import traceback

        traceback.print_exc()
        auction.disconnect_token(token)
        auction.remove_connection(websocket)

        if (
            auction.status.value == "in_progress"
            and auction.are_all_leaders_disconnected()
        ):
            print(f"[WebSocket] All leaders disconnected, terminating auction")
            await auction.terminate_auction()
            auction_manager.remove_auction(auction_id)

        await websocket.close()
