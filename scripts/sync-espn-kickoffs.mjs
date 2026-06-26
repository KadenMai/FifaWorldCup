/**
 * Sync group-stage kickoff times from ESPN (official broadcast partner schedule).
 * ESPN API: site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 *
 * Converts UTC kickoffs to local wall-clock date/time per stadium timezone.
 * Preserves scores, status, and other match fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EDITION = '2026';
const dataDir = path.join(ROOT, 'public/data', EDITION);

const ESPN_TEAM_MAP = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'team-map.json'), 'utf8'),
);
const VENUE_MAP = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'venue-map.json'), 'utf8'),
);

/** ESPN venue fullName → stadiumId */
const ESPN_VENUE_TO_STADIUM = {
  'Estadio Banorte': 'azteca',
  'Estadio Akron': 'akron',
  'Estadio BBVA': 'bbva',
  'BMO Field': 'bmo-field',
  'BC Place': 'bc-place',
  'SoFi Stadium': 'sofi-stadium',
  "Levi's Stadium": 'levis-stadium',
  'MetLife Stadium': 'metlife-stadium',
  'Gillette Stadium': 'gillette-stadium',
  'Mercedes-Benz Stadium': 'mercedes-benz-stadium',
  'Hard Rock Stadium': 'hard-rock-stadium',
  'Lumen Field': 'lumen-field',
  'NRG Stadium': 'nrg-stadium',
  'AT&T Stadium': 'att-stadium',
  'Lincoln Financial Field': 'lincoln-financial',
  'GEHA Field at Arrowhead Stadium': 'arrowhead-stadium',
};

const STADIUM_TIMEZONES = Object.fromEntries(
  Object.values(VENUE_MAP).map((v) => [v.stadiumId, v.timezone]),
);

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function utcToLocal(utcIso, timezone) {
  const date = new Date(utcIso);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  // en-CA gives YYYY-MM-DD; hour can be "24" at midnight in some locales — normalize
  let hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
    timezone,
  };
}

async function fetchEspnGroupStage() {
  const cachePath = path.join(__dirname, 'espn-group.json');
  if (process.argv.includes('--use-cache') && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const dates = [];
  for (let d = new Date('2026-06-11'); d <= new Date('2026-06-27'); d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  const events = [];
  for (const date of dates) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${date}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN fetch failed for ${date}: ${res.status}`);
    const data = await res.json();
    if (data.events?.length) events.push(...data.events);
    await new Promise((r) => setTimeout(r, 150));
  }

  const payload = { events };
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2));
  return payload;
}

function parseEspnEvents(espnData) {
  const byPair = new Map();

  for (const event of espnData.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors.find((c) => c.homeAway === 'home');
    const away = comp.competitors.find((c) => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeId = ESPN_TEAM_MAP[String(home.team.id)];
    const awayId = ESPN_TEAM_MAP[String(away.team.id)];
    if (!homeId || !awayId) {
      console.warn(`Unknown ESPN team: ${home.team.displayName} vs ${away.team.displayName}`);
      continue;
    }

    const venueName = comp.venue?.fullName ?? '';
    const stadiumId = ESPN_VENUE_TO_STADIUM[venueName];
    if (!stadiumId) {
      console.warn(`Unknown venue: ${venueName}`);
      continue;
    }

    const timezone = STADIUM_TIMEZONES[stadiumId];
    const local = utcToLocal(event.date, timezone);

    byPair.set(pairKey(homeId, awayId), {
      homeTeamId: homeId,
      awayTeamId: awayId,
      stadiumId,
      ...local,
      utc: event.date,
    });
  }

  return byPair;
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

async function main() {
  const matchesPath = path.join(dataDir, 'matches.json');
  const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

  const espnData = await fetchEspnGroupStage();
  const espnByPair = parseEspnEvents(espnData);

  if (espnByPair.size !== 72) {
    console.warn(`Expected 72 group matches from ESPN, got ${espnByPair.size}`);
  }

  let updated = 0;
  const unmatched = [];

  for (const match of matches) {
    if (match.round !== 'Group Stage') continue;

    const key = pairKey(match.homeTeamId, match.awayTeamId);
    const espn = espnByPair.get(key);
    if (!espn) {
      unmatched.push(match.id);
      continue;
    }

    const changed =
      match.date !== espn.date ||
      match.time !== espn.time ||
      match.timezone !== espn.timezone ||
      match.stadiumId !== espn.stadiumId;

    if (changed) {
      console.log(
        `${match.id}: ${match.date} ${match.time} → ${espn.date} ${espn.time} (${espn.timezone}) [${espn.utc}]`,
      );
      match.date = espn.date;
      match.time = espn.time;
      match.timezone = espn.timezone;
      match.stadiumId = espn.stadiumId;
      updated++;
    }
  }

  fs.writeFileSync(matchesPath, `${JSON.stringify(matches, null, 2)}\n`);
  const version = bumpEditionMeta();

  console.log(`\nUpdated ${updated} matches. dataVersion=${version}`);
  if (unmatched.length) {
    console.warn('Unmatched:', unmatched.join(', '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
