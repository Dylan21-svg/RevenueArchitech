from app.core.supabase import supabase
from app.models.audit import AuditResponse

try:
    res = supabase.table("audits").select("*").order("created_at", desc=True).limit(1).execute()
    if res.data:
        audit = res.data[0]
        print("Raw DB Audit:", audit)
        # Try validation
        parsed = AuditResponse(**audit)
        print("Validated successfully!")
    else:
        print("No audits found.")
except Exception as e:
    import traceback
    traceback.print_exc()
