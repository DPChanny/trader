from fastapi import HTTPException
import traceback
import logging

logger = logging.getLogger(__name__)


class CustomException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


def handle_exception(e: Exception, db):
    db.rollback()

    # 에러 로깅
    error_trace = traceback.format_exc()
    logger.error(f"Exception occurred: {e}")
    logger.error(error_trace)

    # 콘솔 출력
    print("=" * 80)
    print(f"EXCEPTION IN SERVICE: {e}")
    print("-" * 80)
    print(error_trace)
    print("=" * 80)

    if isinstance(e, CustomException):
        raise e
    raise HTTPException(status_code=500, detail=str(e))
