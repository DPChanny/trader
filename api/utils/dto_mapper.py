"""DTO 변환 유틸리티"""


def to_camel_case(snake_str: str) -> str:
    """snake_case 문자열을 camelCase로 변환"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def dict_to_camel_case(data: dict | list | any) -> dict | list | any:
    """딕셔너리의 모든 키를 snake_case에서 camelCase로 변환"""
    if isinstance(data, dict):
        return {
            to_camel_case(k): dict_to_camel_case(v) for k, v in data.items()
        }
    elif isinstance(data, list):
        return [dict_to_camel_case(item) for item in data]
    else:
        return data
