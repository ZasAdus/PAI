from __future__ import annotations

import hashlib
import re
from datetime import date, datetime, timedelta
from typing import Any, Literal
from urllib.parse import quote

import httpx

from .cache import cache_delete, cache_get_json, cache_set_json
from .database import fetch_all, fetch_one, fetch_scalar, get_engine, text
from .schemas import (
    AttemptResult,
    ClubDailyGameState,
    ClubGuessAttempt,
    ClubLineupPlayer,
    ClubSummary,
    ComparisonItem,
    DailyGameState,
    PlayerSummary,
)

CURRENT_COMPETITIONS = ("ES1", "GB1", "L1", "FR1", "IT1")
ACTIVE_SEASON = "2025"
PLAYER_TARGET_CACHE_PREFIX = "gtp:daily-target"
PLAYER_STATE_CACHE_PREFIX = "gtp:daily-state"
PLAYER_SEARCH_CACHE_PREFIX = "gtp:search"
PLAYER_CACHE_PREFIX = "gtp:player"
CLUB_TARGET_CACHE_PREFIX = "gtc:daily-target"
CLUB_STATE_CACHE_PREFIX = "gtc:daily-state"
CLUB_SEARCH_CACHE_PREFIX = "gtc:club-search"
CLUB_CACHE_PREFIX = "gtc:club"
CLUB_LINEUP_CACHE_PREFIX = "gtc:lineup"
ELIGIBLE_CLUBS_CACHE_PREFIX = "gtc:eligible-clubs"
FLAG_CACHE_PREFIX = "gtc:flag"
MARKET_VALUE_CACHE_PREFIX = "gtc:market-value"

COUNTRY_ALIASES = {
    "bosnia-herzegovina": "Bosnia and Herzegovina",
    "cape verde": "Cabo Verde",
    "curacao": "Curacao",
    "czech republic": "Czechia",
    "dr congo": "Democratic Republic of the Congo",
    "iran": "Iran",
    "ivory coast": "Cote d'Ivoire",
    "north macedonia": "North Macedonia",
    "republic of ireland": "Ireland",
    "russia": "Russia",
    "south korea": "South Korea",
    "syria": "Syria",
    "usa": "United States",
    "united states": "United States",
}

# Kraje nierozpoznawane przez restcountries.com — flagi podane bezpośrednio
HARDCODED_FLAG_URLS: dict[str, str] = {
    "england": "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg",
    "scotland": "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg",
    "wales": "https://upload.wikimedia.org/wikipedia/commons/d/dc/Flag_of_Wales.svg",
    "northern ireland": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Northern_Ireland_%281953%E2%80%931972%29.svg",
    "kosovo": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Flag_of_Kosovo.svg",
}

