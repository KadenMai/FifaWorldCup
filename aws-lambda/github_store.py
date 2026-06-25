"""Read and write repo JSON files via GitHub REST API."""

from __future__ import annotations

import base64
import json
from typing import Any
from urllib.parse import quote

import requests


class GitHubStore:
    def __init__(self, token: str, repo: str, branch: str = "main") -> None:
        self.token = token
        self.repo = repo
        self.branch = branch
        self.api = f"https://api.github.com/repos/{repo}"
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        )

    def read_text(self, path: str) -> tuple[str, str]:
        encoded_path = quote(path, safe="/")
        response = self.session.get(
            f"{self.api}/contents/{encoded_path}",
            params={"ref": self.branch},
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        content = base64.b64decode(payload["content"]).decode("utf-8")
        return content, payload["sha"]

    def read_json(self, path: str) -> tuple[Any, str]:
        text, sha = self.read_text(path)
        return json.loads(text), sha

    def write_text(self, path: str, content: str, sha: str, message: str) -> None:
        encoded_path = quote(path, safe="/")
        response = self.session.put(
            f"{self.api}/contents/{encoded_path}",
            json={
                "message": message,
                "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
                "sha": sha,
                "branch": self.branch,
            },
            timeout=60,
        )
        response.raise_for_status()

    def write_json(self, path: str, data: Any, sha: str, message: str) -> None:
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        self.write_text(path, text, sha, message)
