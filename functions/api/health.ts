import { GitHubStore } from '../lib/githubStore';

interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  ADMIN_API_KEY?: string;
  DEFAULT_EDITION?: string;
}

function resolveEdition(env: Env): string {
  const raw = env.DEFAULT_EDITION?.trim() ?? '';
  return /^\d{4}$/.test(raw) ? raw : '2026';
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const token = env.GITHUB_TOKEN?.trim() ?? '';
  const repo = env.GITHUB_REPO?.trim() ?? '';
  const branch = env.GITHUB_BRANCH?.trim() || 'main';
  const adminKey = env.ADMIN_API_KEY?.trim() ?? '';
  const edition = resolveEdition(env);
  const matchesPath = `public/data/${edition}/matches.json`;

  const providedAdmin = request.headers.get('X-Admin-Key')?.trim() ?? '';
  const isAdmin = Boolean(adminKey) && providedAdmin === adminKey;

  const hasGithubToken = Boolean(token);
  const hasGithubRepo = Boolean(repo);
  const hasGithubBranch = Boolean(env.GITHUB_BRANCH?.trim());
  const hasAdminApiKey = Boolean(adminKey);
  const githubConfigured = hasGithubToken && hasGithubRepo;

  let githubTokenWorks = false;
  let githubError: string | undefined;
  let matchesFileSha: string | undefined;

  if (githubConfigured) {
    try {
      const store = new GitHubStore(token, repo, branch);
      const file = await store.readText(matchesPath);
      githubTokenWorks = true;
      matchesFileSha = file.sha;
    } catch (error) {
      githubError = error instanceof Error ? error.message : 'GitHub token test failed';
    }
  } else if (!hasGithubToken) {
    githubError = 'Missing GITHUB_TOKEN';
  } else if (!hasGithubRepo) {
    githubError = 'Missing GITHUB_REPO';
  }

  const scoreApiReady = githubConfigured && githubTokenWorks && hasAdminApiKey;

  const payload: Record<string, unknown> = {
    ok: true,
    service: 'fifaworldcup-score-api',
    scoreApiReady,
    githubConfigured,
    githubTokenWorks,
    githubError,
    hasGithubToken,
    hasGithubRepo,
    hasGithubBranch,
    hasAdminApiKey,
    githubRepo: repo || undefined,
    githubBranch: branch,
    edition,
    matchesFileSha,
    githubTokenLength: token ? token.length : 0,
  };

  if (isAdmin && token) {
    payload.githubTokenPreview = token.slice(0, 100);
  } else if (token) {
    payload.githubTokenPreviewHint = 'Send header X-Admin-Key to see githubTokenPreview (first 100 chars)';
  }

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
