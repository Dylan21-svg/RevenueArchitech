from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        # Avoid crashing immediately on import if env vars are missing,
        # but raise error when actually instantiating.
        pass
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Use Service Role Key for backend admin bypass (inserting rows securely)
supabase: Client = get_supabase_client()
