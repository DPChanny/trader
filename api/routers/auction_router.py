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
from services.auction_service import (
    create_auction_service,
    get_auction_list_service,
    get_auction_detail_service,
    delete_auction_service,
)
from dtos.auction_dto import (
    MessageType,
    CreateAuctionResponseDTO,
    GetAuctionListResponseDTO,
    GetAuctionDetailResponseDTO,
    DeleteAuctionResponseDTO,
)

auction_router = APIRouter()


@auction_router.post("/{preset_id}", response_model=CreateAuctionResponseDTO)
async def create_auction(
    preset_id: int, db: Session = Depends(get_db)
) -> CreateAuctionResponseDTO:
    """경매 세션 생성"""
    return create_auction_service(preset_id, db)


@auction_router.websocket("/ws/{token}")
async def auction_websocket(websocket: WebSocket, token: str):
    """통합 WebSocket 연결 - 토큰으로 리더/관전자 구분"""
    print(f"[WebSocket] Connection request with token: {token[:8]}...")

    # 토큰으로 경매 가져오기 (메모리에서)
    auction = auction_manager.get_auction_by_token(token)

    if not auction:
        print(f"[WebSocket] Auction not found for token")
        await websocket.close(code=4004, reason="Auction not found")
        return

    auction_id = auction.auction_id

    # 토큰 정보 가져오기 (메모리에서)
    token_info = auction_manager.get_token_info(token)

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

    # 토큰으로 연결 시도
    result = auction.connect_with_token(token)

    if not result["success"]:
        print(f"[WebSocket] Connection failed: {result.get('error')}")
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": result["error"]}}
        )
        await websocket.close()
        return

    is_leader = result["is_leader"]
    team_id = result.get("team_id")

    # 연결 추가
    auction.add_connection(websocket)
    print(
        f"[WebSocket] Connection added (leader={is_leader}, team_id={team_id})"
    )

    try:
        # 현재 상태 전송
        state = auction.get_state().model_dump()
        await websocket.send_json(
            {
                "type": MessageType.GET_STATE,
                "data": state,
            }
        )
        print(f"[WebSocket] Initial state sent")

        # 모든 리더가 연결되었는지 확인하고 자동 시작
        if (
            auction.are_all_leaders_connected()
            and auction.status.value == "waiting"
        ):
            print(f"[WebSocket] All leaders connected, auto-starting auction")
            await auction.start_auction()

        # 메시지 수신 대기
        print(f"[WebSocket] Entering message loop")
        while True:
            data = await websocket.receive_text()
            print(f"[WebSocket] Received message: {data}")
            message = json.loads(data)
            message_type = message.get("type")

            if message_type == MessageType.GET_STATE:
                # 현재 상태 요청 (모두 가능)
                await websocket.send_json(
                    {
                        "type": MessageType.GET_STATE,
                        "data": auction.get_state().model_dump(),
                    }
                )

            elif message_type == MessageType.PLACE_BID:
                # 입찰 (리더만 가능)
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

        # 경매 진행 중이고 모든 리더가 접속 해제되면 경매 종료
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

        # 경매 진행 중이고 모든 리더가 접속 해제되면 경매 종료
        if (
            auction.status.value == "in_progress"
            and auction.are_all_leaders_disconnected()
        ):
            print(f"[WebSocket] All leaders disconnected, terminating auction")
            await auction.terminate_auction()
            auction_manager.remove_auction(auction_id)

        await websocket.close()


@auction_router.get("/", response_model=GetAuctionListResponseDTO)
async def get_auctions() -> GetAuctionListResponseDTO:
    """경매 세션 리스트 조회"""
    return get_auction_list_service()


@auction_router.get("/{auction_id}", response_model=GetAuctionDetailResponseDTO)
async def get_auction_detail(auction_id: str) -> GetAuctionDetailResponseDTO:
    """경매 상태 조회"""
    return get_auction_detail_service(auction_id)


@auction_router.delete("/{auction_id}", response_model=DeleteAuctionResponseDTO)
async def delete_auction(auction_id: str) -> DeleteAuctionResponseDTO:
    """경매 세션 삭제"""
    return delete_auction_service(auction_id)
