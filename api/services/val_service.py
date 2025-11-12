import httpx

from dtos.val_dto import RiotValInfoDto, RiotValAgentStatsDto
from utils.env import get_riot_api_key

# Riot API 엔드포인트
RIOT_API_BASE = "https://asia.api.riotgames.com"

# 에이전트 데이터 캐시
AGENT_DATA = {}


async def load_agent_data():
    global AGENT_DATA
    if AGENT_DATA:
        return

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://valorant-api.com/v1/agents?language=ko-KR&isPlayableCharacter=true"
        )
        data = response.json()

        for agent in data["data"]:
            AGENT_DATA[agent["uuid"]] = {
                "name": agent["displayName"],
                "icon": agent["displayIcon"],
            }


async def get_valorant_account_by_riot_id(game_name: str, tag_line: str) -> dict:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        # PUUID 가져오기
        url = f"{RIOT_API_BASE}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        account_data = response.json()

        return {
            "puuid": account_data["puuid"],
            "game_name": game_name,
            "tag_line": tag_line,
        }


async def get_valorant_match_history(puuid: str, region: str = "ap") -> list:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"https://{region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/{puuid}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        match_data = response.json()

        return match_data.get("history", [])[:20]  # 최근 20게임


async def get_valorant_match_detail(match_id: str, region: str = "ap") -> dict:

    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"https://{region}.api.riotgames.com/val/match/v1/matches/{match_id}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def calculate_agent_stats(
    puuid: str, region: str = "ap"
) -> list[RiotValAgentStatsDto]:

    await load_agent_data()

    match_history = await get_valorant_match_history(puuid, region)
    agent_stats = {}

    # 매치에서 에이전트별 승률 계산
    for match_info in match_history:
        try:
            match_id = match_info["matchId"]
            match_detail = await get_valorant_match_detail(match_id, region)

            # 해당 플레이어 찾기
            for player in match_detail["players"]:
                if player["puuid"] == puuid:
                    agent_id = player["characterId"]

                    if agent_id not in agent_stats:
                        agent_stats[agent_id] = {
                            "wins": 0,
                            "losses": 0,
                            "games": 0,
                        }

                    agent_stats[agent_id]["games"] += 1

                    # 승리 여부 확인
                    player_team = player["teamId"]
                    for team in match_detail["teams"]:
                        if team["teamId"] == player_team:
                            if team["won"]:
                                agent_stats[agent_id]["wins"] += 1
                            else:
                                agent_stats[agent_id]["losses"] += 1
                            break
                    break
        except Exception as e:
            print(f"Error processing Valorant match {match_info.get('matchId')}: {e}")
            continue

    # 게임 수 기준으로 상위 2개 에이전트 선택
    sorted_agents = sorted(
        agent_stats.items(), key=lambda x: x[1]["games"], reverse=True
    )[:2]

    result = []
    for agent_id, stats in sorted_agents:
        agent_info = AGENT_DATA.get(agent_id, {"name": "Unknown", "icon": ""})
        games = stats["games"]
        wins = stats["wins"]
        losses = stats["losses"]
        win_rate = (wins / games * 100) if games > 0 else 0.0

        result.append(
            RiotValAgentStatsDto(
                agent_id=agent_id,
                agent_name=agent_info["name"],
                agent_icon_url=agent_info["icon"],
                games_played=games,
                wins=wins,
                losses=losses,
                win_rate=round(win_rate, 2),
            )
        )

    return result


async def get_val_info_by_user_id(
    user_id: int,
) -> RiotValInfoDto:
    from utils.database import get_db
    from entities.user import User

    db = next(get_db())
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")

    if not user.riot_id:
        raise ValueError(f"User {user.name} does not have a Riot ID")

    # Riot ID 파싱 (gameName#tagLine)
    if "#" not in user.riot_id:
        raise ValueError(f"Invalid Riot ID format: {user.riot_id}")

    game_name, tag_line = user.riot_id.split("#", 1)

    # 발로란트 계정 정보 가져오기
    account_data = await get_valorant_account_by_riot_id(game_name, tag_line)

    # 주 에이전트 통계 계산
    top_agents = await calculate_agent_stats(account_data["puuid"])

    # 플레이어 카드 정보는 Henrik API 등을 사용하거나 기본값 설정
    # 공식 API에는 플레이어 카드 정보가 없어서 기본값 사용
    card_id = "default"
    card_url = "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png"

    return RiotValInfoDto(
        game_name=game_name,
        tag_line=tag_line,
        account_level=0,  # 공식 API에서는 레벨 정보를 제공하지 않음
        card_id=card_id,
        card_url=card_url,
        top_agents=top_agents,
    )
