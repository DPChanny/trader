from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from dtos.val_dto import ValDto, AgentDto
from utils.crawler import (
    scrape_with_selenium,
    extract_tier_rank,
    extract_points,
    extract_win_rate,
    extract_character_stats,
)


async def scrape_opgg_valorant_profile(game_name: str, tag_line: str) -> dict:
    """OP.GG Valorant 프로필 페이지를 Selenium으로 크롤링하여 랭크 정보 및 에이전트 통계 추출"""
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://www.op.gg/valorant/profile/kr/{encoded_name}-{tag_line}"

    def scraper_logic(driver, wait):
        tier = "Unranked"
        rank = ""
        rr = 0
        overall_win_rate = 0.0
        top_agents = []

        try:
            # 페이지가 로드될 때까지 더 긴 시간 대기
            import time

            time.sleep(2)

            # 다양한 선택자로 랭크 정보 시도
            try:
                wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "body"))
                )
            except:
                pass

            page_text = driver.page_source

            # 디버깅: 페이지 내용 확인
            print(f"[VAL] 페이지 길이: {len(page_text)}")
            print(f"[VAL] 'RR' 포함: {'RR' in page_text}")
            print(f"[VAL] 'Radiant' 포함: {'Radiant' in page_text}")

            # 티어와 랭크 추출 - 더 유연한 패턴
            tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant)(?:\s+(1|2|3))?"
            tier, rank = extract_tier_rank(page_text, tier_pattern)

            # RR 추출
            rr = extract_points(page_text, r"(\d+)\s*RR")

            # 승률 추출
            overall_win_rate = extract_win_rate(page_text)

            # 에이전트 통계 추출 - 더 다양한 선택자 시도
            selectors = [
                "div[class*='agent']",
                "tr[class*='agent']",
                "li[class*='agent']",
                "[class*='Agent']",
                "div[class*='AgentBox']",
            ]

            for selector in selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(
                        f"[VAL] '{selector}' 선택자로 {len(elements)}개 요소 발견"
                    )
                    top_agents = extract_character_stats(
                        driver,
                        selector,
                        r'src="([^"]*agent[^"]*)"',
                        max_count=3,
                    )
                    if top_agents:
                        break
        except Exception as e:
            print(f"[VAL] 에러 발생: {str(e)}")
            pass

        result = {
            "tier": tier,
            "rank": rank,
            "rr": rr,
            "win_rate": overall_win_rate,
            "top_agents": top_agents,
        }
        print(f"[VAL] 크롤링 결과: {result}")
        return result

    return await scrape_with_selenium(url, scraper_logic)


async def get_val_info_by_user_id(user_id: int) -> ValDto:
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

    # OP.GG 크롤링으로 데이터 수집
    opgg_data = await scrape_opgg_valorant_profile(game_name, tag_line)

    # 에이전트 데이터 변환
    top_agents = []
    for agent in opgg_data["top_agents"]:
        top_agents.append(
            AgentDto(
                name=agent["name"],
                icon_url=agent["icon_url"],
                games=agent["games"],
                win_rate=agent["win_rate"],
            )
        )

    result = ValDto(
        tier=opgg_data["tier"],
        rank=opgg_data["rank"],
        rr=opgg_data["rr"],
        win_rate=opgg_data["win_rate"],
        top_agents=top_agents,
    )

    return result
