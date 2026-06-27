import { editionDataPaths } from './dataPaths';
import { R2Store } from './r2Store';
// @ts-expect-error shared ESM module (bundled by wrangler)
import { hasRemainingMatches, normalizeWeatherData, runWeatherSync } from '../../shared/weatherSync.mjs';

/** Stadium id → IANA timezone (mirrors scripts/2026/venue-map.json). */
const STADIUM_TIMEZONES: Record<string, string> = {
  azteca: 'America/Mexico_City',
  akron: 'America/Mexico_City',
  bbva: 'America/Monterrey',
  'bmo-field': 'America/Toronto',
  'bc-place': 'America/Vancouver',
  'sofi-stadium': 'America/Los_Angeles',
  'levis-stadium': 'America/Los_Angeles',
  'metlife-stadium': 'America/New_York',
  'gillette-stadium': 'America/New_York',
  'mercedes-benz-stadium': 'America/New_York',
  'hard-rock-stadium': 'America/New_York',
  'lumen-field': 'America/Los_Angeles',
  'nrg-stadium': 'America/Chicago',
  'att-stadium': 'America/Chicago',
  'lincoln-financial': 'America/New_York',
  'arrowhead-stadium': 'America/Chicago',
};

interface EditionMetaFile {
  dataVersion: string;
  id?: string;
  name?: string;
  hosts?: string;
}

function bumpEditionMeta(meta: EditionMetaFile) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 12);
  return { ...meta, dataVersion: stamp };
}

export async function syncWeatherToR2(
  env: Env,
  edition: string,
  options: { force?: boolean } = {},
): Promise<{ ok: boolean; skipped?: boolean; stats?: Record<string, number>; dataVersion?: string }> {
  if (!env.DATA_BUCKET) {
    throw new Error('Missing DATA_BUCKET R2 binding');
  }

  const store = new R2Store(env.DATA_BUCKET);
  const paths = editionDataPaths(edition);
  const weatherKey = `data/${edition}/weather.json`;

  const [stadiums, matches, meta] = await Promise.all([
    store.readJson<Record<string, unknown>[]>(paths.stadiums),
    store.readJson<Record<string, unknown>[]>(paths.matches),
    store.readJson<EditionMetaFile>(paths.meta),
  ]);

  let existingWeather = normalizeWeatherData(null);
  try {
    existingWeather = normalizeWeatherData(await store.readJson(weatherKey));
  } catch {
    // first run — no weather file yet
  }

  if (!hasRemainingMatches(matches as { status: string }[])) {
    return { ok: true, skipped: true };
  }

  const logs: string[] = [];
  const { weather, stats, skipped } = await runWeatherSync({
    stadiums: stadiums as Parameters<typeof runWeatherSync>[0]['stadiums'],
    matches: matches as Parameters<typeof runWeatherSync>[0]['matches'],
    timezoneByStadium: STADIUM_TIMEZONES,
    existingWeather,
    force: options.force ?? false,
    delayMs: 100,
    log: (msg) => logs.push(msg),
  });

  if (skipped) {
    return { ok: true, skipped: true };
  }

  const updatedMeta = bumpEditionMeta(meta);
  await store.writeJson(weatherKey, weather);
  await store.writeJson(paths.meta, updatedMeta);

  console.log(logs.join('\n'));

  return {
    ok: true,
    stats,
    dataVersion: updatedMeta.dataVersion,
  };
}
