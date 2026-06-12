from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class PlayerSummary(BaseModel):
    player_id: int
    player_slug: str
    player_name: str
    player_image_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    birth_year: Optional[int] = None
    country_of_birth: Optional[str] = None
    citizenship: Optional[str] = None
    height: Optional[float] = None
    position: Optional[str] = None
    main_position: Optional[str] = None
    current_club_id: Optional[str] = None
    current_club_name: Optional[str] = None
    club_country_name: Optional[str] = None
    competition_id: Optional[str] = None
    competition_name: Optional[str] = None
    competition_rank: Optional[str] = None


class ClubSummary(BaseModel):
    club_id: str
    club_name: str
    competition_id: Optional[str] = None
    competition_name: Optional[str] = None
    country_name: Optional[str] = None
    logo_url: Optional[str] = None


class PlayerSearchResponse(BaseModel):
    items: list[PlayerSummary]


class ComparisonItem(BaseModel):
    key: str
    label: str
    guess: Optional[str] = None
    target: Optional[str] = None
    match: bool = False
    status: Literal["correct", "higher", "lower", "different", "unknown"] = "unknown"
    direction: Optional[Literal["up", "down", "same"]] = None


class GuessRequest(BaseModel):
    session_id: str = Field(..., min_length=6)
    player_id: int


class AttemptResult(BaseModel):
    attempt_number: int
    guess: PlayerSummary
    comparisons: list[ComparisonItem]
    is_correct: bool


class DailyGameState(BaseModel):
    session_id: str
    date: str
    solved: bool = False
    game_over: bool = False
    attempts_used: int = 0
    max_attempts: int = 8
    guesses: list[AttemptResult] = Field(default_factory=list)
    remaining_attempts: int = 8
    revealed_target: Optional[PlayerSummary] = None


class GuessResponse(BaseModel):
    state: DailyGameState
    last_attempt: AttemptResult
    message: str


class ClubGuessRequest(BaseModel):
    session_id: str = Field(..., min_length=6)
    club_id: str = Field(..., min_length=1)


class ClubLineupPlayer(BaseModel):
    player_id: int
    player_name: str
    line: Literal["goalkeeper", "defender", "midfielder", "attacker"]
    slot_index: int
    country_name: Optional[str] = None
    flag_url: Optional[str] = None
    market_value_eur: Optional[int] = None


class ClubGuessAttempt(BaseModel):
    attempt_number: int
    club_id: str
    club_name: str
    is_correct: bool


class ClubDailyGameState(BaseModel):
    session_id: str
    date: str
    solved: bool = False
    game_over: bool = False
    attempts_used: int = 0
    max_attempts: int = 4
    guesses: list[ClubGuessAttempt] = Field(default_factory=list)
    remaining_attempts: int = 4
    lineup: list[ClubLineupPlayer] = Field(default_factory=list)
    revealed_target: Optional[ClubSummary] = None


class HealthResponse(BaseModel):
    ok: bool = True
