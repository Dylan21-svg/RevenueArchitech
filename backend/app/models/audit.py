from pydantic import BaseModel
from typing import Optional

class AuditCreate(BaseModel):
    url: str
    niche: Optional[str] = "General"
    daily_ad_spend: Optional[float] = 0.0

class AuditResponse(BaseModel):
    id: str
    url: str
    user_id: str
    status: str
