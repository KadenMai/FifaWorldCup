"""Shared logic: update a match score and recompute standings."""

from __future__ import annotations

import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

VALID_STATUSES = {"Scheduled", "Live", "Finished", "Postponed", "Cancelled"}


def empty_standing(group: str, team_id: str) -> dict[str, Any]:
    return {
        "group": group,
        "teamId": team_id,
        "played": 0,
        "won": 0,
        "drawn": 0,
        "lost": 0,
        "goalsFor": 0,
        "goalsAgainst": 0,
        "goalDifference": 0,
        "points": 0,
    }


def compute_standings_from_matches(teams: list[dict], matches: list[dict]) -> list[dict]:
    stats: dict[str, dict] = {}

    for team in teams:
        group = team.get("group")
        if not group:
            continue
        stats[team["id"]] = empty_standing(group, team["id"])

    for match in matches:
        if (
            not match.get("group")
            or match.get("status") != "Finished"
            or match.get("homeScore") is None
            or match.get("awayScore") is None
        ):
            continue

        home = stats.get(match["homeTeamId"])
        away = stats.get(match["awayTeamId"])
        if not home or not away or home["group"] != match["group"] or away["group"] != match["group"]:
            continue

        home_score = int(match["homeScore"])
        away_score = int(match["awayScore"])

        home["played"] += 1
        away["played"] += 1
        home["goalsFor"] += home_score
        home["goalsAgainst"] += away_score
        away["goalsFor"] += away_score
        away["goalsAgainst"] += home_score

        if home_score > away_score:
            home["won"] += 1
            home["points"] += 3
            away["lost"] += 1
        elif home_score < away_score:
            away["won"] += 1
            away["points"] += 3
            home["lost"] += 1
        else:
            home["drawn"] += 1
            away["drawn"] += 1
            home["points"] += 1
            away["points"] += 1

        home["goalDifference"] = home["goalsFor"] - home["goalsAgainst"]
        away["goalDifference"] = away["goalsFor"] - away["goalsAgainst"]

    rows = list(stats.values())
    team_names = {team["id"]: team.get("name", team["id"]) for team in teams}

    def sort_key(row: dict) -> tuple:
        return (
            row["group"],
            -row["points"],
            -row["goalDifference"],
            -row["goalsFor"],
            team_names.get(row["teamId"], row["teamId"]),
        )

    rows.sort(key=sort_key)
    return rows


def bump_edition_meta(meta: dict[str, Any]) -> tuple[dict[str, Any], str]:
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    updated = {**meta, "dataVersion": version}
    return updated, version


def bump_data_version(data_loader_source: str) -> str:
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    updated, count = re.subn(
        r"const DATA_VERSION = '[^']+';",
        f"const DATA_VERSION = '{version}';",
        data_loader_source,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Could not update DATA_VERSION in dataLoader.ts")
    return updated


def apply_match_update(
    matches: list[dict],
    teams: list[dict],
    edition_meta: dict[str, Any],
    *,
    match_id: str,
    home_score: int | None,
    away_score: int | None,
    status: str,
) -> dict[str, Any]:
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Use one of: {', '.join(sorted(VALID_STATUSES))}")

    updated_matches = deepcopy(matches)
    target = next((match for match in updated_matches if match.get("id") == match_id), None)
    if not target:
        raise ValueError(f"Match not found: {match_id}")

    if status == "Scheduled":
        target["homeScore"] = None
        target["awayScore"] = None
    else:
        if home_score is None or away_score is None:
            raise ValueError("homeScore and awayScore are required unless status is Scheduled")
        target["homeScore"] = int(home_score)
        target["awayScore"] = int(away_score)

    target["status"] = status

    standings = compute_standings_from_matches(teams, updated_matches)
    new_meta, data_version = bump_edition_meta(edition_meta)

    return {
        "match": target,
        "matches": updated_matches,
        "standings": standings,
        "edition_meta": new_meta,
        "data_version": data_version,
    }
