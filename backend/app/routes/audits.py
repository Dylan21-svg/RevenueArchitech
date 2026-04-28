from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import uuid
import asyncio
from typing import List
from app.models.audit import AuditCreate, AuditResponse
from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.services.audit_service import run_background_audit

router = APIRouter(prefix="/audit", tags=["Audit"])

def trigger_audit_async(audit_id: str, url: str, niche: str, daily_ad_spend: float):
    # Runs the async playwright code inside the background task loop
    asyncio.run(run_background_audit(audit_id, url, niche, daily_ad_spend))

@router.get("/", response_model=List[AuditResponse])
def list_audits(user: dict = Depends(get_current_user)):
    """
    Lists all audits the user has access to.
    For now, we fetch all audits and filter by the user's organization if possible.
    Simplified: fetch all audits for now.
    """
    try:
        response = supabase.table("audits").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{audit_id}", response_model=AuditResponse)
def get_audit(audit_id: str, user: dict = Depends(get_current_user)):
    """
    Fetches a specific audit by ID.
    """
    try:
        response = supabase.table("audits").select("*").eq("id", audit_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Audit not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=AuditResponse)
def create_audit(
    audit: AuditCreate, 
    background_tasks: BackgroundTasks, 
    user: dict = Depends(get_current_user)
):
    """
    Creates a new audit record and starts the playwright scraping in the background.
    """
    # 1. Normalize URL to get domain
    domain = audit.url.replace("https://", "").replace("http://", "").split("/")[0]
    
    # 2. Get or create store
    try:
        store_res = supabase.table("stores").select("id").eq("shop_domain", domain).execute()
        if store_res.data:
            store_id = store_res.data[0]["id"]
        else:
            # Create a ghost store
            # We need an organization_id. Let's try to find one the user owns.
            org_res = supabase.table("organizations").select("id").eq("owner_id", user["id"]).execute()
            if not org_res.data:
                # Create a default org if none exists (fallback)
                import re
                email_prefix = user['email'].split('@')[0] if user.get('email') else 'user'
                slug_base = re.sub(r'[^a-z0-9]', '-', email_prefix.lower())
                slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"
                
                new_org = {
                    "name": f"{user.get('email', 'User')}'s Org", 
                    "slug": slug,
                    "owner_id": user["id"]
                }
                org_res = supabase.table("organizations").insert(new_org).execute()
            
            org_id = org_res.data[0]["id"]
            new_store = {
                "shop_domain": domain,
                "store_name": domain.split(".")[0].capitalize(),
                "organization_id": org_id,
                "daily_ad_spend": audit.daily_ad_spend
            }
            store_res = supabase.table("stores").insert(new_store).execute()
            store_id = store_res.data[0]["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Store error: {str(e)}")

    audit_id = str(uuid.uuid4())
    
    audit_data = {
        "id": audit_id,
        "url": audit.url,
        "store_id": store_id,
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
