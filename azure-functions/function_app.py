import json
import os
import sys
from pathlib import Path

import azure.functions as func

SHARED_DIR = Path(__file__).resolve().parent / "shared"
sys.path.insert(0, str(SHARED_DIR))

from github_store import GitHubStore  # noqa: E402
from score_update_lib import apply_match_update  # noqa: E402

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

MATCHES_PATH = "public/data/matches.json"
STANDINGS_PATH = "public/data/standings.json"
TEAMS_PATH = "public/data/teams.json"
DATA_LOADER_PATH = "src/data/dataLoader.ts"


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

    if not match_id:
        return _json_response({"error": "matchId is required"}, status_code=400)

    try:
        store = _store()
        matches, matches_sha = store.read_json(MATCHES_PATH)
        teams, _ = store.read_json(TEAMS_PATH)
        loader_text, loader_sha = store.read_text(DATA_LOADER_PATH)

        result = apply_match_update(
            matches,
            teams,
            loader_text,
            match_id=match_id,
            home_score=home_score,
            away_score=away_score,
            status=status,
        )

        commit_msg = f"chore(data): update {match_id} ({result['match']['homeScore']}-{result['match']['awayScore']} {status})"

        store.write_json(MATCHES_PATH, result["matches"], matches_sha, commit_msg)
        _, standings_sha = store.read_json(STANDINGS_PATH)
        store.write_json(STANDINGS_PATH, result["standings"], standings_sha, commit_msg)
        _, loader_sha = store.read_text(DATA_LOADER_PATH)
        store.write_text(DATA_LOADER_PATH, result["data_loader_ts"], loader_sha, commit_msg)

        return _json_response(
            {
                "ok": True,
                "match": result["match"],
                "standingsUpdated": len(result["standings"]),
            }
        )
    except ValueError as error:
        return _json_response({"error": str(error)}, status_code=400)
    except Exception as error:  # noqa: BLE001
        return _json_response({"error": str(error)}, status_code=500)
