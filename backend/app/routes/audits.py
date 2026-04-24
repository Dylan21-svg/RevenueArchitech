from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import uuid
import asyncio
from app.models.audit import AuditCreate, AuditResponse
from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.services.audit_service import run_background_audit

router = APIRouter(prefix="/audit", tags=["Audit"])

def trigger_audit_async(audit_id: str, url: str, niche: str, daily_ad_spend: float):
    # Runs the async playwright code inside the background task loop
    asyncio.run(run_background_audit(audit_id, url, niche, daily_ad_spend))

@router.post("/", response_model=AuditResponse)
def create_audit(
    audit: AuditCreate, 
    background_tasks: BackgroundTasks, 
    user: dict = Depends(get_current_user)
):
    """
    Creates a new audit record and starts the playwright scraping in the background.
    """
    audit_id = str(uuid.uuid4())
    
    audit_data = {
        "id": audit_id,
        "url": audit.url,
        "user_id": user["id"],
        "status": "queued"
    }

    try:
        response = supabase.table("audits").insert(audit_data).execute()
        
        # Add the scraping task to run in the background
        background_tasks.add_task(
            trigger_audit_async, 
            audit_id=audit_id, 
            url=audit.url, 
            niche=audit.niche, 
            daily_ad_spend=audit.daily_ad_spend
        )
        
        if response.data:
            return response.data[0]
        else:
            return audit_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
