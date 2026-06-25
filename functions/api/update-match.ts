import { GitHubStore } from '../lib/githubStore';
import { applyMatchUpdate, type MatchRecord, type MatchStatus, type TeamRecord } from '../lib/scoreUpdate';

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
  ADMIN_API_KEY: string;
}

const MATCHES_PATH = 'public/data/matches.json';
const STANDINGS_PATH = 'public/data/standings.json';
const TEAMS_PATH = 'public/data/teams.json';
const DATA_LOADER_PATH = 'src/data/dataLoader.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function checkAdmin(request: Request, env: Env): boolean {
  const expected = env.ADMIN_API_KEY?.trim();
  if (!expected) return false;
  const provided = request.headers.get('X-Admin-Key')?.trim() ?? '';
  return Boolean(provided) && provided === expected;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!checkAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!env.GITHUB_TOKEN?.trim() || !env.GITHUB_REPO?.trim()) {
    return jsonResponse({ error: 'Server missing GITHUB_TOKEN or GITHUB_REPO' }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const matchId = typeof body.matchId === 'string' ? body.matchId : '';
  const status = (typeof body.status === 'string' ? body.status : 'Finished') as MatchStatus;
  const homeScore = body.homeScore as number | null | undefined;
  const awayScore = body.awayScore as number | null | undefined;

  if (!matchId) {
    return jsonResponse({ error: 'matchId is required' }, 400);
  }

  try {
    const store = new GitHubStore(
      env.GITHUB_TOKEN.trim(),
      env.GITHUB_REPO.trim(),
      env.GITHUB_BRANCH?.trim() || 'main'
    );

    const { data: matches, sha: matchesSha } = await store.readJson<MatchRecord[]>(MATCHES_PATH);
    const { data: teams } = await store.readJson<TeamRecord[]>(TEAMS_PATH);
    const loaderFile = await store.readText(DATA_LOADER_PATH);

    const result = applyMatchUpdate(matches, teams, loaderFile.content, {
      matchId,
      homeScore,
      awayScore,
      status,
    });

    const commitMsg = `chore(data): update ${matchId} (${result.match.homeScore}-${result.match.awayScore} ${status})`;

    await store.writeJson(MATCHES_PATH, result.matches, matchesSha, commitMsg);
    const { sha: standingsSha } = await store.readJson(STANDINGS_PATH);
    await store.writeJson(STANDINGS_PATH, result.standings, standingsSha, commitMsg);
    const loaderSha = (await store.readText(DATA_LOADER_PATH)).sha;
    await store.writeText(DATA_LOADER_PATH, result.dataLoaderTs, loaderSha, commitMsg);

    return jsonResponse({
      ok: true,
      match: result.match,
      standings: result.standings,
      dataVersion: result.dataVersion,
      standingsUpdated: result.standings.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message.includes('not found') ||
      message.includes('required') ||
      message.includes('Invalid')
        ? 400
        : 500;
    return jsonResponse({ error: message }, statusCode);
  }
};
