import json
import os
import re
import sys
from pathlib import Path

import azure.functions as func

SHARED_DIR = Path(__file__).resolve().parent / "shared"
sys.path.insert(0, str(SHARED_DIR))

from github_store import GitHubStore  # noqa: E402
from score_update_lib import apply_match_update  # noqa: E402

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def _edition_paths(edition: str) -> dict[str, str]:
    base = f"public/data/{edition}"
    return {
        "matches": f"{base}/matches.json",
        "standings": f"{base}/standings.json",
        "teams": f"{base}/teams.json",
        "meta": f"{base}/meta.json",
    }


def _resolve_edition(body: dict | None) -> str | None:
    raw = str((body or {}).get("edition") or "").strip()
    if re.fullmatch(r"\d{4}", raw):
        return raw
    fallback = os.environ.get("DEFAULT_EDITION", "2026").strip()
    return fallback if re.fullmatch(r"\d{4}", fallback) else None


def _check_admin(req: func.HttpRequest) -> bool:
    expected = os.environ.get("ADMIN_API_KEY", "").strip()
    if not expected:
        return False
    provided = req.headers.get("X-Admin-Key", "").strip()
    return provided == expected and bool(provided)


def _json_response(payload: dict, status_code: int = 200) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(payload, ensure_ascii=False),
        status_code=status_code,
        mimetype="application/json",
    )


def _store() -> GitHubStore:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repo = os.environ.get("GITHUB_REPO", "").strip()
    branch = os.environ.get("GITHUB_BRANCH", "main").strip()
    if not token or not repo:
        raise RuntimeError("Missing GITHUB_TOKEN or GITHUB_REPO app settings")
    return GitHubStore(token=token, repo=repo, branch=branch)


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    return _json_response({"ok": True, "service": "fifaworldcup-score-api"})


@app.route(route="update-match", methods=["POST"])
def update_match(req: func.HttpRequest) -> func.HttpResponse:
    if not _check_admin(req):
        return _json_response({"error": "Unauthorized"}, status_code=401)

    try:
        body = req.get_json()
    except ValueError:
        return _json_response({"error": "Invalid JSON body"}, status_code=400)

    match_id = (body or {}).get("matchId")
    status = (body or {}).get("status", "Finished")
    home_score = (body or {}).get("homeScore")
    away_score = (body or {}).get("awayScore")
    edition = _resolve_edition(body)

    if not edition:
        return _json_response({"error": "edition is required (e.g. 2026)"}, status_code=400)
    if not match_id:
        return _json_response({"error": "matchId is required"}, status_code=400)

    paths = _edition_paths(edition)

    try:
        store = _store()
        matches, matches_sha = store.read_json(paths["matches"])
        teams, _ = store.read_json(paths["teams"])
        meta, meta_sha = store.read_json(paths["meta"])

        result = apply_match_update(
            matches,
            teams,
            meta,
            match_id=match_id,
            home_score=home_score,
            away_score=away_score,
            status=status,
        )

        commit_msg = (
            f"chore(data): update {edition} {match_id} "
            f"({result['match']['homeScore']}-{result['match']['awayScore']} {status})"
        )

        store.write_json(paths["matches"], result["matches"], matches_sha, commit_msg)
        _, standings_sha = store.read_json(paths["standings"])
        store.write_json(paths["standings"], result["standings"], standings_sha, commit_msg)
        store.write_json(paths["meta"], result["edition_meta"], meta_sha, commit_msg)

        return _json_response(
            {
                "ok": True,
                "match": result["match"],
                "standingsUpdated": len(result["standings"]),
                "edition": edition,
                "dataVersion": result["data_version"],
            }
        )
    except ValueError as error:
        return _json_response({"error": str(error)}, status_code=400)
    except Exception as error:  # noqa: BLE001
        return _json_response({"error": str(error)}, status_code=500)