COUNTRY_ISO_CODES: dict[str, str] = {
    "afghanistan": "af", "albania": "al", "algeria": "dz", "andorra": "ad",
    "angola": "ao", "argentina": "ar", "armenia": "am", "australia": "au",
    "austria": "at", "azerbaijan": "az", "bahrain": "bh", "belarus": "by",
    "belgium": "be", "benin": "bj", "bolivia": "bo", "bosnia and herzegovina": "ba",
    "brazil": "br", "bulgaria": "bg", "burkina faso": "bf", "cameroon": "cm",
    "canada": "ca", "cabo verde": "cv", "chile": "cl", "china": "cn",
    "colombia": "co", "congo": "cg", "costa rica": "cr", "croatia": "hr",
    "cuba": "cu", "curacao": "cw", "czechia": "cz", "czech republic": "cz",
    "democratic republic of the congo": "cd", "denmark": "dk", "dr congo": "cd",
    "ecuador": "ec", "egypt": "eg", "ethiopia": "et", "finland": "fi",
    "france": "fr", "gabon": "ga", "gambia": "gm", "georgia": "ge",
    "germany": "de", "ghana": "gh", "greece": "gr", "guatemala": "gt",
    "guinea": "gn", "guinea-bissau": "gw", "honduras": "hn", "hungary": "hu",
    "iceland": "is", "india": "in", "indonesia": "id", "iran": "ir",
    "iraq": "iq", "ireland": "ie", "republic of ireland": "ie", "israel": "il",
    "italy": "it", "ivory coast": "ci", "jamaica": "jm", "japan": "jp",
    "jordan": "jo", "kazakhstan": "kz", "kenya": "ke", "latvia": "lv",
    "lebanon": "lb", "liberia": "lr", "libya": "ly", "liechtenstein": "li",
    "lithuania": "lt", "luxembourg": "lu", "madagascar": "mg", "mali": "ml",
    "malta": "mt", "mauritania": "mr", "mauritius": "mu", "mexico": "mx",
    "moldova": "md", "monaco": "mc", "montenegro": "me", "morocco": "ma",
    "mozambique": "mz", "namibia": "na", "netherlands": "nl", "new zealand": "nz",
    "nicaragua": "ni", "niger": "ne", "nigeria": "ng", "north korea": "kp",
    "north macedonia": "mk", "norway": "no", "oman": "om", "panama": "pa",
    "paraguay": "py", "peru": "pe", "philippines": "ph", "poland": "pl",
    "portugal": "pt", "qatar": "qa", "romania": "ro", "russia": "ru",
    "saudi arabia": "sa", "senegal": "sn", "serbia": "rs", "sierra leone": "sl",
    "slovakia": "sk", "slovenia": "si", "south africa": "za", "south korea": "kr",
    "spain": "es", "sudan": "sd", "sweden": "se", "switzerland": "ch",
    "syria": "sy", "tanzania": "tz", "thailand": "th", "togo": "tg",
    "trinidad and tobago": "tt", "tunisia": "tn", "turkey": "tr", "turkiye": "tr",
    "uganda": "ug", "ukraine": "ua", "united arab emirates": "ae",
    "united states": "us", "usa": "us", "uruguay": "uy", "uzbekistan": "uz",
    "venezuela": "ve", "vietnam": "vn", "zambia": "zm", "zimbabwe": "zw",
}


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


def _club_summary_from_dict(data: dict) -> ClubSummary:
    return ClubSummary(**dict(data))


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
    )


def _club_summary_from_row(row: dict) -> ClubSummary:
    return ClubSummary(
        club_id=str(row["club_id"]),
        club_name=row["club_name"],
        competition_id=row.get("competition_id"),
        competition_name=row.get("competition_name"),
        country_name=row.get("country_name"),
        logo_url=row.get("logo_url"),
    )


def _player_query_clause() -> str:
    competitions = ", ".join(f"'{value}'" for value in CURRENT_COMPETITIONS)
    return f"""
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
        LEFT JOIN LATERAL (
            SELECT club.country_name, club.competition_name
            FROM clubs club
            WHERE club.club_id = p.current_club_id
              AND club.competition_id IN ({competitions})
            ORDER BY club.season_id DESC
            LIMIT 1
        ) c ON true
        LEFT JOIN competitions comp
            ON comp.club_id = p.current_club_id
           AND comp.season_id = '{ACTIVE_SEASON}'
           AND comp.competition_id IN ({competitions})
    """


def _club_catalog_subquery() -> str:
    competitions = ", ".join(f"'{value}'" for value in CURRENT_COMPETITIONS)
    return f"""
        SELECT DISTINCT ON (c.club_id)
            c.club_id,
            c.club_name,
            c.logo_url,
            c.country_name,
            c.competition_id,
            c.competition_name
        FROM clubs c
        WHERE c.club_id IN (
            SELECT comp.club_id
            FROM competitions comp
            WHERE comp.season_id = '{ACTIVE_SEASON}'
              AND comp.competition_id IN ({competitions})
        )
          AND c.competition_id IN ({competitions})
          AND c.club_name IS NOT NULL
        ORDER BY c.club_id, c.season_id DESC
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


def get_club(club_id: str) -> ClubSummary | None:
    cache_key = f"{CLUB_CACHE_PREFIX}:{club_id}"
    cached = cache_get_json(cache_key)
    if cached:
        return _club_summary_from_dict(cached)

    row = fetch_one(
        f"""
        SELECT *
        FROM ({_club_catalog_subquery()}) c
        WHERE c.club_id = :club_id
        LIMIT 1
    """,
        {"club_id": club_id},
    )
    if not row:
        return None

    club = _club_summary_from_row(row)
    cache_set_json(cache_key, club.dict(), ttl_seconds=3600)
    return club


def search_players(query: str, limit: int = 50) -> list[PlayerSummary]:
    normalized = query.strip()
    if not normalized:
        return list_players(limit=limit)

    cache_key = f"{PLAYER_SEARCH_CACHE_PREFIX}:{normalized.lower()}:{limit}"
    cached = cache_get_json(cache_key)
    if cached:
        return [_player_summary_from_dict(item) for item in cached]

    safe_limit = max(1, min(limit, 50))
    like_query = f"{normalized}%"
    contains_query = f"%{normalized}%"
    rows = fetch_all(
        f"""
            {_player_query_clause()}
            WHERE (
                LOWER(p.player_name) LIKE LOWER(:like_query)
                OR LOWER(p.player_slug) LIKE LOWER(:like_query)
                OR LOWER(p.player_name) LIKE LOWER(:contains_query)
                OR LOWER(p.current_club_name) LIKE LOWER(:like_query)
                OR LOWER(p.current_club_name) LIKE LOWER(:contains_query)
            )
            ORDER BY
                CASE
                    WHEN LOWER(p.player_name) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(p.current_club_name) = LOWER(:exact_query) THEN 1
                    WHEN LOWER(p.player_name) LIKE LOWER(:like_query) THEN 2
                    WHEN LOWER(p.current_club_name) LIKE LOWER(:like_query) THEN 3
                    ELSE 4
                END,
                p.player_name ASC
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


