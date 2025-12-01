# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import game_routes, ws_routes

app = FastAPI(title="CheckTheNum Game Backend")

# ---------------------- CORS CONFIG ----------------------
# Allow frontend hosted on Netlify to call APIs and WS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://checkthenum.netlify.app"],  # <-- no trailing slash
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------- API ROUTES ----------------------
app.include_router(game_routes.router)
app.include_router(ws_routes.router)

# ---------------------- HEALTH CHECK ----------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running!"}
