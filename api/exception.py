from fastapi import HTTPException
import traceback
import logging

logger = logging.getLogger(__name__)


class CustomException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


def handle_exception(e: Exception, db):
    db.rollback()

    error_trace = traceback.format_exc()

    logger.error("=" * 80)
    logger.error(f"EXCEPTION IN SERVICE: {e}")
    logger.error("-" * 80)
    logger.error(error_trace)
    logger.error("=" * 80)

    if isinstance(e, CustomException):
        raise e
    raise HTTPException(status_code=500, detail=str(e))
