from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from dtos.lol_dto import LolDto, ChampionDto
from utils.crawler import (
    scrape_with_selenium,
    extract_tier_rank,
    extract_points,
    extract_win_rate,
    extract_character_stats,
)


async def scrape_opgg_profile(game_name: str, tag_line: str) -> dict:
    """OP.GG 프로필 페이지를 Selenium으로 크롤링하여 솔랭 정보 및 챔피언 통계 추출"""
    encoded_name = game_name.replace(" ", "%20")
    url = f"https://www.op.gg/lol/summoners/kr/{encoded_name}-{tag_line}"

    def scraper_logic(driver, wait):
        tier = "Unranked"
        rank = ""
        lp = 0
        overall_win_rate = 0.0
        top_champions = []

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
            print(f"[LOL] 페이지 길이: {len(page_text)}")
            print(f"[LOL] 'LP' 포함: {'LP' in page_text}")
            print(f"[LOL] 'Diamond' 포함: {'Diamond' in page_text}")

            # 티어와 랭크 추출 - 더 유연한 패턴
            tier_pattern = r"(Unranked|Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)(?:\s+(I|II|III|IV))?"
            tier, rank = extract_tier_rank(page_text, tier_pattern)

            # LP 추출
            lp = extract_points(page_text, r"(\d+)\s*LP")

            # 승률 추출
            overall_win_rate = extract_win_rate(page_text)

            # 챔피언 통계 추출 - 더 다양한 선택자 시도
            selectors = [
                "div[class*='champion']",
                "tr[class*='champion']",
                "li[class*='champion']",
                "[class*='Champion']",
                "div[class*='ChampionBox']",
            ]

            for selector in selectors:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(
                        f"[LOL] '{selector}' 선택자로 {len(elements)}개 요소 발견"
                    )
                    top_champions = extract_character_stats(
                        driver,
                        selector,
                        r'src="([^"]*champion[^"]*)"',
                        max_count=3,
                    )
                    if top_champions:
                        break
        except Exception as e:
            print(f"[LOL] 에러 발생: {str(e)}")
            pass

        result = {
            "tier": tier,
            "rank": rank,
            "lp": lp,
            "win_rate": overall_win_rate,
            "top_champions": top_champions,
        }
        print(f"[LOL] 크롤링 결과: {result}")
        return result

    return await scrape_with_selenium(url, scraper_logic)


async def get_lol_info_by_user_id(user_id: int) -> LolDto:
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
    opgg_data = await scrape_opgg_profile(game_name, tag_line)

    # 챔피언 데이터 변환
    top_champions = []
    for champ in opgg_data["top_champions"]:
        top_champions.append(
            ChampionDto(
                name=champ["name"],
                icon_url=champ["icon_url"],
                games=champ["games"],
                win_rate=champ["win_rate"],
            )
        )

    result = LolDto(
        tier=opgg_data["tier"],
        rank=opgg_data["rank"],
        lp=opgg_data["lp"],
        win_rate=opgg_data["win_rate"],
        top_champions=top_champions,
    )

    return result