def search_clubs(query: str, limit: int = 10) -> list[ClubSummary]:
    normalized = query.strip()
    if not normalized:
        return []

    cache_key = f"{CLUB_SEARCH_CACHE_PREFIX}:{normalized.lower()}:{limit}"
    cached = cache_get_json(cache_key)
    if cached:
        return [_club_summary_from_dict(item) for item in cached]

    safe_limit = max(1, min(limit, 20))
    like_query = f"{normalized}%"
    contains_query = f"%{normalized}%"
    rows = fetch_all(
        f"""
            SELECT *
            FROM ({_club_catalog_subquery()}) c
            WHERE (
                LOWER(c.club_name) LIKE LOWER(:like_query)
                OR LOWER(c.club_name) LIKE LOWER(:contains_query)
            )
            ORDER BY
                CASE
                    WHEN LOWER(c.club_name) = LOWER(:exact_query) THEN 0
                    WHEN LOWER(c.club_name) LIKE LOWER(:like_query) THEN 1
                    ELSE 2
                END,
                c.club_name ASC
            LIMIT :limit
        """,
        {
            "like_query": like_query,
            "contains_query": contains_query,
            "exact_query": normalized,
            "limit": safe_limit,
        },
    )
    clubs = [_club_summary_from_row(row) for row in rows]
    cache_set_json(cache_key, [club.dict() for club in clubs], ttl_seconds=120)
    return clubs


def _get_all_player_ids() -> list[int]:
    rows = fetch_all("SELECT player_id FROM players ORDER BY player_id ASC")
    return [int(row["player_id"]) for row in rows]


def get_daily_target_id() -> int:
    today = current_day()
    cache_key = f"{PLAYER_TARGET_CACHE_PREFIX}:{today}"
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


def _split_country_values(value: str | None) -> list[str]:
    if not value:
        return []
    normalized = value.strip()
    normalized = re.sub(r"\s{2,}", "|", normalized)
    normalized = re.sub(r"\s*/\s*", "|", normalized)
    normalized = re.sub(r"\s*,\s*", "|", normalized)
    return [part.strip() for part in normalized.split("|") if part.strip()]


def _primary_country_for_player(player: PlayerSummary) -> str | None:
    citizenship_values = _split_country_values(player.citizenship)
    if citizenship_values:
        return citizenship_values[0]
    birth_values = _split_country_values(player.country_of_birth)
    if birth_values:
        return birth_values[0]
    return None

def get_country_flag_url(country_name: str | None) -> str | None:
    if not country_name:
        return None

    normalized = _normalize_text(country_name)

    if normalized in HARDCODED_FLAG_URLS:
        return HARDCODED_FLAG_URLS[normalized]

    iso = COUNTRY_ISO_CODES.get(normalized)
    if iso:
        return f"https://flagcdn.com/w80/{iso}.png"

    return None


def _parse_market_value_to_eur(raw_value: str, suffix: str | None) -> int | None:
    if not raw_value:
        return None
    normalized = raw_value.replace(",", ".")
    try:
        number = float(normalized)
    except ValueError:
        return None

    scale = 1
    suffix_normalized = (suffix or "").lower()
    if suffix_normalized == "bn":
        scale = 1_000_000_000
    elif suffix_normalized == "m":
        scale = 1_000_000
    elif suffix_normalized == "k":
        scale = 1_000
    return int(number * scale)


