import { editionDataPaths } from '../lib/dataPaths';
import { R2Store } from '../lib/r2Store';

function resolveEdition(env: Env): string {
  const raw = env.DEFAULT_EDITION?.trim() ?? '';
  return /^\d{4}$/.test(raw) ? raw : '2026';
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const adminKey = env.ADMIN_API_KEY?.trim() ?? '';
  const edition = resolveEdition(env);
  const paths = editionDataPaths(edition);

  const providedAdmin = request.headers.get('X-Admin-Key')?.trim() ?? '';
  const isAdmin = Boolean(adminKey) && providedAdmin === adminKey;

  const hasR2Binding = Boolean(env.DATA_BUCKET);
  const hasAdminApiKey = Boolean(adminKey);

  let r2Works = false;
  let r2Error: string | undefined;
  let matchesObjectSize: number | undefined;

  if (hasR2Binding) {
    try {
      const store = new R2Store(env.DATA_BUCKET);
      const text = await store.readText(paths.matches);
      if (text == null) {
        r2Error = `Object not found: ${paths.matches} — run npm run seed:r2 to upload initial data`;
      } else {
        r2Works = true;
        matchesObjectSize = text.length;
      }
    } catch (error) {
      r2Error = error instanceof Error ? error.message : 'R2 read failed';
    }
  } else {
    r2Error = 'Missing DATA_BUCKET R2 binding';
  }

  const scoreApiReady = hasR2Binding && r2Works && hasAdminApiKey;

  const payload: Record<string, unknown> = {
    ok: true,
    service: 'fifaworldcup-score-api',
    storage: 'r2',
    scoreApiReady,
    hasR2Binding,
    r2Works,
    r2Error,
    hasAdminApiKey,
    edition,
    matchesKey: paths.matches,
    matchesObjectSize,
  };

  if (isAdmin) {
    payload.adminHint = 'Score updates write to R2; reads served via GET /api/data/*';
  }

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
