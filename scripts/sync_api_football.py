#!/usr/bin/env python3
"""
Sync World Cup data from API-Football into public/data JSON files.

Usage:
  set APIFOOTBALL_KEY=your_key
  python scripts/build_team_map.py      # first time only
  python scripts/sync_api_football.py

Environment:
  APIFOOTBALL_KEY   Required. API-Sports / API-Football key.
  DRY_RUN=1         Print summary without writing files.
  SKIP_VERSION_BUMP=1  Do not update DATA_VERSION in dataLoader.ts
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
TEAMS_PATH = DATA_DIR / "teams.json"
MATCHES_PATH = DATA_DIR / "matches.json"
STANDINGS_PATH = DATA_DIR / "standings.json"
TEAM_MAP_PATH = ROOT / "scripts" / "team-map.json"
VENUE_MAP_PATH = ROOT / "scripts" / "venue-map.json"
DATA_LOADER_PATH = ROOT / "src" / "data" / "dataLoader.ts"

API_BASE = "https://v3.football.api-sports.io"
LEAGUE_ID = 1
SEASON = 2026

STATUS_MAP = {
    "TBD": "Scheduled",
    "NS": "Scheduled",
    "1H": "Live",
    "HT": "Live",
    "2H": "Live",
    "ET": "Live",
    "BT": "Live",
    "P": "Live",
    "LIVE": "Live",
    "FT": "Finished",
    "AET": "Finished",
    "PEN": "Finished",
    "PST": "Postponed",
    "CANC": "Cancelled",
    "ABD": "Cancelled",
    "AWD": "Finished",
    "WO": "Finished",
}

ROUND_MAP = {
    "group stage": "Group Stage",
    "round of 16": "Round of 16",
    "quarter-finals": "Quarter-finals",
    "quarter-final": "Quarter-finals",
    "semi-finals": "Semi-finals",
    "semi-final": "Semi-finals",
    "3rd place final": "Third Place",
    "3rd place": "Third Place",
    "final": "Final",
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower().strip())


def api_get(path: str, api_key: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = requests.get(
        f"{API_BASE}{path}",
        headers={"x-apisports-key": api_key},
        params=params or {},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("errors"):
        raise RuntimeError(f"API-Football error on {path}: {payload['errors']}")

    remaining = response.headers.get("x-ratelimit-requests-remaining")
    if remaining is not None:
        print(f"API quota remaining today: {remaining}")

    return payload


def parse_round(raw_round: str | None) -> tuple[str, str | None]:
    if not raw_round:
        return "Group Stage", None

    lower = raw_round.lower()
    if "group" in lower:
        group_match = re.search(r"group\s+([a-l])", lower)
        return "Group Stage", group_match.group(1).upper() if group_match else None

    for key, label in ROUND_MAP.items():
        if key in lower:
            return label, None

    return raw_round, None


def resolve_stadium(venue: dict[str, Any] | None, venue_map: dict[str, Any]) -> tuple[str | None, str]:
    if not venue:
        return None, "America/New_York"

    venue_name = normalize(venue.get("name") or "")
    venue_city = normalize(venue.get("city") or "")
    haystack = f"{venue_name} {venue_city}"

    for entry in venue_map.values():
        aliases = [normalize(alias) for alias in entry.get("aliases", [])]
        if any(alias in haystack for alias in aliases):
            return entry["stadiumId"], entry["timezone"]

    return None, "America/New_York"


def fixture_note(fixture_id: int) -> str:
    return f"apiFixture:{fixture_id}"


def find_existing_match(
    existing_matches: list[dict[str, Any]],
    fixture_id: int,
    home_id: str,
    away_id: str,
    date: str,
) -> dict[str, Any] | None:
    note = fixture_note(fixture_id)
    for match in existing_matches:
        if match.get("notes") == note:
            return match
    for match in existing_matches:
        if (
            match.get("homeTeamId") == home_id
            and match.get("awayTeamId") == away_id
            and match.get("date") == date
        ):
            return match
    return None


def local_datetime(fixture_date: str, timezone_name: str) -> tuple[str, str]:
    dt = datetime.fromisoformat(fixture_date.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone(ZoneInfo(timezone_name))
    return local.strftime("%Y-%m-%d"), local.strftime("%H:%M")


def transform_fixture(
    item: dict[str, Any],
    team_map: dict[str, str],
    team_groups: dict[str, str],
    venue_map: dict[str, Any],
    existing_matches: list[dict[str, Any]],
    next_seq: list[int],
) -> dict[str, Any] | None:
    fixture = item.get("fixture") or {}
    teams = item.get("teams") or {}
    goals = item.get("goals") or {}
    league = item.get("league") or {}

    api_home_id = str((teams.get("home") or {}).get("id", ""))
    api_away_id = str((teams.get("away") or {}).get("id", ""))
    home_id = team_map.get(api_home_id)
    away_id = team_map.get(api_away_id)

    if not home_id or not away_id:
        home_name = (teams.get("home") or {}).get("name", api_home_id)
        away_name = (teams.get("away") or {}).get("name", api_away_id)
        print(f"  skip fixture {fixture.get('id')}: unmapped teams ({home_name} vs {away_name})")
        return None

    stadium_id, tz = resolve_stadium(item.get("venue"), venue_map)
    date, time = local_datetime(fixture.get("date", ""), tz)

    round_label, parsed_group = parse_round(league.get("round"))
    group = parsed_group or team_groups.get(home_id) or team_groups.get(away_id)

    status_short = (fixture.get("status") or {}).get("short", "NS")
    status = STATUS_MAP.get(status_short, "Scheduled")

    home_score = goals.get("home")
    away_score = goals.get("away")
    if status == "Scheduled":
        home_score = None
        away_score = None

    fixture_id = int(fixture.get("id"))
    existing = find_existing_match(existing_matches, fixture_id, home_id, away_id, date)
    match_id = existing["id"] if existing else f"match-{next_seq[0]:03d}"
    if not existing:
        next_seq[0] += 1

    match: dict[str, Any] = {
        "id": match_id,
        "date": date,
        "time": time,
        "timezone": tz,
        "homeTeamId": home_id,
        "awayTeamId": away_id,
        "homeScore": home_score,
        "awayScore": away_score,
        "status": status,
        "round": round_label,
        "notes": fixture_note(fixture_id),
    }

    if group:
        match["group"] = group
    if stadium_id:
        match["stadiumId"] = stadium_id

    referee = (fixture.get("referee") or "").strip()
    if referee:
        match["referee"] = referee

    return match


def transform_standings(payload: dict[str, Any], team_map: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for block in payload.get("response") or []:
        for group_table in block.get("league", {}).get("standings") or []:
            for entry in group_table:
                api_team_id = str((entry.get("team") or {}).get("id", ""))
                local_team_id = team_map.get(api_team_id)
                if not local_team_id:
                    continue

                all_stats = entry.get("all") or {}
                group_name = (entry.get("group") or "").replace("Group ", "").strip() or "?"

                rows.append(
                    {
                        "group": group_name,
                        "teamId": local_team_id,
                        "played": all_stats.get("played", 0),
                        "won": all_stats.get("win", 0),
                        "drawn": all_stats.get("draw", 0),
                        "lost": all_stats.get("lose", 0),
                        "goalsFor": all_stats.get("goals", {}).get("for", 0),
                        "goalsAgainst": all_stats.get("goals", {}).get("against", 0),
                        "goalDifference": entry.get("goalsDiff", 0),
                        "points": entry.get("points", 0),
                    }
                )

    rows.sort(key=lambda row: (row["group"], -row["points"], -row["goalDifference"]))
    return rows


def bump_data_version() -> bool:
    text = DATA_LOADER_PATH.read_text(encoding="utf-8")
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    updated, count = re.subn(
        r"const DATA_VERSION = '[^']+';",
        f"const DATA_VERSION = '{version}';",
        text,
        count=1,
    )
    if count != 1:
        print("WARNING: Could not update DATA_VERSION in dataLoader.ts")
        return False
    DATA_LOADER_PATH.write_text(updated, encoding="utf-8")
    print(f"Updated DATA_VERSION -> {version}")
    return True


def main() -> int:
    api_key = os.environ.get("APIFOOTBALL_KEY", "").strip()
    if not api_key:
        print("ERROR: Set APIFOOTBALL_KEY environment variable.", file=sys.stderr)
        return 1

    dry_run = os.environ.get("DRY_RUN", "").strip() == "1"
    skip_version_bump = os.environ.get("SKIP_VERSION_BUMP", "").strip() == "1"

    team_map = {str(k): v for k, v in load_json(TEAM_MAP_PATH).items()}
    if not team_map:
        print("ERROR: scripts/team-map.json is empty. Run: python scripts/build_team_map.py", file=sys.stderr)
        return 1

    venue_map = load_json(VENUE_MAP_PATH)
    teams = load_json(TEAMS_PATH)
    team_groups = {team["id"]: team.get("group") for team in teams if team.get("group")}
    existing_matches = load_json(MATCHES_PATH) if MATCHES_PATH.exists() else []

    existing_ids = [int(m["id"].split("-")[1]) for m in existing_matches if re.match(r"match-\d+", m.get("id", ""))]
    next_seq = [max(existing_ids, default=0) + 1]

    print("Fetching fixtures...")
    fixtures_payload = api_get(
        "/fixtures",
        api_key,
        {"league": LEAGUE_ID, "season": SEASON},
    )

    print("Fetching standings...")
    standings_payload = api_get(
        "/standings",
        api_key,
        {"league": LEAGUE_ID, "season": SEASON},
    )

    matches: list[dict[str, Any]] = []
    skipped = 0

    for item in fixtures_payload.get("response") or []:
        transformed = transform_fixture(
            item,
            team_map,
            team_groups,
            venue_map,
            existing_matches,
            next_seq,
        )
        if transformed:
            matches.append(transformed)
        else:
            skipped += 1

    matches.sort(key=lambda match: (match["date"], match["time"], match["id"]))
    standings = transform_standings(standings_payload, team_map)

    print(f"Matches: {len(matches)} synced, {skipped} skipped")
    print(f"Standings rows: {len(standings)}")

    if dry_run:
        print("DRY_RUN=1 -> no files written")
        return 0

    if not matches:
        print("ERROR: No matches produced. Check team-map.json and API access.", file=sys.stderr)
        return 1

    save_json(MATCHES_PATH, matches)
    save_json(STANDINGS_PATH, standings)
    print(f"Wrote {MATCHES_PATH.relative_to(ROOT)}")
    print(f"Wrote {STANDINGS_PATH.relative_to(ROOT)}")

    if not skip_version_bump:
        bump_data_version()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
