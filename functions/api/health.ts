interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  ADMIN_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  new Response(
    JSON.stringify({
      ok: true,
      service: 'fifaworldcup-score-api',
      githubConfigured: Boolean(env.GITHUB_TOKEN?.trim() && env.GITHUB_REPO?.trim()),
      hasGithubToken: Boolean(env.GITHUB_TOKEN?.trim()),
      hasGithubRepo: Boolean(env.GITHUB_REPO?.trim()),
      hasGithubBranch: Boolean(env.GITHUB_BRANCH?.trim()),
      hasAdminApiKey: Boolean(env.ADMIN_API_KEY?.trim()),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