def fetch_player_market_value(player: PlayerSummary) -> int | None:
    cache_key = f"{MARKET_VALUE_CACHE_PREFIX}:{player.player_id}"
    cached = cache_get_json(cache_key)
    if cached and "value" in cached:
        return int(cached["value"]) if cached["value"] is not None else None

    try:
        response = httpx.get(
            f"https://www.transfermarkt.com/{player.player_slug}/profil/spieler/{player.player_id}",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=12.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        match = re.search(r"€\s*([0-9]+(?:[.,][0-9]+)?)\s*(bn|m|k)", response.text, flags=re.IGNORECASE)
        value = _parse_market_value_to_eur(match.group(1), match.group(2)) if match else None
        cache_set_json(cache_key, {"value": value}, ttl_seconds=86400 * 7)
        return value
    except Exception:
        cache_set_json(cache_key, {"value": None}, ttl_seconds=3600)
        return None


def _player_line(player: PlayerSummary) -> Literal["goalkeeper", "defender", "midfielder", "attacker"] | None:
    raw = _normalize_text(player.main_position or player.position)
    if not raw:
        return None
    if "goalkeeper" in raw:
        return "goalkeeper"
    if "defender" in raw:
        return "defender"
    if "midfield" in raw:
        return "midfielder"
    if "attack" in raw or "forward" in raw or "striker" in raw:
        return "attacker"
    return None


def _get_eligible_club_ids() -> list[str]:
    cache_key = f"{ELIGIBLE_CLUBS_CACHE_PREFIX}:{current_day()}"
    cached = cache_get_json(cache_key)
    if cached and "club_ids" in cached:
        return [str(value) for value in cached["club_ids"]]

    rows = fetch_all(
        f"""
        SELECT
            roster.club_id
        FROM (
            SELECT
                p.current_club_id AS club_id,
                CASE
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%goalkeeper%' THEN 'goalkeeper'
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%defender%' THEN 'defender'
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%midfield%' THEN 'midfielder'
                    WHEN LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%attack%'
                      OR LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%forward%'
                      OR LOWER(COALESCE(p.main_position, p.position, '')) LIKE '%striker%' THEN 'attacker'
                    ELSE NULL
                END AS line
            FROM players p
            JOIN competitions comp
                ON comp.club_id = p.current_club_id
               AND comp.season_id = '{ACTIVE_SEASON}'
               AND comp.competition_id IN ({", ".join(f"'{value}'" for value in CURRENT_COMPETITIONS)})
            WHERE p.current_club_id IS NOT NULL
              AND p.current_club_name NOT IN ('Retired', 'Without Club')
        ) roster
        GROUP BY roster.club_id
        HAVING SUM(CASE WHEN roster.line = 'goalkeeper' THEN 1 ELSE 0 END) >= 1
           AND SUM(CASE WHEN roster.line = 'defender' THEN 1 ELSE 0 END) >= 4
           AND SUM(CASE WHEN roster.line = 'midfielder' THEN 1 ELSE 0 END) >= 4
           AND SUM(CASE WHEN roster.line = 'attacker' THEN 1 ELSE 0 END) >= 2
        ORDER BY roster.club_id ASC
        """
    )
    club_ids = [str(row["club_id"]) for row in rows]
    cache_set_json(cache_key, {"club_ids": club_ids}, ttl_seconds=seconds_until_tomorrow())
    return club_ids


def get_daily_club_target_id() -> str:
    today = current_day()
    cache_key = f"{CLUB_TARGET_CACHE_PREFIX}:{today}"
    cached = cache_get_json(cache_key)
    if cached and "club_id" in cached:
        return str(cached["club_id"])

    club_ids = _get_eligible_club_ids()
    if not club_ids:
        raise RuntimeError("No eligible clubs available")

    digest = hashlib.sha256(f"club:{today}".encode("utf-8")).hexdigest()
    start_index = int(digest, 16) % len(club_ids)
    for offset in range(len(club_ids)):
        club_id = club_ids[(start_index + offset) % len(club_ids)]
        try:
            build_daily_club_lineup(club_id)
        except RuntimeError:
            continue
        cache_set_json(cache_key, {"club_id": club_id}, ttl_seconds=seconds_until_tomorrow())
        return club_id

    raise RuntimeError("No eligible clubs available")


def _players_for_club(club_id: str) -> list[PlayerSummary]:
    rows = fetch_all(
        f"""
        {_player_query_clause()}
        WHERE p.current_club_id = :club_id
          AND p.current_club_name NOT IN ('Retired', 'Without Club')
        ORDER BY p.player_name ASC
        """,
        {"club_id": club_id},
    )
    return [_player_summary_from_row(row) for row in rows]


def _get_cached_market_value(player: PlayerSummary) -> int | None:
    cache_key = f"{MARKET_VALUE_CACHE_PREFIX}:{player.player_id}"
    cached = cache_get_json(cache_key)
    if cached and "value" in cached and cached["value"] is not None:
        return int(cached["value"])
    return None


def _sort_players_by_market_value(
    players: list[PlayerSummary],
    *,
    fetch_missing: bool = False,
) -> list[tuple[PlayerSummary, int]]:
    ranked: list[tuple[PlayerSummary, int]] = []
    for player in players:
        if fetch_missing:
            market_value = fetch_player_market_value(player) or 0
        else:
            market_value = _get_cached_market_value(player) or 0
        ranked.append((player, market_value))
    ranked.sort(
        key=lambda item: (
            item[1],
            _parse_birth_year(item[0].date_of_birth) or 0,
            item[0].player_id,
        ),
        reverse=True,
    )
    return ranked


def build_daily_club_lineup(club_id: str) -> list[ClubLineupPlayer]:
    cache_key = f"{CLUB_LINEUP_CACHE_PREFIX}:{current_day()}:{club_id}"
    cached = cache_get_json(cache_key)
    if cached:
        return [ClubLineupPlayer(**item) for item in cached]

    roster = _players_for_club(club_id)
    grouped = {
        "goalkeeper": [],
        "defender": [],
        "midfielder": [],
        "attacker": [],
    }
    for player in roster:
        line = _player_line(player)
        if line:
            grouped[line].append(player)

    formation_requirements = {
        "goalkeeper": 1,
        "defender": 4,
        "midfielder": 4,
        "attacker": 2,
    }
    lineup: list[ClubLineupPlayer] = []
    for line_name, required_count in formation_requirements.items():
        ranked = _sort_players_by_market_value(grouped[line_name])
        if len(ranked) < required_count:
            raise RuntimeError(f"Club {club_id} does not have enough players for {line_name}")

        selected = ranked[:required_count]
        for slot_index, (player, market_value) in enumerate(selected, start=1):
            country_name = _primary_country_for_player(player)
            lineup.append(
                ClubLineupPlayer(
                    player_id=player.player_id,
                    player_name=player.player_name,
                    line=line_name,
                    slot_index=slot_index,
                    country_name=country_name,
                    flag_url=get_country_flag_url(country_name),
                    market_value_eur=market_value or None,
                )
            )

    line_order = {"goalkeeper": 0, "defender": 1, "midfielder": 2, "attacker": 3}
    lineup.sort(key=lambda player: (line_order[player.line], player.slot_index))
    cache_set_json(cache_key, [item.dict() for item in lineup], ttl_seconds=seconds_until_tomorrow())
    return lineup


def _player_state_cache_key(session_id: str, user_id: int | None = None) -> str:
    if user_id:
        return f"{PLAYER_STATE_CACHE_PREFIX}:{current_day()}:user:{user_id}"
    return f"{PLAYER_STATE_CACHE_PREFIX}:{current_day()}:session:{session_id}"


def _club_state_cache_key(session_id: str, user_id: int | None = None) -> str:
    if user_id:
        return f"{CLUB_STATE_CACHE_PREFIX}:{current_day()}:user:{user_id}"
    return f"{CLUB_STATE_CACHE_PREFIX}:{current_day()}:session:{session_id}"


def _empty_state(session_id: str) -> DailyGameState:
    return DailyGameState(session_id=session_id, date=current_day(), guesses=[], remaining_attempts=8)


def _empty_club_state(session_id: str) -> ClubDailyGameState:
    return ClubDailyGameState(session_id=session_id, date=current_day(), guesses=[], remaining_attempts=4, lineup=[])


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


def _attach_club_game_outcome(state: ClubDailyGameState) -> ClubDailyGameState:
    state.remaining_attempts = max(0, state.max_attempts - state.attempts_used)
    state.game_over = state.solved or (state.attempts_used >= state.max_attempts and not state.solved)

    if not state.lineup:
        state.lineup = build_daily_club_lineup(get_daily_club_target_id())

    if state.game_over and state.revealed_target is None:
        state.revealed_target = get_club(get_daily_club_target_id())

    return state


def _promote_finished_game(session_id: str, user_id: int, game_type: str) -> None:
    with get_engine().begin() as conn:
        conn.execute(
            text(
                """
                UPDATE game_results
                SET user_id = :user_id
                WHERE session_id = :session_id
                  AND date = :date
                  AND user_id IS NULL
                  AND game_type = :game_type
                """
            ),
            {
                "user_id": user_id,
                "session_id": session_id,
                "date": date.today(),
                "game_type": game_type,
            },
        )


def get_daily_state(session_id: str, user_id: int | None = None) -> DailyGameState:
    if user_id:
        cached_user = cache_get_json(_player_state_cache_key(session_id, user_id))
        if cached_user:
            return _attach_game_outcome(DailyGameState(**cached_user))

        cached_guest = cache_get_json(_player_state_cache_key(session_id, None))
        if cached_guest:
            state = DailyGameState(**cached_guest)
            persist_daily_state(state, user_id)
            cache_delete(_player_state_cache_key(session_id, None))
            if state.game_over:
                _promote_finished_game(session_id, user_id, "player")
            return _attach_game_outcome(state)

    cached = cache_get_json(_player_state_cache_key(session_id, user_id))
    if cached:
        return _attach_game_outcome(DailyGameState(**cached))

    state = _empty_state(session_id)
    persist_daily_state(state, user_id)
    return state


def get_daily_club_state(session_id: str, user_id: int | None = None) -> ClubDailyGameState:
    if user_id:
        cached_user = cache_get_json(_club_state_cache_key(session_id, user_id))
        if cached_user:
            return _attach_club_game_outcome(ClubDailyGameState(**cached_user))

        cached_guest = cache_get_json(_club_state_cache_key(session_id, None))
        if cached_guest:
            state = ClubDailyGameState(**cached_guest)
            persist_daily_club_state(state, user_id)
            cache_delete(_club_state_cache_key(session_id, None))
            if state.game_over:
                _promote_finished_game(session_id, user_id, "club")
            return _attach_club_game_outcome(state)

    cached = cache_get_json(_club_state_cache_key(session_id, user_id))
    if cached:
        return _attach_club_game_outcome(ClubDailyGameState(**cached))

    state = _empty_club_state(session_id)
    persist_daily_club_state(state, user_id)
    return state


def persist_daily_state(state: DailyGameState, user_id: int | None = None) -> None:
    _attach_game_outcome(state)
    cache_set_json(_player_state_cache_key(state.session_id, user_id), state.dict(), ttl_seconds=seconds_until_tomorrow())


def persist_daily_club_state(state: ClubDailyGameState, user_id: int | None = None) -> None:
    _attach_club_game_outcome(state)
    cache_set_json(_club_state_cache_key(state.session_id, user_id), state.dict(), ttl_seconds=seconds_until_tomorrow())


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


def start_daily_club_game(session_id: str, user_id: int | None = None) -> ClubDailyGameState:
    state = get_daily_club_state(session_id, user_id)
    persist_daily_club_state(state, user_id)
    return state


def _save_completed_game_result(
    *,
    user_id: int | None,
    session_id: str,
    attempts_used: int,
    solved: bool,
    game_type: str,
    target_player_id: int | None = None,
    target_club_id: str | None = None,
) -> None:
    with get_engine().begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO game_results (
                    user_id,
                    session_id,
                    date,
                    game_type,
                    attempts_used,
                    solved,
                    target_player_id,
                    target_club_id
                ) VALUES (
                    :user_id,
                    :session_id,
                    :date,
                    :game_type,
                    :attempts_used,
                    :solved,
                    :target_player_id,
                    :target_club_id
                )
                """
            ),
            {
                "user_id": user_id,
                "session_id": session_id,
                "date": date.today(),
                "game_type": game_type,
                "attempts_used": attempts_used,
                "solved": solved,
                "target_player_id": target_player_id,
                "target_club_id": target_club_id,
            },
        )


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
        _save_completed_game_result(
            user_id=user_id,
            session_id=session_id,
            attempts_used=state.attempts_used,
            solved=state.solved,
            game_type="player",
            target_player_id=target_player_id,
        )

    return state, attempt


def apply_club_guess(session_id: str, club_id: str, user_id: int | None = None) -> tuple[ClubDailyGameState, ClubGuessAttempt]:
    state = get_daily_club_state(session_id, user_id)
    guessed_club = get_club(club_id)
    if not guessed_club:
        raise ValueError("Club not found")

    if state.attempts_used >= state.max_attempts and not state.solved:
        raise ValueError("No attempts left for today")

    if state.solved:
        attempt = ClubGuessAttempt(
            attempt_number=state.attempts_used + 1,
            club_id=guessed_club.club_id,
            club_name=guessed_club.club_name,
            is_correct=True,
        )
        return state, attempt

    target_club_id = get_daily_club_target_id()
    is_correct = str(guessed_club.club_id) == str(target_club_id)
    attempt = ClubGuessAttempt(
        attempt_number=state.attempts_used + 1,
        club_id=guessed_club.club_id,
        club_name=guessed_club.club_name,
        is_correct=is_correct,
    )
    state.attempts_used += 1
    state.solved = is_correct
    state.guesses = [*state.guesses, attempt]

    persist_daily_club_state(state, user_id)

    if state.solved or state.attempts_used >= state.max_attempts:
        _save_completed_game_result(
            user_id=user_id,
            session_id=session_id,
            attempts_used=state.attempts_used,
            solved=state.solved,
            game_type="club",
            target_club_id=target_club_id,
        )

    return state, attempt


def describe_guess_result(state: DailyGameState, attempt: AttemptResult) -> str:
    target_name = state.revealed_target.player_name if state.revealed_target else "nieznany zawodnik"

    if attempt.is_correct:
        return f"Brawo! Odgadłeś zawodnika: {target_name}."

    if state.game_over and not attempt.is_correct:
        return f"Koniec gry! Szukany zawodnik to: {target_name}."

    return f""


def describe_club_guess_result(state: ClubDailyGameState, attempt: ClubGuessAttempt) -> str:
    target_name = state.revealed_target.club_name if state.revealed_target else "nieznany klub"
    if state.revealed_target:
        target_name = re.sub(r"\s*\(\d+\)\s*$", "", target_name).strip()

    if attempt.is_correct:
        return f"Brawo! Odgadłeś klub: {target_name}."

    if state.game_over:
        return f"Koniec gry! Szukany klub to: {target_name}."

    return f""


def get_leaderboard(game_type: str = "all"):
    params: dict[str, Any] = {}
    filter_clause = ""
    if game_type in {"player", "club"}:
        filter_clause = "AND gr.game_type = :game_type"
        params["game_type"] = game_type

    query = f"""
        SELECT
            u.username,
            COUNT(*) AS wins,
            SUM(gr.attempts_used) AS total_attempts,
            COALESCE(u.streak, 0) AS streak
        FROM game_results gr
        JOIN users u ON gr.user_id = u.id
        WHERE gr.solved = true
          {filter_clause}
        GROUP BY u.username, u.streak
        ORDER BY wins DESC, total_attempts ASC, u.username ASC
        LIMIT 10
    """
    return fetch_all(query, params)


def get_daily_stats(game_type: str = "player"):
    today = date.today()
    params = {"today": today, "game_type": game_type}
    total_games = fetch_scalar(
        """
        SELECT COUNT(*) FROM game_results
        WHERE date = :today AND game_type = :game_type
        """,
        params,
    ) or 0
    if total_games == 0:
        return {"total_games": 0, "distribution": {}}

    dist_rows = fetch_all(
        """
        SELECT attempts_used, COUNT(*) AS count
        FROM game_results
        WHERE date = :today AND solved = true AND game_type = :game_type
        GROUP BY attempts_used
        """,
        params,
    )

    not_solved = fetch_scalar(
        """
        SELECT COUNT(*) FROM game_results
        WHERE date = :today AND solved = false AND game_type = :game_type
        """,
        params,
    ) or 0

    distribution = {str(row["attempts_used"]): round(row["count"] / total_games * 100, 1) for row in dist_rows}
    distribution["X"] = round(not_solved / total_games * 100, 1)
    return {"total_games": total_games, "distribution": distribution}