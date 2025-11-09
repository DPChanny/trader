from fastapi import HTTPException


class CustomException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


def handle_exception(e: Exception, db):
    db.rollback()
    if isinstance(e, CustomException):
        raise e
    raise HTTPException(status_code=500, detail=str(e))
