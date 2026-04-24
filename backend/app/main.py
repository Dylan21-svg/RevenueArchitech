from fastapi import FastAPI
from app.routes import audits, auth

app = FastAPI(title="RevenueArchitect AI API")

app.include_router(auth.router)
app.include_router(audits.router)

@app.get("/health")
def health():
    return {"ok": True}

# To run the app, use:
# uvicorn app.main:app --reload
