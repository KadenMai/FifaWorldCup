#!/usr/bin/env python3
"""
Build scripts/2026/team-map.json by matching API-Football team IDs to local team slugs.

Free plan cannot use league=1&season=2026. This script falls back to per-team
search (works on free tier, ~1 API call per team).

Usage:
  set APIFOOTBALL_KEY=your_key
  python scripts/2026/build_team_map.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
TEAMS_PATH = ROOT / "public" / "data" / "2026" / "teams.json"
TEAM_MAP_PATH = SCRIPT_DIR / "team-map.json"

API_BASE = "https://v3.football.api-sports.io"
LEAGUE_ID = 1
SEASON = int(os.environ.get("APIFOOTBALL_SEASON", "2026"))

# Manual overrides when API name differs from our teams.json name
NAME_OVERRIDES: dict[str, str] = {
    "korea republic": "south-korea",
    "south korea": "south-korea",
    "usa": "usa",
    "united states": "usa",
    "united states of america": "usa",
    "iran": "iran",
    "ir iran": "iran",
    "cote d'ivoire": "ivory-coast",
    "côte d'ivoire": "ivory-coast",
    "ivory coast": "ivory-coast",
    "turkey": "turkiye",
    "türkiye": "turkiye",
    "czech republic": "czechia",
    "curacao": "curacao",
    "curaçao": "curacao",
    "cabo verde": "cape-verde",
    "cape verde": "cape-verde",
    "dr congo": "dr-congo",
    "congo dr": "dr-congo",
    "democratic republic of the congo": "dr-congo",
    "saudi arabia": "saudi-arabia",
    "new zealand": "new-zealand",
    "south africa": "south-africa",
    "bosnia and herzegovina": "bosnia",
    "bosnia-herzegovina": "bosnia",
}

# Search terms for /teams?search= (min 3 chars) when team name is too short
SEARCH_TERMS: dict[str, str] = {
    "usa": "United States",
    "iran": "Iran",
    "qatar": "Qatar",
    "iraq": "Iraq",
    "japan": "Japan",
    "mexico": "Mexico",
    "canada": "Canada",
    "brazil": "Brazil",
    "spain": "Spain",
    "france": "France",
    "germany": "Germany",
    "south-korea": "Korea Republic",
    "ivory-coast": "Ivory Coast",
    "saudi-arabia": "Saudi Arabia",
    "south-africa": "South Africa",
    "new-zealand": "New Zealand",
    "dr-congo": "DR Congo",
    "cape-verde": "Cape Verde",
    "bosnia": "Bosnia",
}


def normalize(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, indent=2, ensure_ascii=False)
        handle.write("\n")


def api_get(api_key: str, params: dict) -> dict:
    response = requests.get(
        f"{API_BASE}/teams",
        headers={"x-apisports-key": api_key},
        params=params,
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()

    remaining = response.headers.get("x-ratelimit-requests-remaining")
    if remaining is not None:
        print(f"  API quota remaining today: {remaining}")

    if payload.get("errors"):
        raise RuntimeError(f"API-Football error: {payload['errors']}")

    return payload


def is_season_blocked(error: RuntimeError) -> bool:
    message = str(error).lower()
    return "season" in message or "plan" in message


def fetch_teams_by_league(api_key: str) -> list[dict]:
    payload = api_get(api_key, {"league": LEAGUE_ID, "season": SEASON})
    rows = payload.get("response") or []
    return [row.get("team") or {} for row in rows if row.get("team")]


def pick_best_match(candidates: list[dict], local_team: dict) -> dict | None:
    if not candidates:
        return None

    local_norms = {
        normalize(local_team["id"]),
        normalize(local_team["name"]),
        normalize(local_team.get("shortName", "")),
    }
    local_norms.discard("")

    for alias, team_id in NAME_OVERRIDES.items():
        if team_id == local_team["id"]:
            local_norms.add(normalize(alias))

    best: dict | None = None
    best_score = -1

    for team in candidates:
        api_name = team.get("name", "")
        norm = normalize(api_name)
        score = 0
        if norm in local_norms:
            score = 100
        elif norm.replace(" ", "-") == local_team["id"]:
            score = 90
        elif any(part in norm for part in local_norms if len(part) > 3):
            score = 50

        if team.get("national") is True:
            score += 5

        if score > best_score:
            best_score = score
            best = team

    return best if best_score >= 50 else None


def fetch_team_by_search(api_key: str, local_team: dict) -> dict | None:
    search = SEARCH_TERMS.get(local_team["id"], local_team["name"])
    if len(search) < 3:
        search = local_team["name"]

    payload = api_get(api_key, {"search": search})
    teams = [row.get("team") or {} for row in payload.get("response") or []]
    return pick_best_match(teams, local_team)


def build_map_from_api_list(api_teams: list[dict], local_teams: list[dict]) -> tuple[dict[str, str], list[str]]:
    by_id = {team["id"]: team for team in local_teams}
    by_norm_name: dict[str, str] = {}

    for team in local_teams:
        for candidate in {team["id"], team["name"], team.get("shortName", "")}:
            if candidate:
                by_norm_name[normalize(str(candidate))] = team["id"]

    for alias, team_id in NAME_OVERRIDES.items():
        by_norm_name[normalize(alias)] = team_id

    team_map: dict[str, str] = {}
    unmatched: list[str] = []

    for api_team in api_teams:
        api_id = str(api_team.get("id", ""))
        api_name = api_team.get("name", "")
        norm = normalize(api_name)

        local_id = NAME_OVERRIDES.get(norm) or by_norm_name.get(norm)
        if not local_id:
            slug = norm.replace(" ", "-")
            if slug in by_id:
                local_id = slug

        if local_id:
            team_map[api_id] = local_id
        else:
            unmatched.append(f"{api_id}: {api_name}")

    return team_map, unmatched


def build_map_by_search(api_key: str, local_teams: list[dict]) -> tuple[dict[str, str], list[str]]:
    team_map: dict[str, str] = {}
    unmatched: list[str] = []

    print(f"Free plan: searching {len(local_teams)} teams one-by-one (uses ~{len(local_teams)} API calls)...")

    for index, local_team in enumerate(local_teams, start=1):
        print(f"[{index}/{len(local_teams)}] {local_team['name']}")
        try:
            api_team = fetch_team_by_search(api_key, local_team)
        except RuntimeError as error:
            print(f"  ERROR: {error}")
            unmatched.append(f"{local_team['id']}: search failed")
            continue

        if api_team:
            team_map[str(api_team["id"])] = local_team["id"]
            print(f"  -> API id {api_team['id']} ({api_team.get('name')})")
        else:
            unmatched.append(f"{local_team['id']}: {local_team['name']}")

        # Free plan: 10 requests/minute
        time.sleep(0.7)

    return team_map, unmatched


def main() -> int:
    api_key = os.environ.get("APIFOOTBALL_KEY", "").strip()
    if not api_key:
        print("ERROR: Set APIFOOTBALL_KEY environment variable.", file=sys.stderr)
        return 1

    local_teams = load_json(TEAMS_PATH)
    team_map: dict[str, str] = {}
    unmatched: list[str] = []

    try:
        print(f"Trying league={LEAGUE_ID}, season={SEASON}...")
        api_teams = fetch_teams_by_league(api_key)
        print(f"Loaded {len(api_teams)} teams from World Cup season.")
        team_map, unmatched = build_map_from_api_list(api_teams, local_teams)
    except RuntimeError as error:
        if not is_season_blocked(error):
            raise
        print(f"\nSeason {SEASON} not available on your plan: {error}")
        print("Falling back to team search (works on free plan for team IDs only).\n")
        team_map, unmatched = build_map_by_search(api_key, local_teams)

    save_json(TEAM_MAP_PATH, dict(sorted(team_map.items(), key=lambda item: int(item[0]))))

    print(f"\nWrote {len(team_map)} mappings to {TEAM_MAP_PATH}")
    if unmatched:
        print("\nUnmatched teams (edit SEARCH_TERMS / NAME_OVERRIDES in build_team_map.py):")
        for row in unmatched:
            print(f"  - {row}")

    if len(team_map) < len(local_teams) * 0.8:
        print("\nWARNING: Less than 80% of teams mapped. Review unmatched list.", file=sys.stderr)
        return 1

    print(
        "\nNOTE: Free plan cannot sync 2026 fixtures/standings (season 2026 blocked). "
        "team-map.json is ready for when you upgrade to Pro, or use static data: "
        "node scripts/2026/generate-data.mjs"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
