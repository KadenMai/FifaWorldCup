import { editionDataPaths } from '../lib/dataPaths';
import { R2Store } from '../lib/r2Store';
import { applyMatchUpdate, type MatchRecord, type MatchStatus, type TeamRecord } from '../lib/scoreUpdate';

interface EditionMetaFile {
  id: string;
  name: string;
  hosts: string;
  dataVersion: string;
}

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

function resolveEdition(raw: unknown, env: Env): string | null {
  const edition = typeof raw === 'string' ? raw.trim() : '';
  if (/^\d{4}$/.test(edition)) return edition;
  const fallback = env.DEFAULT_EDITION?.trim() ?? '';
  return /^\d{4}$/.test(fallback) ? fallback : null;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!checkAdmin(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!env.DATA_BUCKET) {
    return jsonResponse({ error: 'Server missing DATA_BUCKET R2 binding' }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const edition = resolveEdition(body.edition, env);
  const matchId = typeof body.matchId === 'string' ? body.matchId : '';
  const status = (typeof body.status === 'string' ? body.status : 'Finished') as MatchStatus;
  const homeScore = body.homeScore as number | null | undefined;
  const awayScore = body.awayScore as number | null | undefined;

  if (!edition) {
    return jsonResponse({ error: 'edition is required (e.g. 2026)' }, 400);
  }
  if (!matchId) {
    return jsonResponse({ error: 'matchId is required' }, 400);
  }

  const paths = editionDataPaths(edition);

  try {
    const store = new R2Store(env.DATA_BUCKET);

    const matches = await store.readJson<MatchRecord[]>(paths.matches);
    const teams = await store.readJson<TeamRecord[]>(paths.teams);
    const meta = await store.readJson<EditionMetaFile>(paths.meta);

    const result = applyMatchUpdate(matches, teams, meta, {
      matchId,
      homeScore,
      awayScore,
      status,
    });

    await store.writeJson(paths.matches, result.matches);
    await store.writeJson(paths.standings, result.standings);
    await store.writeJson(paths.meta, result.editionMeta);

    return jsonResponse({
      ok: true,
      match: result.match,
      standings: result.standings,
      dataVersion: result.dataVersion,
      edition,
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
