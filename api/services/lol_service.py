import httpx

from dtos.lol_dto import RiotLolInfoDto, RiotLolChampionStatsDto
from utils.env import get_riot_api_key

# Riot API 엔드포인트
RIOT_API_BASE = "https://asia.api.riotgames.com"
RIOT_KR_API_BASE = "https://kr.api.riotgames.com"
DATA_DRAGON_BASE = "https://ddragon.leagueoflegends.com"

# 챔피언 ID to Name 매핑 (최신 버전에서 가져와야 함)
CHAMPION_ID_TO_NAME = {}


async def get_latest_version() -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{DATA_DRAGON_BASE}/api/versions.json")
        versions = response.json()
        return versions[0]


async def load_champion_data():
    global CHAMPION_ID_TO_NAME
    if CHAMPION_ID_TO_NAME:
        return

    version = await get_latest_version()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DATA_DRAGON_BASE}/cdn/{version}/data/ko_KR/champion.json"
        )
        data = response.json()

        # 챔피언 ID를 key로 name을 value로 매핑
        for champion_name, champion_info in data["data"].items():
            champion_id = int(champion_info["key"])
            CHAMPION_ID_TO_NAME[champion_id] = {
                "name": champion_info["name"],
                "id": champion_info["id"],  # 영문 ID (아이콘용)
            }


async def get_summoner_by_riot_id(game_name: str, tag_line: str) -> dict:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        # PUUID 가져오기
        url = f"{RIOT_API_BASE}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        account_data = response.json()
        puuid = account_data["puuid"]

        # 소환사 정보 가져오기
        summoner_url = f"{RIOT_KR_API_BASE}/lol/summoner/v4/summoners/by-puuid/{puuid}"
        summoner_response = await client.get(summoner_url, headers=headers)
        summoner_response.raise_for_status()
        summoner_data = summoner_response.json()

        return {
            "puuid": puuid,
            "summoner_id": summoner_data["id"],
            "account_id": summoner_data["accountId"],
            "summoner_level": summoner_data["summonerLevel"],
            "profile_icon_id": summoner_data["profileIconId"],
        }


async def get_champion_mastery(puuid: str, top_count: int = 2) -> list:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"{RIOT_KR_API_BASE}/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top"
        params = {"count": top_count}
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


async def get_match_history(puuid: str, count: int = 20) -> list:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        # 매치 ID 리스트 가져오기
        url = f"{RIOT_API_BASE}/lol/match/v5/matches/by-puuid/{puuid}/ids"
        params = {"start": 0, "count": count}
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        match_ids = response.json()

        return match_ids


async def get_match_detail(match_id: str) -> dict:
    api_key = get_riot_api_key()
    headers = {"X-Riot-Token": api_key}

    async with httpx.AsyncClient() as client:
        url = f"{RIOT_API_BASE}/lol/match/v5/matches/{match_id}"
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def calculate_champion_stats(
    puuid: str, top_champions: list
) -> list[RiotLolChampionStatsDto]:
    await load_champion_data()

    # 최근 매치에서 챔피언별 승률 계산
    match_ids = await get_match_history(puuid, count=20)
    champion_stats = {}

    # 주 챔피언 ID 추출
    top_champion_ids = [champ["championId"] for champ in top_champions[:2]]

    for match_id in match_ids:
        try:
            match_data = await get_match_detail(match_id)

            # 해당 플레이어의 데이터 찾기
            for participant in match_data["info"]["participants"]:
                if participant["puuid"] == puuid:
                    champion_id = participant["championId"]

                    # 주 챔피언만 통계 수집
                    if champion_id in top_champion_ids:
                        if champion_id not in champion_stats:
                            champion_stats[champion_id] = {
                                "wins": 0,
                                "losses": 0,
                                "games": 0,
                            }

                        champion_stats[champion_id]["games"] += 1
                        if participant["win"]:
                            champion_stats[champion_id]["wins"] += 1
                        else:
                            champion_stats[champion_id]["losses"] += 1
                    break
        except Exception as e:
            print(f"Error processing match {match_id}: {e}")
            continue

    # RiotLolChampionStatsDto 생성
    version = await get_latest_version()
    result = []

    for champion in top_champions[:2]:
        champion_id = champion["championId"]
        champion_info = CHAMPION_ID_TO_NAME.get(
            champion_id, {"name": "Unknown", "id": "Unknown"}
        )

        stats = champion_stats.get(champion_id, {"wins": 0, "losses": 0, "games": 0})
        games = stats["games"]
        wins = stats["wins"]
        losses = stats["losses"]
        win_rate = (wins / games * 100) if games > 0 else 0.0

        result.append(
            RiotLolChampionStatsDto(
                champion_id=champion_id,
                champion_name=champion_info["name"],
                champion_icon_url=f"{DATA_DRAGON_BASE}/cdn/{version}/img/champion/{champion_info['id']}.png",
                games_played=games,
                wins=wins,
                losses=losses,
                win_rate=round(win_rate, 2),
            )
        )

    return result


async def get_lol_info_by_user_id(user_id: int) -> RiotLolInfoDto:
    from utils.database import get_db
    from entities.user import User

    # 데이터베이스에서 유저 정보 가져오기
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

    # 소환사 정보 가져오기
    summoner_data = await get_summoner_by_riot_id(game_name, tag_line)

    # 주 챔피언 정보 가져오기
    top_champions_raw = await get_champion_mastery(summoner_data["puuid"], top_count=2)

    # 주 챔피언 승률 계산
    top_champions = await calculate_champion_stats(
        summoner_data["puuid"], top_champions_raw
    )

    # 최신 버전으로 프로필 아이콘 URL 생성
    version = await get_latest_version()
    profile_icon_url = f"{DATA_DRAGON_BASE}/cdn/{version}/img/profileicon/{summoner_data['profile_icon_id']}.png"

    return RiotLolInfoDto(
        game_name=game_name,
        tag_line=tag_line,
        summoner_level=summoner_data["summoner_level"],
        profile_icon_id=summoner_data["profile_icon_id"],
        profile_icon_url=profile_icon_url,
        top_champions=top_champions,
    )
