import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET = os.getenv("KclkqXqkH0g0U67kmGz0hkiRSCfTH6JZUnGw2cN9QwogXdChnutTD0utgLYF+y/TbmUFkws527J2IhtjWLOLag==", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "")

settings = Settings()
