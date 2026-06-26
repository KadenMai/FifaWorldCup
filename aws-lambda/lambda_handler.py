"""
AWS Lambda handler — remote score updates via GitHub API.

Upload a .zip (not a single file). The zip must contain:
  lambda_handler.py, github_store.py, score_update_lib.py, requests/ (+ deps)

Easiest: run package.ps1 in this folder, then upload lambda.zip.

Handler setting in AWS: lambda_handler.handler

Environment variables:
  GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH (default main), ADMIN_API_KEY
"""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

from github_store import GitHubStore
from score_update_lib import apply_match_update


def _edition_paths(edition: str) -> dict[str, str]:
    base = f"public/data/{edition}"
    return {
        "matches": f"{base}/matches.json",
        "standings": f"{base}/standings.json",
        "teams": f"{base}/teams.json",
        "meta": f"{base}/meta.json",
    }


def _resolve_edition(body: dict[str, Any]) -> str | None:
    raw = str(body.get("edition") or "").strip()
    if re.fullmatch(r"\d{4}", raw):
        return raw
    fallback = os.environ.get("DEFAULT_EDITION", "2026").strip()
    return fallback if re.fullmatch(r"\d{4}", fallback) else None


def _get_method(event: dict[str, Any]) -> str:
    ctx = event.get("requestContext") or {}
    if "http" in ctx:
        return str(ctx["http"].get("method", "GET")).upper()
    return str(event.get("httpMethod", "GET")).upper()


def _get_path(event: dict[str, Any]) -> str:
    return str(event.get("rawPath") or event.get("path") or "/").lower()


def _get_headers(event: dict[str, Any]) -> dict[str, str]:
    headers = event.get("headers") or {}
    return {str(key).lower(): str(value) for key, value in headers.items()}


def _parse_body(event: dict[str, Any]) -> dict[str, Any]:
    raw = event.get("body")
    if raw is None:
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    if not raw:
        return {}
    parsed = json.loads(raw)
    if not isinstance(parsed, dict):
        raise ValueError("JSON body must be an object")
    return parsed


def _response(status_code: int, payload: dict[str, Any] | str) -> dict[str, Any]:
    body = payload if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False)
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Admin-Key",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": body,
    }


def _check_admin(event: dict[str, Any]) -> bool:
    expected = os.environ.get("ADMIN_API_KEY", "").strip()
    if not expected:
        return False
    provided = _get_headers(event).get("x-admin-key", "").strip()
    return bool(provided) and provided == expected


def _store() -> GitHubStore:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repo = os.environ.get("GITHUB_REPO", "").strip()
    branch = os.environ.get("GITHUB_BRANCH", "main").strip()
    if not token or not repo:
        raise RuntimeError("Missing GITHUB_TOKEN or GITHUB_REPO environment variables")
    return GitHubStore(token=token, repo=repo, branch=branch)


def _is_health(event: dict[str, Any]) -> bool:
    if _get_method(event) != "GET":
        return False
    path = _get_path(event)
    return path in ("/", "/health") or path.endswith("/health")


def _is_update(event: dict[str, Any]) -> bool:
    if _get_method(event) != "POST":
        return False
    path = _get_path(event)
    return path in ("/", "/update-match") or "update-match" in path


def _handle_update_match(event: dict[str, Any]) -> dict[str, Any]:
    if not _check_admin(event):
        return _response(401, {"error": "Unauthorized"})

    try:
        body = _parse_body(event)
    except (json.JSONDecodeError, ValueError) as error:
        return _response(400, {"error": str(error)})

    match_id = body.get("matchId")
    status = body.get("status", "Finished")
    home_score = body.get("homeScore")
    away_score = body.get("awayScore")
    edition = _resolve_edition(body)

    if not edition:
        return _response(400, {"error": "edition is required (e.g. 2026)"})
    if not match_id:
        return _response(400, {"error": "matchId is required"})

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

        return _response(
            200,
            {
                "ok": True,
                "match": result["match"],
                "standingsUpdated": len(result["standings"]),
                "edition": edition,
                "dataVersion": result["data_version"],
            },
        )
    except ValueError as error:
        return _response(400, {"error": str(error)})
    except Exception as error:  # noqa: BLE001
        return _response(500, {"error": str(error)})


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    method = _get_method(event)

    if method == "OPTIONS":
        return _response(204, "")

    if _is_health(event):
        return _response(200, {"ok": True, "service": "fifaworldcup-score-api"})

    if _is_update(event):
        return _handle_update_match(event)

    return _response(404, {"error": "Not found"})
