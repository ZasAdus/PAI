from __future__ import annotations

import sys
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from .schemas import HealthResponse
from . import services, auth, database

app = FastAPI(title="GuessThePlayer API")

@app.on_event("startup")
def startup_event():
    # Run seed script on startup to ensure mock data is always available
    import os
    from .database import get_engine, text
    seed_path = os.path.join(os.path.dirname(__file__), "..", "seeds", "seed_data.sql")
    if os.path.exists(seed_path):
        print("Running seed data script...", file=sys.stderr)
        with open(seed_path, "r", encoding="utf-8") as f:
            sql = f.read()
            # Split by semicolon to execute one by one (simplified)
            # Actually, SQLAlchemy begin() can handle multiple statements if supported by driver
            try:
                with get_engine().begin() as conn:
                    conn.execute(text(sql))
                print("Seed data loaded successfully.", file=sys.stderr)
            except Exception as e:
                print(f"Error loading seed data: {e}", file=sys.stderr)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Health ----------

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(ok=True)


# ---------- Auth ----------

class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/api/auth/register")
def register(user: UserCreate):
    try:
        existing_user = database.fetch_one("SELECT * FROM users WHERE username = :username", {"username": user.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = auth.get_password_hash(user.password)
        with database.get_engine().begin() as conn:
            conn.execute(
                database.text("INSERT INTO users (username, hashed_password) VALUES (:username, :password)"),
                {"username": user.username, "password": hashed_password}
            )
        return {"message": "User created successfully"}
    except Exception as e:
        print(f"Registration error: {e}", file=sys.stderr)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = database.fetch_one("SELECT * FROM users WHERE username = :username", {"username": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    return {"username": current_user["username"]}


# ---------- Players ----------

@app.get("/api/players/search")
def search_players(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=50),
    search_by: services.SearchBy = "name",
):
    items = services.search_players(q, limit=limit, search_by=search_by)
    return {"items": [p.dict() for p in items]}


# ---------- Game ----------

class GuessRequest(BaseModel):
    session_id: str
    player_id: int


@app.post("/api/game/daily/start")
def start_game(session_id: str = Query(...), token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = None
    if token:
        try:
            current_user = auth.get_current_user(token)
            user_id = current_user["id"]
        except HTTPException:
            pass

    state = services.start_daily_game(session_id, user_id=user_id)
    return state.dict()


@app.post("/api/game/daily/guess")
def guess(body: GuessRequest, token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = None
    if token:
        try:
            current_user = auth.get_current_user(token)
            user_id = current_user["id"]
        except HTTPException:
            pass

    try:
        state, attempt = services.apply_guess(body.session_id, body.player_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    message = services.describe_guess_result(state, attempt)
    return {"state": state.dict(), "message": message}

@app.get("/api/leaderboard")
def get_leaderboard():
    return services.get_leaderboard()

@app.get("/api/stats/daily")
def get_daily_stats():
    return services.get_daily_stats()