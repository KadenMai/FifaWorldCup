/// <reference types="@cloudflare/workers-types" />

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
  ADMIN_API_KEY: string;
}
