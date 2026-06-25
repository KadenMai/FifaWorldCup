#!/usr/bin/env python3
"""
Build scripts/team-map.json by matching API-Football team IDs to local team slugs.

Usage:
  set APIFOOTBALL_KEY=your_key
  python scripts/build_team_map.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
TEAMS_PATH = ROOT / "public" / "data" / "teams.json"
TEAM_MAP_PATH = ROOT / "scripts" / "team-map.json"

API_BASE = "https://v3.football.api-sports.io"
LEAGUE_ID = 1
SEASON = 2026

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
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def fetch_teams(api_key: str) -> list[dict]:
    response = requests.get(
        f"{API_BASE}/teams",
        headers={"x-apisports-key": api_key},
        params={"league": LEAGUE_ID, "season": SEASON},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("errors"):
        raise RuntimeError(f"API-Football error: {payload['errors']}")

    rows = payload.get("response") or []
    return [row.get("team") or {} for row in rows if row.get("team")]


def main() -> int:
    api_key = os.environ.get("APIFOOTBALL_KEY", "").strip()
    if not api_key:
        print("ERROR: Set APIFOOTBALL_KEY environment variable.", file=sys.stderr)
        return 1

    local_teams = load_json(TEAMS_PATH)
    by_id = {team["id"]: team for team in local_teams}
    by_norm_name: dict[str, str] = {}

    for team in local_teams:
        for candidate in {team["id"], team["name"], team.get("shortName", "")}:
            if candidate:
                by_norm_name[normalize(str(candidate))] = team["id"]

    for alias, team_id in NAME_OVERRIDES.items():
        by_norm_name[normalize(alias)] = team_id

    api_teams = fetch_teams(api_key)
    team_map: dict[str, str] = {}
    unmatched: list[str] = []

    for api_team in api_teams:
        api_id = str(api_team.get("id", ""))
        api_name = api_team.get("name", "")
        norm = normalize(api_name)

        local_id = NAME_OVERRIDES.get(norm) or by_norm_name.get(norm)
        if not local_id:
            # Try slug-like match from normalized API name
            slug = norm.replace(" ", "-")
            if slug in by_id:
                local_id = slug

        if local_id:
            team_map[api_id] = local_id
        else:
            unmatched.append(f"{api_id}: {api_name}")

    save_json(TEAM_MAP_PATH, dict(sorted(team_map.items(), key=lambda item: int(item[0]))))

    print(f"Wrote {len(team_map)} mappings to {TEAM_MAP_PATH}")
    if unmatched:
        print("\nUnmatched API teams (add to NAME_OVERRIDES in build_team_map.py):")
        for row in unmatched:
            print(f"  - {row}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
