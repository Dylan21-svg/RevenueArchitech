from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the current authenticated user's context.
    Confirms that the auth dependency works.
    """
    return user
