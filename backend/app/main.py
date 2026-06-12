from __future__ import annotations

import sys
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from .schemas import ClubGuessRequest, GuessRequest, HealthResponse
from . import services, auth, database

app = FastAPI(title="GuessThePlayer API")

@app.on_event("startup")
def startup_event():
    import os
    seed_path = os.path.join(os.path.dirname(__file__), "..", "seeds", "mock_results.sql")
    if not os.path.exists(seed_path):
        return

    try:
        with open(seed_path, "r", encoding="utf-8") as f:
            sql = f.read()
        raw = database.get_engine().raw_connection()
        try:
            with raw.cursor() as cursor:
                cursor.execute(sql)
            raw.commit()
        finally:
            raw.close()
    except Exception as e:
        print(f"Error loading mock results: {e}", file=sys.stderr)

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

def _resolve_user_id(token: str | None) -> int | None:
    user_id = None
    if token:
        try:
            current_user = auth.get_current_user(token)
            user_id = current_user["id"]
        except HTTPException:
            pass
    return user_id


@app.get("/api/players/search")
def search_players(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=50),
):
    items = services.search_players(q, limit=limit)
    return {"items": [p.dict() for p in items]}


@app.get("/api/clubs/search")
def search_clubs(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
):
    items = services.search_clubs(q, limit=limit)
    return {"items": [club.dict() for club in items]}


# ---------- Game ----------

@app.post("/api/game/daily/start")
def start_game(session_id: str = Query(...), token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = _resolve_user_id(token)
    state = services.start_daily_game(session_id, user_id=user_id)
    return state.dict()


@app.post("/api/game/daily/guess")
def guess(body: GuessRequest, token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = _resolve_user_id(token)
    try:
        state, attempt = services.apply_guess(body.session_id, body.player_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    message = services.describe_guess_result(state, attempt)
    return {"state": state.dict(), "message": message}


@app.post("/api/game/club-daily/start")
def start_club_game(session_id: str = Query(...), token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = _resolve_user_id(token)
    state = services.start_daily_club_game(session_id, user_id=user_id)
    return state.dict()


@app.post("/api/game/club-daily/guess")
def guess_club(body: ClubGuessRequest, token: str = Depends(auth.oauth2_scheme_optional)):
    user_id = _resolve_user_id(token)
    try:
        state, attempt = services.apply_club_guess(body.session_id, body.club_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    message = services.describe_club_guess_result(state, attempt)
    return {"state": state.dict(), "message": message}


@app.get("/api/leaderboard")
def get_leaderboard(game_type: str = Query("all")):
    normalized = game_type.strip().lower()
    if normalized not in {"all", "player", "club"}:
        raise HTTPException(status_code=400, detail="Invalid game type")
    return services.get_leaderboard(normalized)


@app.get("/api/stats/daily")
def get_daily_stats(game_type: str = Query("player")):
    normalized = game_type.strip().lower()
    if normalized not in {"player", "club"}:
        raise HTTPException(status_code=400, detail="Invalid game type")
    return services.get_daily_stats(normalized)
