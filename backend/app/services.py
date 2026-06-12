from __future__ import annotations

import hashlib
import re
from datetime import date, datetime, timedelta
from typing import Any, Literal

from .cache import cache_get_json, cache_set_json
from .database import fetch_all, fetch_one, fetch_scalar
from .schemas import AttemptResult, ComparisonItem, DailyGameState, PlayerSummary

CURRENT_COMPETITIONS = ("ES1", "GB1", "L1", "FR1", "IT1")
TARGET_CACHE_PREFIX = "gtp:daily-target"
STATE_CACHE_PREFIX = "gtp:daily-state"
SEARCH_CACHE_PREFIX = "gtp:search"
PLAYER_CACHE_PREFIX = "gtp:player"


def current_day() -> str:
    return date.today().isoformat()


def seconds_until_tomorrow() -> int:
    tomorrow = datetime.combine(date.today() + timedelta(days=1), datetime.min.time())
    return max(60, int((tomorrow - datetime.now()).total_seconds()))


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def format_player_name(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s*\(\d+\)$", "", value.strip()).strip()


SearchBy = Literal["name", "club", "league", "position"]


def _parse_birth_year(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(value[:4])
    except (TypeError, ValueError):
        return None


def _parse_height(value: Any) -> float | None:
    if value in (None, "", "0", 0, 0.0):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _calculate_age(date_of_birth: str | None) -> int | None:
    if not date_of_birth:
        return None
    try:
        birth_date = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
    except ValueError:
        return None
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _player_summary_from_dict(data: dict) -> PlayerSummary:
    payload = dict(data)
    payload["player_name"] = format_player_name(payload.get("player_name"))
    return PlayerSummary(**payload)


def _player_summary_from_row(row: dict) -> PlayerSummary:
    return PlayerSummary(
        player_id=row["player_id"],
        player_slug=row["player_slug"],
        player_name=format_player_name(row["player_name"]),
        player_image_url=row.get("player_image_url"),
        date_of_birth=row.get("date_of_birth"),
        birth_year=_parse_birth_year(row.get("date_of_birth")),
        country_of_birth=row.get("country_of_birth"),
        citizenship=row.get("citizenship"),
        height=_parse_height(row.get("height")),
        position=row.get("position"),
        main_position=row.get("main_position"),
        current_club_id=row.get("current_club_id"),
        current_club_name=row.get("current_club_name"),
        club_country_name=row.get("club_country_name"),
        competition_id=row.get("competition_id"),
        competition_name=row.get("competition_name"),
        competition_rank=row.get("competition_rank"),
        shirt_number=row.get("shirt_number"),
    )


def _player_query_clause() -> str:
    return """
        SELECT
            p.player_id,
            p.player_slug,
            p.player_name,
            p.player_image_url,
            p.date_of_birth,
            p.country_of_birth,
            p.citizenship,
            p.height,
            p.position,
            p.main_position,
            p.current_club_id,
            p.current_club_name,
            c.country_name AS club_country_name,
            comp.competition_id,
            COALESCE(comp.competition_name, c.competition_name) AS competition_name,
            comp.season_rank AS competition_rank
        FROM players p
        LEFT JOIN clubs c
            ON c.club_id = p.current_club_id
           AND c.season_id = '2025'
           AND c.competition_id IN ('ES1', 'GB1', 'L1', 'FR1', 'IT1')
        LEFT JOIN competitions comp
            ON comp.club_id = p.current_club_id
           AND comp.season_id = '2025'
           AND comp.competition_id IN ('ES1', 'GB1', 'L1', 'FR1', 'IT1')
    """


def list_players(limit: int = 20, offset: int = 0) -> list[PlayerSummary]:
    safe_limit = max(1, min(limit, 50))
    safe_offset = max(0, offset)
    query = f"""
        {_player_query_clause()}
        ORDER BY p.player_name ASC
        LIMIT :limit OFFSET :offset
    """
    rows = fetch_all(query, {"limit": safe_limit, "offset": safe_offset})
    return [_player_summary_from_row(row) for row in rows]


def get_player(player_id: int) -> PlayerSummary | None:
    cached = cache_get_json(f"{PLAYER_CACHE_PREFIX}:{player_id}")
    if cached:
        return _player_summary_from_dict(cached)

    row = fetch_one(
        f"""
        {_player_query_clause()}
        WHERE p.player_id = :player_id
        LIMIT 1
    """,
        {"player_id": player_id},
    )
    if not row:
        return None

    player = _player_summary_from_row(row)
    cache_set_json(f"{PLAYER_CACHE_PREFIX}:{player_id}", player.dict(), ttl_seconds=3600)
    return player


def search_players(
    query: str,
    limit: int = 50,
    search_by: SearchBy = "name",
) -> list[PlayerSummary]:
    normalized = query.strip()
    if not normalized:
        return list_players(limit=limit)

    safe_search_by = search_by if search_by in {"name", "club", "league", "position"} else "name"
    cache_key = f"{SEARCH_CACHE_PREFIX}:{safe_search_by}:{normalized.lower()}:{limit}"
    cached = cache_get_json(cache_key)
    if cached:
        return [_player_summary_from_dict(item) for item in cached]

    safe_limit = max(1, min(limit, 50))
    like_query = f"{normalized}%"
    contains_query = f"%{normalized}%"

    if safe_search_by == "club":
        where_clause = """
            WHERE LOWER(p.current_club_name) LIKE LOWER(:like_query)
               OR LOWER(p.current_club_name) LIKE LOWER(:contains_query)
        """
        order_clause = """
            ORDER BY
                CASE
                    WHEN LOWER(p.current_club_name) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(p.current_club_name) LIKE LOWER(:like_query) THEN 1
                    ELSE 2
                END,
                p.player_name ASC
        """
    elif safe_search_by == "league":
        where_clause = """
            WHERE LOWER(COALESCE(comp.competition_name, c.competition_name, '')) LIKE LOWER(:like_query)
               OR LOWER(COALESCE(comp.competition_name, c.competition_name, '')) LIKE LOWER(:contains_query)
        """
        order_clause = """
            ORDER BY
                CASE
                    WHEN LOWER(COALESCE(comp.competition_name, c.competition_name, '')) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(COALESCE(comp.competition_name, c.competition_name, '')) LIKE LOWER(:like_query) THEN 1
                    ELSE 2
                END,
                p.player_name ASC
        """
    elif safe_search_by == "position":
        where_clause = """
            WHERE LOWER(COALESCE(p.main_position, p.position, '')) LIKE LOWER(:like_query)
               OR LOWER(COALESCE(p.main_position, p.position, '')) LIKE LOWER(:contains_query)
               OR LOWER(COALESCE(p.position, '')) LIKE LOWER(:contains_query)
        """
        order_clause = """
            ORDER BY
                CASE
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) LIKE LOWER(:like_query) THEN 1
                    ELSE 2
                END,
                p.player_name ASC
        """
    else:
        where_clause = """
            WHERE LOWER(p.player_name) LIKE LOWER(:like_query)
               OR LOWER(p.player_slug) LIKE LOWER(:like_query)
               OR LOWER(p.player_name) LIKE LOWER(:contains_query)
        """
        order_clause = """
            ORDER BY
                CASE
                    WHEN LOWER(p.player_name) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(p.player_name) LIKE LOWER(:like_query) THEN 1
                    WHEN LOWER(p.player_slug) LIKE LOWER(:like_query) THEN 2
                    ELSE 3
                END,
                p.player_name ASC
        """

    rows = fetch_all(
        f"""
            {_player_query_clause()}
            {where_clause}
            {order_clause}
            LIMIT :limit
        """,
        {
            "like_query": like_query,
            "contains_query": contains_query,
            "exact_query": normalized,
            "limit": safe_limit,
        },
    )
    players = [_player_summary_from_row(row) for row in rows]
    cache_set_json(cache_key, [player.dict() for player in players], ttl_seconds=120)
    return players


def _get_all_player_ids() -> list[int]:
    rows = fetch_all("SELECT player_id FROM players ORDER BY player_id ASC")
    return [int(row["player_id"]) for row in rows]


def get_daily_target_id() -> int:
    today = current_day()
    cache_key = f"{TARGET_CACHE_PREFIX}:{today}"
    cached = cache_get_json(cache_key)
    if cached and "player_id" in cached:
        return int(cached["player_id"])

    total = fetch_scalar("SELECT COUNT(*) FROM players") or 0
    if total == 0:
        raise RuntimeError("No players available")

    digest = hashlib.sha256(today.encode("utf-8")).hexdigest()
    offset = int(digest, 16) % int(total)
    row = fetch_one(
        "SELECT player_id FROM players ORDER BY player_id ASC LIMIT 1 OFFSET :offset",
        {"offset": offset},
    )
    if not row:
        player_ids = _get_all_player_ids()
        if not player_ids:
            raise RuntimeError("No players available")
        player_id = player_ids[offset % len(player_ids)]
    else:
        player_id = int(row["player_id"])

    cache_set_json(cache_key, {"player_id": player_id}, ttl_seconds=seconds_until_tomorrow())
    return player_id


def _state_cache_key(session_id: str, user_id: int | None = None) -> str:
    if user_id:
        return f"{STATE_CACHE_PREFIX}:{current_day()}:user:{user_id}"
    return f"{STATE_CACHE_PREFIX}:{current_day()}:session:{session_id}"


def _empty_state(session_id: str) -> DailyGameState:
    return DailyGameState(session_id=session_id, date=current_day(), guesses=[], remaining_attempts=8)


def _attach_game_outcome(state: DailyGameState) -> DailyGameState:
    state.remaining_attempts = max(0, state.max_attempts - state.attempts_used)
    state.game_over = state.solved or (state.attempts_used >= state.max_attempts and not state.solved)

    for attempt in state.guesses:
        attempt.guess.player_name = format_player_name(attempt.guess.player_name)

    if state.game_over and state.revealed_target is None:
        target_player = get_player(get_daily_target_id())
        if target_player:
            state.revealed_target = target_player

    if state.revealed_target:
        state.revealed_target.player_name = format_player_name(state.revealed_target.player_name)

    return state


def get_daily_state(session_id: str, user_id: int | None = None) -> DailyGameState:
    # Try user-specific state first if user_id is provided
    if user_id:
        cached_user = cache_get_json(_state_cache_key(session_id, user_id))
        if cached_user:
            return _attach_game_outcome(DailyGameState(**cached_user))
        
        # If no user state but guest state exists, "promote" guest state to user state
        cached_guest = cache_get_json(_state_cache_key(session_id, None))
        if cached_guest:
            state = DailyGameState(**cached_guest)
            persist_daily_state(state, user_id)
            
            # Delete guest state after promotion
            from .cache import cache_delete
            cache_delete(_state_cache_key(session_id, None))
            
            # If the guest game was already finished, update the database record
            if state.game_over:
                from .database import get_engine, text
                with get_engine().begin() as conn:
                    conn.execute(
                        text("""
                            UPDATE game_results 
                            SET user_id = :user_id 
                            WHERE session_id = :session_id 
                            AND date = :date 
                            AND user_id IS NULL
                        """),
                        {"user_id": user_id, "session_id": session_id, "date": date.today()}
                    )
            
            return _attach_game_outcome(state)

    cached = cache_get_json(_state_cache_key(session_id, user_id))
    if cached:
        return _attach_game_outcome(DailyGameState(**cached))
    
    state = _empty_state(session_id)
    persist_daily_state(state, user_id)
    return state


def persist_daily_state(state: DailyGameState, user_id: int | None = None) -> None:
    _attach_game_outcome(state)
    cache_set_json(_state_cache_key(state.session_id, user_id), state.dict(), ttl_seconds=seconds_until_tomorrow())


def _compare_text(label: str, guess_value: str | None, target_value: str | None, key: str) -> ComparisonItem:
    if not guess_value or not target_value:
        return ComparisonItem(key=key, label=label, guess=guess_value, target=target_value, status="unknown", match=False)
    match = _normalize_text(guess_value) == _normalize_text(target_value)
    return ComparisonItem(
        key=key,
        label=label,
        guess=guess_value,
        target=target_value,
        match=match,
        status="correct" if match else "different",
    )


def _compare_numeric(label: str, guess_value: int | float | None, target_value: int | float | None, key: str) -> ComparisonItem:
    if guess_value is None or target_value is None:
        return ComparisonItem(
            key=key,
            label=label,
            guess=None if guess_value is None else str(guess_value),
            target=None if target_value is None else str(target_value),
            status="unknown",
        )
    if float(guess_value) == float(target_value):
        return ComparisonItem(
            key=key,
            label=label,
            guess=str(int(guess_value)) if float(guess_value).is_integer() else str(guess_value),
            target=str(int(target_value)) if float(target_value).is_integer() else str(target_value),
            match=True,
            status="correct",
            direction="same",
        )
    # Target is higher than guess -> Arrow UP
    # Target is lower than guess -> Arrow DOWN
    direction = "up" if float(target_value) > float(guess_value) else "down"
    return ComparisonItem(
        key=key,
        label=label,
        guess=str(int(guess_value)) if float(guess_value).is_integer() else str(guess_value),
        target=str(int(target_value)) if float(target_value).is_integer() else str(target_value),
        match=False,
        status="higher" if direction == "up" else "lower",
        direction=direction,
    )


def compare_players(guess: PlayerSummary, target: PlayerSummary) -> list[ComparisonItem]:
    guess_age = _calculate_age(guess.date_of_birth)
    target_age = _calculate_age(target.date_of_birth)
    return [
        _compare_text("Club", guess.current_club_name, target.current_club_name, "club"),
        _compare_text("Country", guess.country_of_birth, target.country_of_birth, "country"),
        _compare_text("League", guess.competition_name, target.competition_name, "league"),
        _compare_text("Position", guess.main_position or guess.position, target.main_position or target.position, "position"),
        _compare_numeric("Age", guess_age, target_age, "age"),
    ]


def start_daily_game(session_id: str, user_id: int | None = None) -> DailyGameState:
    state = get_daily_state(session_id, user_id)
    persist_daily_state(state, user_id)
    return state


def apply_guess(session_id: str, player_id: int, user_id: int | None = None) -> tuple[DailyGameState, AttemptResult]:
    state = get_daily_state(session_id, user_id)
    guess_player = get_player(player_id)
    if not guess_player:
        raise ValueError("Player not found")

    if state.attempts_used >= state.max_attempts and not state.solved:
        raise ValueError("No attempts left for today")

    if state.solved:
        attempt = AttemptResult(
            attempt_number=state.attempts_used + 1,
            guess=guess_player,
            comparisons=[],
            is_correct=True,
        )
        return state, attempt

    target_player_id = get_daily_target_id()
    target_player = get_player(target_player_id)
    if not target_player:
        raise RuntimeError("Target player not found")

    comparisons = compare_players(guess_player, target_player)
    is_correct = all(item.match for item in comparisons if item.status != "unknown")
    attempt = AttemptResult(
        attempt_number=state.attempts_used + 1,
        guess=guess_player,
        comparisons=comparisons,
        is_correct=is_correct,
    )
    state.attempts_used += 1
    state.solved = is_correct
    state.guesses = [*state.guesses, attempt]
    
    persist_daily_state(state, user_id)

    if state.solved or state.attempts_used >= state.max_attempts:
        # Save to database for leaderboard/stats
        from .database import get_engine, text
        with get_engine().begin() as conn:
            conn.execute(
                text("INSERT INTO game_results (user_id, session_id, date, attempts_used, solved, target_player_id) VALUES (:user_id, :session_id, :date, :attempts_used, :solved, :target_player_id)"),
                {
                    "user_id": user_id,
                    "session_id": session_id,
                    "date": date.today(),
                    "attempts_used": state.attempts_used,
                    "solved": state.solved,
                    "target_player_id": target_player_id
                }
            )

    return state, attempt


def describe_guess_result(state: DailyGameState, attempt: AttemptResult) -> str:
    target_name = state.revealed_target.player_name if state.revealed_target else "nieznany zawodnik"

    if attempt.is_correct:
        return f"Brawo! Odgadłeś zawodnika: {target_name}."

    if state.game_over and not attempt.is_correct:
        return f"Koniec gry! Szukany zawodnik to: {target_name}."

    return f"Próba {attempt.attempt_number} zapisana. Pozostało prób: {state.remaining_attempts}."

def get_leaderboard():
    query = """
        SELECT u.username, COUNT(*) as wins, SUM(attempts_used) as total_attempts, COALESCE(u.streak, 0) as streak
        FROM game_results gr
        JOIN users u ON gr.user_id = u.id
        WHERE gr.solved = true
        GROUP BY u.username, u.streak
        ORDER BY wins DESC, total_attempts ASC
        LIMIT 10
    """
    return fetch_all(query)

def get_daily_stats():
    today = date.today()
    total_games = fetch_scalar("SELECT COUNT(*) FROM game_results WHERE date = :today", {"today": today}) or 0
    if total_games == 0:
        return {"total_games": 0, "distribution": {}}
    
    # Distribution of attempts
    dist_rows = fetch_all("""
        SELECT attempts_used, COUNT(*) as count
        FROM game_results
        WHERE date = :today AND solved = true
        GROUP BY attempts_used
    """, {"today": today})
    
    not_solved = fetch_scalar("""
        SELECT COUNT(*) FROM game_results
        WHERE date = :today AND solved = false
    """, {"today": today}) or 0
    
    distribution = {str(r["attempts_used"]): round(r["count"] / total_games * 100, 1) for r in dist_rows}
    distribution["X"] = round(not_solved / total_games * 100, 1)
    
    return {
        "total_games": total_games,
        "distribution": distribution
    }