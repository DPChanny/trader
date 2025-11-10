from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
)
from sqlalchemy.orm import Session
import json

from database import get_db
from services.auction_service import (
    auction_manager,
    create_auction_session_service,
    get_auctionㄴ_service,
    get_auction_detail_service,
    delete_auction_service,
)
from dtos.auction_dto import (
    MessageType,
    CreateAuctionResponseDTO,
    GetAuctionListResponseDTO,
    GetAuctionDetailResponseDTO,
    DeleteSessionResponseDTO,
)

auction_router = APIRouter()


@auction_router.post("/{preset_id}", response_model=CreateAuctionResponseDTO)
async def create_auction_session(
    preset_id: int, db: Session = Depends(get_db)
) -> CreateAuctionResponseDTO:
    """경매 세션 생성"""
    return create_auction_session_service(preset_id, db)


@auction_router.websocket("/ws/{session_id}/observer")
async def auction_websocket_observer(websocket: WebSocket, session_id: str):
    """경매 WebSocket 연결 - 관전자"""
    print(f"[Observer] WebSocket request for session {session_id}")
    await websocket.accept()
    print(f"[Observer] WebSocket accepted")

    # 세션 가져오기
    session = auction_manager.get_session(session_id)
    if not session:
        print(f"[Observer] Session not found: {session_id}")
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": "Session not found"}}
        )
        await websocket.close()
        return

    # 연결 추가
    session.add_connection(websocket)
    print(f"[Observer] Connection added to session")

    try:
        # 현재 상태 전송 (연결 시 한 번만)
        state = session.get_state().model_dump()
        print(f"[Observer] Sending initial state")
        await websocket.send_json(
            {
                "type": MessageType.GET_STATE,
                "data": state,
            }
        )
        print(f"[Observer] Initial state sent successfully")

        # 메시지 수신 대기 (관전자는 상태 조회만 가능)
        print(f"[Observer] Entering message loop")
        while True:
            data = await websocket.receive_text()
            print(f"[Observer] Received message: {data}")
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "get_state":
                # 현재 상태 요청
                await websocket.send_json(
                    {
                        "type": MessageType.GET_STATE,
                        "data": session.get_state().model_dump(),
                    }
                )
            else:
                # 관전자는 다른 액션 불가
                await websocket.send_json(
                    {
                        "type": MessageType.ERROR,
                        "data": {
                            "error": "Observers can only view auction state"
                        },
                    }
                )

    except WebSocketDisconnect:
        print(f"[Observer] WebSocket disconnected normally")
        session.remove_connection(websocket)
    except Exception as e:
        print(f"[Observer] WebSocket error: {e}")
        import traceback

        traceback.print_exc()
        session.remove_connection(websocket)
        await websocket.close()


@auction_router.websocket("/ws/{session_id}/leader/{access_code}")
async def auction_websocket_leader(
    websocket: WebSocket, session_id: str, access_code: str
):
    """경매 WebSocket 연결 - 팀장"""
    print(
        f"[Leader] WebSocket request for session {session_id}, code {access_code}"
    )
    await websocket.accept()
    print(f"[Leader] WebSocket accepted")

    # 세션 가져오기
    session = auction_manager.get_session(session_id)
    if not session:
        print(f"[Leader] Session not found: {session_id}")
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": "Session not found"}}
        )
        await websocket.close()
        return

    # access_code 유효성 검사
    is_valid = False
    for team_id, code in session.leader_access_codes.items():
        if code == access_code:
            is_valid = True
            break

    if not is_valid:
        print(f"[Leader] Invalid access code: {access_code}")
        await websocket.send_json(
            {
                "type": MessageType.ERROR,
                "data": {"error": "Invalid access code"},
            }
        )
        await websocket.close()
        return

    # access_code로 연결 시도
    result = session.connect_with_access_code(access_code)

    if not result["success"]:
        print(f"[Leader] Connection failed: {result.get('error')}")
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": result["error"]}}
        )
        await websocket.close()
        return

    # 연결 추가
    session.add_connection(websocket)
    team_id = result["team_id"]
    print(f"[Leader] Connection added for team {team_id}")

    try:
        # 리더 연결 성공 알림
        print(f"[Leader] Sending leader_connected message")
        await websocket.send_json(
            {
                "type": "leader_connected",
                "data": {"team_id": team_id, "access_code": access_code},
            }
        )

        # 현재 상태 전송
        state = session.get_state().model_dump()
        print(f"[Leader] Sending initial state")
        await websocket.send_json(
            {
                "type": MessageType.GET_STATE,
                "data": state,
            }
        )
        print(f"[Leader] Initial state sent successfully")

        # 메시지 수신 대기
        print(f"[Leader] Entering message loop")
        while True:
            data = await websocket.receive_text()
            print(f"[Leader] Received message: {data}")
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "start_auction":
                # 경매 시작 (모든 리더가 가능)
                if session.status.value == "waiting":
                    await session.start_auction()
                else:
                    await websocket.send_json(
                        {
                            "type": MessageType.ERROR,
                            "data": {"error": "Auction already started"},
                        }
                    )

            elif message_type == "place_bid":
                # 입찰
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

                result = await session.place_bid(access_code, amount)

                if result["success"]:
                    await websocket.send_json(
                        {
                            "type": MessageType.BID_ACCEPTED,
                            "data": {"amount": result["bid"]},
                        }
                    )
                else:
                    await websocket.send_json(
                        {
                            "type": MessageType.BID_FAILED,
                            "data": {"error": result.get("error")},
                        }
                    )

            elif message_type == "get_state":
                # 현재 상태 요청
                await websocket.send_json(
                    {
                        "type": MessageType.GET_STATE,
                        "data": session.get_state().model_dump(),
                    }
                )

    except WebSocketDisconnect:
        session.disconnect_access_code(access_code)
        session.remove_connection(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        session.disconnect_access_code(access_code)
        session.remove_connection(websocket)
        await websocket.close()


@auction_router.get("/", response_model=GetAuctionListResponseDTO)
async def get_auctions() -> GetAuctionListResponseDTO:
    """경매 세션 리스트 조회"""
    return get_auctionㄴ_service()


@auction_router.get("/{session_id}", response_model=GetAuctionDetailResponseDTO)
async def get_auction_detail(session_id: str) -> GetAuctionDetailResponseDTO:
    """경매 상태 조회"""
    return get_auction_detail_service(session_id)


@auction_router.delete("/{session_id}", response_model=DeleteSessionResponseDTO)
async def delete_auction(session_id: str) -> DeleteSessionResponseDTO:
    """경매 세션 삭제"""
    return delete_auction_service(session_id)
