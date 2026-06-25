interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  new Response(
    JSON.stringify({
      ok: true,
      service: 'fifaworldcup-score-api',
      githubConfigured: Boolean(env.GITHUB_TOKEN && env.GITHUB_REPO),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
