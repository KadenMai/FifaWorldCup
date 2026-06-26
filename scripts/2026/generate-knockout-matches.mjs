/**
 * Append knockout fixtures (match-073 … match-104) to public/data/2026/matches.json
 * Uses the same fixture list as src/utils/bracketHelpers.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const EDITION = '2026';
const dataDir = path.join(ROOT, 'public/data', EDITION);

const ROUND_LABELS = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-final',
  sf: 'Semi-final',
  third: 'Third Place',
  final: 'Final',
};

/** stadiumId per FIFA / ESPN knockout schedule */
const FIXTURES = [
  { id: 73, round: 'r32', date: '2026-06-28', time: '12:00', timezone: 'America/Los_Angeles', stadiumId: 'sofi-stadium' },
  { id: 74, round: 'r32', date: '2026-06-29', time: '16:30', timezone: 'America/New_York', stadiumId: 'gillette-stadium' },
  { id: 75, round: 'r32', date: '2026-06-30', time: '21:00', timezone: 'America/Chicago', stadiumId: 'nrg-stadium' },
  { id: 76, round: 'r32', date: '2026-06-29', time: '13:00', timezone: 'America/Los_Angeles', stadiumId: 'levis-stadium' },
  { id: 77, round: 'r32', date: '2026-06-30', time: '17:00', timezone: 'America/Los_Angeles', stadiumId: 'att-stadium' },
  { id: 78, round: 'r32', date: '2026-06-30', time: '13:00', timezone: 'America/Los_Angeles', stadiumId: 'levis-stadium' },
  { id: 79, round: 'r32', date: '2026-06-30', time: '21:00', timezone: 'America/Los_Angeles', stadiumId: 'metlife-stadium' },
  { id: 80, round: 'r32', date: '2026-07-01', time: '18:00', timezone: 'America/New_York', stadiumId: 'mercedes-benz-stadium' },
  { id: 81, round: 'r32', date: '2026-07-01', time: '20:00', timezone: 'America/Los_Angeles', stadiumId: 'lumen-field' },
  { id: 82, round: 'r32', date: '2026-07-01', time: '13:00', timezone: 'America/New_York', stadiumId: 'lincoln-financial' },
  { id: 83, round: 'r32', date: '2026-07-02', time: '13:00', timezone: 'America/New_York', stadiumId: 'lincoln-financial' },
  { id: 84, round: 'r32', date: '2026-07-02', time: '15:00', timezone: 'America/Los_Angeles', stadiumId: 'bc-place' },
  { id: 85, round: 'r32', date: '2026-07-02', time: '20:00', timezone: 'America/Chicago', stadiumId: 'arrowhead-stadium' },
  { id: 86, round: 'r32', date: '2026-07-03', time: '18:00', timezone: 'America/New_York', stadiumId: 'hard-rock-stadium' },
  { id: 87, round: 'r32', date: '2026-07-03', time: '21:30', timezone: 'America/Chicago', stadiumId: 'att-stadium' },
  { id: 88, round: 'r32', date: '2026-07-03', time: '13:00', timezone: 'America/Los_Angeles', stadiumId: 'bc-place' },
  { id: 89, round: 'r16', date: '2026-07-04', time: '17:00', timezone: 'America/Chicago', stadiumId: 'arrowhead-stadium' },
  { id: 90, round: 'r16', date: '2026-07-04', time: '13:00', timezone: 'America/Los_Angeles', stadiumId: 'levis-stadium' },
  { id: 91, round: 'r16', date: '2026-07-05', time: '16:00', timezone: 'America/New_York', stadiumId: 'lincoln-financial' },
  { id: 92, round: 'r16', date: '2026-07-06', time: '20:00', timezone: 'America/Los_Angeles', stadiumId: 'lumen-field' },
  { id: 93, round: 'r16', date: '2026-07-06', time: '13:00', timezone: 'America/New_York', stadiumId: 'mercedes-benz-stadium' },
  { id: 94, round: 'r16', date: '2026-07-07', time: '20:00', timezone: 'America/Los_Angeles', stadiumId: 'bc-place' },
  { id: 95, round: 'r16', date: '2026-07-07', time: '12:00', timezone: 'America/New_York', stadiumId: 'gillette-stadium' },
  { id: 96, round: 'r16', date: '2026-07-07', time: '16:00', timezone: 'America/New_York', stadiumId: 'metlife-stadium' },
  { id: 97, round: 'qf', date: '2026-07-09', time: '20:00', timezone: 'America/New_York', stadiumId: 'gillette-stadium' },
  { id: 98, round: 'qf', date: '2026-07-10', time: '20:00', timezone: 'America/Los_Angeles', stadiumId: 'sofi-stadium' },
  { id: 99, round: 'qf', date: '2026-07-11', time: '15:00', timezone: 'America/New_York', stadiumId: 'hard-rock-stadium' },
  { id: 100, round: 'qf', date: '2026-07-11', time: '18:00', timezone: 'America/Chicago', stadiumId: 'arrowhead-stadium' },
  { id: 101, round: 'sf', date: '2026-07-14', time: '20:00', timezone: 'America/Chicago', stadiumId: 'att-stadium' },
  { id: 102, round: 'sf', date: '2026-07-15', time: '19:00', timezone: 'America/New_York', stadiumId: 'mercedes-benz-stadium' },
  { id: 103, round: 'third', date: '2026-07-18', time: '16:00', timezone: 'America/New_York', stadiumId: 'hard-rock-stadium' },
  { id: 104, round: 'final', date: '2026-07-19', time: '15:00', timezone: 'America/New_York', stadiumId: 'metlife-stadium' },
];

function bumpEditionMeta() {
  const metaPath = path.join(dataDir, 'meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  meta.dataVersion = stamp;
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
}

const matchesPath = path.join(dataDir, 'matches.json');
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
const groupOnly = matches.filter((m) => m.round === 'Group Stage' || m.group);
const existingKnockout = new Map(
  matches.filter((m) => !m.group && m.round !== 'Group Stage').map((m) => [m.id, m]),
);

const knockoutRows = FIXTURES.map((f) => {
  const id = `match-${String(f.id).padStart(3, '0')}`;
  const prev = existingKnockout.get(id);
  return {
    id,
    date: f.date,
    time: f.time,
    timezone: f.timezone,
    homeTeamId: prev?.homeTeamId ?? '',
    awayTeamId: prev?.awayTeamId ?? '',
    homeScore: prev?.homeScore ?? null,
    awayScore: prev?.awayScore ?? null,
    status: prev?.status ?? 'Scheduled',
    round: ROUND_LABELS[f.round],
    stadiumId: f.stadiumId,
  };
});

const merged = [...groupOnly, ...knockoutRows];
fs.writeFileSync(matchesPath, `${JSON.stringify(merged, null, 2)}\n`);
bumpEditionMeta();
console.log(`Wrote ${merged.length} matches (${groupOnly.length} group + ${knockoutRows.length} knockout)`);
