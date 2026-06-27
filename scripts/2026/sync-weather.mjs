/**
 * Sync weather to local JSON files (git / dev).
 * Production uses POST /api/sync-weather or the weather-cron Worker → R2.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWeatherData, runWeatherSync } from '../../shared/weatherSync.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const EDITION = '2026';
const dataDir = path.join(ROOT, 'public/data', EDITION);

const FORCE = process.argv.includes('--force');
const MIGRATE = !process.argv.includes('--no-migrate');

function loadTimezoneMap() {
  const venueMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'venue-map.json'), 'utf8'));
  return Object.fromEntries(Object.values(venueMap).map((v) => [v.stadiumId, v.timezone]));
}

function bumpEditionMeta() {
  const metaPath = path.join(dataDir, 'meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 12);
  meta.dataVersion = stamp;
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return stamp;
}

function migrateEmbeddedMatchWeather(matches, weather) {
  let changed = false;
  for (const match of matches) {
    if (match.weatherAtKickoff) {
      weather.matches[match.id] = match.weatherAtKickoff;
      delete match.weatherAtKickoff;
      changed = true;
    }
  }
  return changed;
}

async function main() {
  const stadiumsPath = path.join(dataDir, 'stadiums.json');
  const matchesPath = path.join(dataDir, 'matches.json');
  const weatherPath = path.join(dataDir, 'weather.json');

  const stadiums = JSON.parse(fs.readFileSync(stadiumsPath, 'utf8'));
  let matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

  let existingRaw = null;
  if (fs.existsSync(weatherPath)) {
    existingRaw = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
  }
  const existingWeather = normalizeWeatherData(existingRaw);

  if (MIGRATE) {
    const migrated = migrateEmbeddedMatchWeather(matches, existingWeather);
    if (migrated) {
      fs.writeFileSync(matchesPath, `${JSON.stringify(matches, null, 2)}\n`);
      console.log('Migrated weatherAtKickoff from matches.json → weather.json');
    }
  }

  const { weather, stats, skipped } = await runWeatherSync({
    stadiums,
    matches,
    timezoneByStadium: loadTimezoneMap(),
    existingWeather,
    force: FORCE,
  });

  if (skipped) return;

  fs.writeFileSync(weatherPath, `${JSON.stringify(weather, null, 2)}\n`);
  const version = bumpEditionMeta();

  console.log(
    `\nDone. Stadiums=${stats.stadiumUpdated}, matches updated=${stats.matchUpdated}, skipped=${stats.matchSkipped}, dataVersion=${version}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
