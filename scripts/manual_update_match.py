#!/usr/bin/env python3
"""
Update one match locally, recompute standings, bump DATA_VERSION.

Usage:
  python scripts/manual_update_match.py match-001 2 1 Finished
  python scripts/manual_update_match.py match-025 --status Scheduled

Then commit and push — GitHub Pages will redeploy.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "azure-functions" / "shared"))

from score_update_lib import apply_match_update  # noqa: E402

MATCHES_PATH = ROOT / "public" / "data" / "matches.json"
STANDINGS_PATH = ROOT / "public" / "data" / "standings.json"
TEAMS_PATH = ROOT / "public" / "data" / "teams.json"
DATA_LOADER_PATH = ROOT / "src" / "data" / "dataLoader.ts"


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Manually update a match score")
    parser.add_argument("match_id", help="e.g. match-001")
    parser.add_argument("home_score", nargs="?", type=int, help="Home goals")
    parser.add_argument("away_score", nargs="?", type=int, help="Away goals")
    parser.add_argument("status", nargs="?", default="Finished", help="Match status")
    parser.add_argument("--status", dest="status_opt", help="Override status")
    args = parser.parse_args()

    status = args.status_opt or args.status

    try:
        result = apply_match_update(
            load_json(MATCHES_PATH),
            load_json(TEAMS_PATH),
            DATA_LOADER_PATH.read_text(encoding="utf-8"),
            match_id=args.match_id,
            home_score=args.home_score,
            away_score=args.away_score,
            status=status,
        )
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    save_json(MATCHES_PATH, result["matches"])
    save_json(STANDINGS_PATH, result["standings"])
    DATA_LOADER_PATH.write_text(result["data_loader_ts"], encoding="utf-8")

    match = result["match"]
    print(f"Updated {match['id']}: {match['homeScore']} - {match['awayScore']} ({match['status']})")
    print(f"Wrote {MATCHES_PATH.name}, {STANDINGS_PATH.name}, dataLoader.ts")
    print("Next: git add, commit, push — GitHub Pages will redeploy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
