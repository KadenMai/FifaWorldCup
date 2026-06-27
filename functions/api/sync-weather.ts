import { syncWeatherToR2 } from '../lib/weatherSync';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Cron-Secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  const adminKey = env.ADMIN_API_KEY?.trim();
  const cronSecret = env.WEATHER_CRON_SECRET?.trim();
  const providedAdmin = request.headers.get('X-Admin-Key')?.trim() ?? '';
  const providedCron = request.headers.get('X-Cron-Secret')?.trim() ?? '';
  if (adminKey && providedAdmin === adminKey) return true;
  if (cronSecret && providedCron === cronSecret) return true;
  return false;
}

function resolveEdition(raw: unknown, env: Env): string | null {
  const edition = typeof raw === 'string' ? raw.trim() : '';
  if (/^\d{4}$/.test(edition)) return edition;
  const fallback = env.DEFAULT_EDITION?.trim() ?? '';
  return /^\d{4}$/.test(fallback) ? fallback : null;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

/** Fetch Open-Meteo and write weather.json + meta.json to R2. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const edition = resolveEdition(body.edition, env);
  if (!edition) {
    return jsonResponse({ error: 'edition is required (e.g. 2026)' }, 400);
  }

  try {
    const result = await syncWeatherToR2(env, edition, {
      force: body.force === true,
    });
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
};
