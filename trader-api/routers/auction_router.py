from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session
from typing import Dict
import json

from database import get_db
from services.auction_service import auction_manager
from dtos.auction_dto import (
    StartAuctionRequest,
    PlaceBidRequest,
    Team,
    MessageType,
)
from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from sqlalchemy.orm import joinedload

auction_router = APIRouter()


@auction_router.post("/start")
async def start_auction_session(
    request: StartAuctionRequest, db: Session = Depends(get_db)
):
    """경매 세션 시작 (HTTP)"""
    # Preset 정보 가져오기
    preset = (
        db.query(Preset)
        .options(
            joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
            joinedload(Preset.preset_users).joinedload(PresetUser.user),
            joinedload(Preset.preset_users).joinedload(PresetUser.tier),
        )
        .filter(Preset.preset_id == request.preset_id)
        .first()
    )

    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if not preset.preset_leaders:
        raise HTTPException(
            status_code=400, detail="No leaders found in preset"
        )

    if not preset.preset_users:
        raise HTTPException(status_code=400, detail="No users found in preset")

    # 팀 생성 (리더 기반, 리더는 이미 팀에 포함)
    teams = []
    for leader in preset.preset_leaders:
        teams.append(
            Team(
                team_id=leader.preset_leader_id,
                leader_id=leader.user_id,
                member_id_list=[leader.user_id],  # 리더는 이미 팀에 포함
                points=1000,  # 기본 포인트
            )
        )

    # 경매할 유저 ID 목록 (리더 제외)
    leader_user_ids = {leader.user_id for leader in preset.preset_leaders}
    user_ids = [
        pu.user_id
        for pu in preset.preset_users
        if pu.user_id not in leader_user_ids
    ]

    # 세션 생성
    session_id = auction_manager.create_session(
        preset_id=request.preset_id, teams=teams, user_ids=user_ids
    )

    return {
        "success": True,
        "session_id": session_id,
    }


@auction_router.websocket("/ws/{session_id}")
async def auction_websocket(websocket: WebSocket, session_id: str):
    """경매 WebSocket 연결"""
    await websocket.accept()

    # 세션 가져오기
    session = auction_manager.get_session(session_id)
    if not session:
        await websocket.send_json(
            {"type": MessageType.ERROR, "data": {"error": "Session not found"}}
        )
        await websocket.close()
        return

    # 연결 추가
    session.add_connection(websocket)

    try:
        # 현재 상태 전송 (연결 시 한 번만)
        await websocket.send_json(
            {
                "type": MessageType.GET_STATE,
                "data": session.get_state().model_dump(),
            }
        )

        # 메시지 수신 대기
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "start_auction":
                # 경매 시작
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
                team_id = bid_data.get("team_id")
                amount = bid_data.get("amount")

                if team_id is None or amount is None:
                    await websocket.send_json(
                        {
                            "type": MessageType.ERROR,
                            "data": {"error": "Invalid bid data"},
                        }
                    )
                    continue

                result = await session.place_bid(team_id, amount)

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
        session.remove_connection(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        session.remove_connection(websocket)
        await websocket.close()


@auction_router.get("/{session_id}/state")
async def get_auction_state(session_id: str):
    """경매 상태 조회 (HTTP)"""
    session = auction_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"success": True, "data": session.get_state().model_dump()}


@auction_router.delete("/{session_id}")
async def delete_auction_session(session_id: str):
    """경매 세션 삭제"""
    session = auction_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    auction_manager.remove_session(session_id)
    return {"success": True, "message": "Session deleted"}
