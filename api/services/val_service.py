import httpx

from dtos.val_dto import RiotValInfoDto, RiotValAgentStatsDto
from utils.env import get_riot_api_key

RIOT_API_BASE = "https://asia.api.riotgames.com"

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


async def get_account_by_riot_id(game_name: str, tag_line: str) -> dict:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"{RIOT_API_BASE}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        account_data = response.json()

        return {
            "puuid": account_data["puuid"],
            "game_name": game_name,
            "tag_line": tag_line,
        }


async def get_match_history(puuid: str, region: str = "ap") -> list:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"https://{region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/{puuid}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        match_data = response.json()

        return match_data.get("history", [])[:20]


async def get_match_detail(match_id: str, region: str = "ap") -> dict:

    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"https://{region}.api.riotgames.com/val/match/v1/matches/{match_id}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def get_agent_mastery(puuid: str, region: str = "ap") -> list:
    await load_agent_data()

    match_history = await get_match_history(puuid, region)
    agent_play_count = {}

    for match_info in match_history:
        try:
            match_id = match_info["matchId"]
            match_detail = await get_match_detail(match_id, region)

            for player in match_detail["players"]:
                if player["puuid"] == puuid:
                    agent_id = player["characterId"]
                    agent_play_count[agent_id] = (
                        agent_play_count.get(agent_id, 0) + 1
                    )
                    break
        except Exception as e:
            print(
                f"Error processing match for mastery {match_info.get('matchId')}: {e}"
            )
            continue

    sorted_agents = sorted(
        agent_play_count.items(), key=lambda x: x[1], reverse=True
    )[:2]

    return [
        {"characterId": agent_id, "games": count}
        for agent_id, count in sorted_agents
    ]


async def calculate_agent_stats(
    puuid: str, top_agents: list, region: str = "ap"
) -> list[RiotValAgentStatsDto]:

    await load_agent_data()

    match_history = await get_match_history(puuid, region)
    agent_stats = {}

    top_agent_ids = [agent["characterId"] for agent in top_agents[:2]]

    for match_info in match_history:
        try:
            match_id = match_info["matchId"]
            match_detail = await get_match_detail(match_id, region)

            for player in match_detail["players"]:
                if player["puuid"] == puuid:
                    agent_id = player["characterId"]

                    if agent_id in top_agent_ids:
                        if agent_id not in agent_stats:
                            agent_stats[agent_id] = {
                                "wins": 0,
                                "losses": 0,
                                "games": 0,
                            }

                        agent_stats[agent_id]["games"] += 1

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
            print(
                f"Error processing Valorant match {match_info.get('matchId')}: {e}"
            )
            continue

    result = []
    for agent in top_agents[:2]:
        agent_id = agent["characterId"]
        stats = agent_stats.get(agent_id, {"wins": 0, "losses": 0, "games": 0})
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

    if "#" not in user.riot_id:
        raise ValueError(f"Invalid Riot ID format: {user.riot_id}")

    game_name, tag_line = user.riot_id.split("#", 1)

    account_data = await get_account_by_riot_id(game_name, tag_line)

    top_agents_raw = await get_agent_mastery(account_data["puuid"])

    top_agents = await calculate_agent_stats(
        account_data["puuid"], top_agents_raw
    )

    card_id = "default"
    card_url = "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png"

    return RiotValInfoDto(
        game_name=game_name,
        tag_line=tag_line,
        account_level=0,
        card_id=card_id,
        card_url=card_url,
        top_agents=top_agents,
    )
