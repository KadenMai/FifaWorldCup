/**
 * Generates official FIFA World Cup 2026 data (48 teams, 12 groups).
 * Sources: FIFA draw (Dec 2025), Al Jazeera schedule, 101GreatGoals results.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../public/data');

const TEAMS = [
  { id: 'mexico', name: 'Mexico', shortName: 'MEX', flagCode: 'mx', group: 'A', confederation: 'CONCACAF', fifaRanking: 16 },
  { id: 'south-africa', name: 'South Africa', shortName: 'RSA', flagCode: 'za', group: 'A', confederation: 'CAF', fifaRanking: 60 },
  { id: 'south-korea', name: 'Korea Republic', shortName: 'KOR', flagCode: 'kr', group: 'A', confederation: 'AFC', fifaRanking: 22 },
  { id: 'czechia', name: 'Czechia', shortName: 'CZE', flagCode: 'cz', group: 'A', confederation: 'UEFA', fifaRanking: 43 },
  { id: 'canada', name: 'Canada', shortName: 'CAN', flagCode: 'ca', group: 'B', confederation: 'CONCACAF', fifaRanking: 29 },
  { id: 'bosnia', name: 'Bosnia and Herzegovina', shortName: 'BIH', flagCode: 'ba', group: 'B', confederation: 'UEFA', fifaRanking: 71 },
  { id: 'qatar', name: 'Qatar', shortName: 'QAT', flagCode: 'qa', group: 'B', confederation: 'AFC', fifaRanking: 56 },
  { id: 'switzerland', name: 'Switzerland', shortName: 'SUI', flagCode: 'ch', group: 'B', confederation: 'UEFA', fifaRanking: 18 },
  { id: 'brazil', name: 'Brazil', shortName: 'BRA', flagCode: 'br', group: 'C', confederation: 'CONMEBOL', fifaRanking: 5 },
  { id: 'morocco', name: 'Morocco', shortName: 'MAR', flagCode: 'ma', group: 'C', confederation: 'CAF', fifaRanking: 8 },
  { id: 'haiti', name: 'Haiti', shortName: 'HAI', flagCode: 'ht', group: 'C', confederation: 'CONCACAF', fifaRanking: 83 },
  { id: 'scotland', name: 'Scotland', shortName: 'SCO', flagCode: 'gb-sct', group: 'C', confederation: 'UEFA', fifaRanking: 38 },
  { id: 'usa', name: 'United States', shortName: 'USA', flagCode: 'us', group: 'D', confederation: 'CONCACAF', fifaRanking: 15 },
  { id: 'paraguay', name: 'Paraguay', shortName: 'PAR', flagCode: 'py', group: 'D', confederation: 'CONMEBOL', fifaRanking: 40 },
  { id: 'australia', name: 'Australia', shortName: 'AUS', flagCode: 'au', group: 'D', confederation: 'AFC', fifaRanking: 27 },
  { id: 'turkiye', name: 'Türkiye', shortName: 'TUR', flagCode: 'tr', group: 'D', confederation: 'UEFA', fifaRanking: 25 },
  { id: 'germany', name: 'Germany', shortName: 'GER', flagCode: 'de', group: 'E', confederation: 'UEFA', fifaRanking: 10 },
  { id: 'curacao', name: 'Curaçao', shortName: 'CUW', flagCode: 'cw', group: 'E', confederation: 'CONCACAF', fifaRanking: 81 },
  { id: 'ivory-coast', name: "Côte d'Ivoire", shortName: 'CIV', flagCode: 'ci', group: 'E', confederation: 'CAF', fifaRanking: 37 },
  { id: 'ecuador', name: 'Ecuador', shortName: 'ECU', flagCode: 'ec', group: 'E', confederation: 'CONMEBOL', fifaRanking: 23 },
  { id: 'netherlands', name: 'Netherlands', shortName: 'NED', flagCode: 'nl', group: 'F', confederation: 'UEFA', fifaRanking: 7 },
  { id: 'japan', name: 'Japan', shortName: 'JPN', flagCode: 'jp', group: 'F', confederation: 'AFC', fifaRanking: 19 },
  { id: 'sweden', name: 'Sweden', shortName: 'SWE', flagCode: 'se', group: 'F', confederation: 'UEFA', fifaRanking: 42 },
  { id: 'tunisia', name: 'Tunisia', shortName: 'TUN', flagCode: 'tn', group: 'F', confederation: 'CAF', fifaRanking: 47 },
  { id: 'belgium', name: 'Belgium', shortName: 'BEL', flagCode: 'be', group: 'G', confederation: 'UEFA', fifaRanking: 9 },
  { id: 'egypt', name: 'Egypt', shortName: 'EGY', flagCode: 'eg', group: 'G', confederation: 'CAF', fifaRanking: 31 },
  { id: 'iran', name: 'IR Iran', shortName: 'IRN', flagCode: 'ir', group: 'G', confederation: 'AFC', fifaRanking: 20 },
  { id: 'new-zealand', name: 'New Zealand', shortName: 'NZL', flagCode: 'nz', group: 'G', confederation: 'OFC', fifaRanking: 85 },
  { id: 'spain', name: 'Spain', shortName: 'ESP', flagCode: 'es', group: 'H', confederation: 'UEFA', fifaRanking: 1 },
  { id: 'cape-verde', name: 'Cabo Verde', shortName: 'CPV', flagCode: 'cv', group: 'H', confederation: 'CAF', fifaRanking: 67 },
  { id: 'saudi-arabia', name: 'Saudi Arabia', shortName: 'KSA', flagCode: 'sa', group: 'H', confederation: 'AFC', fifaRanking: 61 },
  { id: 'uruguay', name: 'Uruguay', shortName: 'URU', flagCode: 'uy', group: 'H', confederation: 'CONMEBOL', fifaRanking: 17 },
  { id: 'france', name: 'France', shortName: 'FRA', flagCode: 'fr', group: 'I', confederation: 'UEFA', fifaRanking: 3 },
  { id: 'senegal', name: 'Senegal', shortName: 'SEN', flagCode: 'sn', group: 'I', confederation: 'CAF', fifaRanking: 12 },
  { id: 'iraq', name: 'Iraq', shortName: 'IRQ', flagCode: 'iq', group: 'I', confederation: 'AFC', fifaRanking: 58 },
  { id: 'norway', name: 'Norway', shortName: 'NOR', flagCode: 'no', group: 'I', confederation: 'UEFA', fifaRanking: 32 },
  { id: 'argentina', name: 'Argentina', shortName: 'ARG', flagCode: 'ar', group: 'J', confederation: 'CONMEBOL', fifaRanking: 2 },
  { id: 'algeria', name: 'Algeria', shortName: 'ALG', flagCode: 'dz', group: 'J', confederation: 'CAF', fifaRanking: 28 },
  { id: 'austria', name: 'Austria', shortName: 'AUT', flagCode: 'at', group: 'J', confederation: 'UEFA', fifaRanking: 24 },
  { id: 'jordan', name: 'Jordan', shortName: 'JOR', flagCode: 'jo', group: 'J', confederation: 'AFC', fifaRanking: 64 },
  { id: 'portugal', name: 'Portugal', shortName: 'POR', flagCode: 'pt', group: 'K', confederation: 'UEFA', fifaRanking: 6 },
  { id: 'dr-congo', name: 'Congo DR', shortName: 'COD', flagCode: 'cd', group: 'K', confederation: 'CAF', fifaRanking: 48 },
  { id: 'uzbekistan', name: 'Uzbekistan', shortName: 'UZB', flagCode: 'uz', group: 'K', confederation: 'AFC', fifaRanking: 52 },
  { id: 'colombia', name: 'Colombia', shortName: 'COL', flagCode: 'co', group: 'K', confederation: 'CONMEBOL', fifaRanking: 14 },
  { id: 'england', name: 'England', shortName: 'ENG', flagCode: 'gb-eng', group: 'L', confederation: 'UEFA', fifaRanking: 4 },
  { id: 'croatia', name: 'Croatia', shortName: 'CRO', flagCode: 'hr', group: 'L', confederation: 'UEFA', fifaRanking: 11 },
  { id: 'ghana', name: 'Ghana', shortName: 'GHA', flagCode: 'gh', group: 'L', confederation: 'CAF', fifaRanking: 72 },
  { id: 'panama', name: 'Panama', shortName: 'PAN', flagCode: 'pa', group: 'L', confederation: 'CONCACAF', fifaRanking: 33 },
];

const COACHES = {
  mexico: 'Javier Aguirre', canada: 'Jesse Marsch', usa: 'Mauricio Pochettino',
  brazil: 'Dorival Júnior', argentina: 'Lionel Scaloni', france: 'Didier Deschamps',
  germany: 'Julian Nagelsmann', spain: 'Luis de la Fuente', england: 'Thomas Tuchel',
  portugal: 'Roberto Martínez', netherlands: 'Ronald Koeman', belgium: 'Rudi Völler',
  croatia: 'Zlatko Dalić', morocco: 'Walid Regragui', japan: 'Hajime Moriyasu',
  'south-korea': 'Hong Myung-bo', switzerland: 'Murat Yakin', colombia: 'Néstor Lorenzo',
  uruguay: 'Marcelo Bielsa', senegal: 'Aliou Cissé', ecuador: 'Sebastián Beccacece',
  australia: 'Graham Arnold', iran: 'Amir Ghalenoei', 'saudi-arabia': 'Manuel Mancini',
  egypt: 'Hossam Hassan', scotland: 'Steve Clarke', norway: 'Ståle Solbakken',
  sweden: 'Jon Dahl Tomasson', turkiye: 'Vincenzo Montella', austria: 'Ralf Rangnick',
  algeria: 'Vahid Halilhodžić', paraguay: 'Alfaro Gómez', qatar: 'Carlos Queiroz',
  'ivory-coast': 'Emerse Faé', tunisia: 'Samuel Zaoui', ghana: 'Otto Addo',
  panama: 'Thomas Christiansen', 'new-zealand': 'Darije Kalezić', 'south-africa': 'Hugo Broos',
  czechia: 'Ivan Hašek', bosnia: 'Sergej Barbarez', haiti: 'Sébastien Migné',
  curacao: 'Dick Advocaat', 'cape-verde': 'Bubista', iraq: 'Jesús Casas',
  jordan: 'Husam Al-Malkawi', 'dr-congo': 'Sébastien Desabre', uzbekistan: 'Slavisa Jokanovic',
};

// [date, time, tz, home, away, homeScore, awayScore, status, stadiumId, group]
const MATCHES = [
  // Group A
  ['2026-06-11', '13:00', 'America/Mexico_City', 'mexico', 'south-africa', 2, 0, 'Finished', 'azteca', 'A'],
  ['2026-06-12', '20:00', 'America/Mexico_City', 'south-korea', 'czechia', 2, 1, 'Finished', 'akron', 'A'],
  ['2026-06-18', '12:00', 'America/New_York', 'czechia', 'south-africa', 1, 1, 'Finished', 'mercedes-benz-stadium', 'A'],
  ['2026-06-19', '19:00', 'America/Mexico_City', 'mexico', 'south-korea', 1, 0, 'Finished', 'akron', 'A'],
  ['2026-06-25', '01:00', 'America/Mexico_City', 'czechia', 'mexico', null, null, 'Scheduled', 'azteca', 'A'],
  ['2026-06-25', '01:00', 'America/Monterrey', 'south-africa', 'south-korea', null, null, 'Scheduled', 'bbva', 'A'],
  // Group B
  ['2026-06-12', '15:00', 'America/Toronto', 'canada', 'bosnia', 1, 1, 'Finished', 'bmo-field', 'B'],
  ['2026-06-13', '12:00', 'America/Los_Angeles', 'qatar', 'switzerland', 1, 1, 'Finished', 'levis-stadium', 'B'],
  ['2026-06-18', '12:00', 'America/Los_Angeles', 'switzerland', 'bosnia', 4, 1, 'Finished', 'sofi-stadium', 'B'],
  ['2026-06-18', '15:00', 'America/Vancouver', 'canada', 'qatar', 6, 0, 'Finished', 'bc-place', 'B'],
  ['2026-06-24', '12:00', 'America/Vancouver', 'switzerland', 'canada', 2, 1, 'Finished', 'bc-place', 'B'],
  ['2026-06-24', '12:00', 'America/Los_Angeles', 'bosnia', 'qatar', 3, 1, 'Finished', 'lumen-field', 'B'],
  // Group C
  ['2026-06-13', '18:00', 'America/New_York', 'brazil', 'morocco', 1, 1, 'Finished', 'metlife-stadium', 'C'],
  ['2026-06-13', '21:00', 'America/New_York', 'haiti', 'scotland', 0, 1, 'Finished', 'gillette-stadium', 'C'],
  ['2026-06-19', '20:30', 'America/New_York', 'brazil', 'haiti', 3, 0, 'Finished', 'lincoln-financial', 'C'],
  ['2026-06-19', '18:00', 'America/New_York', 'scotland', 'morocco', 0, 1, 'Finished', 'gillette-stadium', 'C'],
  ['2026-06-24', '18:00', 'America/New_York', 'scotland', 'brazil', 0, 3, 'Finished', 'hard-rock-stadium', 'C'],
  ['2026-06-24', '18:00', 'America/New_York', 'morocco', 'haiti', 4, 2, 'Finished', 'mercedes-benz-stadium', 'C'],
  // Group D
  ['2026-06-12', '18:00', 'America/Los_Angeles', 'usa', 'paraguay', 4, 1, 'Finished', 'sofi-stadium', 'D'],
  ['2026-06-14', '18:00', 'America/Vancouver', 'australia', 'turkiye', 2, 0, 'Finished', 'bc-place', 'D'],
  ['2026-06-19', '12:00', 'America/Los_Angeles', 'usa', 'australia', 2, 0, 'Finished', 'lumen-field', 'D'],
  ['2026-06-19', '21:00', 'America/Los_Angeles', 'turkiye', 'paraguay', 0, 1, 'Finished', 'levis-stadium', 'D'],
  ['2026-06-26', '19:00', 'America/Los_Angeles', 'turkiye', 'usa', null, null, 'Scheduled', 'sofi-stadium', 'D'],
  ['2026-06-26', '19:00', 'America/Los_Angeles', 'paraguay', 'australia', null, null, 'Scheduled', 'levis-stadium', 'D'],
  // Group E
  ['2026-06-14', '12:00', 'America/Chicago', 'germany', 'curacao', 7, 1, 'Finished', 'nrg-stadium', 'E'],
  ['2026-06-14', '19:00', 'America/New_York', 'ivory-coast', 'ecuador', 1, 0, 'Finished', 'lincoln-financial', 'E'],
  ['2026-06-20', '16:00', 'America/Toronto', 'germany', 'ivory-coast', 2, 1, 'Finished', 'bmo-field', 'E'],
  ['2026-06-21', '19:00', 'America/Chicago', 'ecuador', 'curacao', 0, 0, 'Finished', 'arrowhead-stadium', 'E'],
  ['2026-06-25', '16:00', 'America/New_York', 'ecuador', 'germany', null, null, 'Scheduled', 'metlife-stadium', 'E'],
  ['2026-06-25', '16:00', 'America/New_York', 'curacao', 'ivory-coast', null, null, 'Scheduled', 'lincoln-financial', 'E'],
  // Group F
  ['2026-06-14', '15:00', 'America/Chicago', 'netherlands', 'japan', 2, 2, 'Finished', 'att-stadium', 'F'],
  ['2026-06-14', '20:00', 'America/Monterrey', 'sweden', 'tunisia', 5, 1, 'Finished', 'bbva', 'F'],
  ['2026-06-20', '12:00', 'America/Chicago', 'netherlands', 'sweden', 5, 1, 'Finished', 'nrg-stadium', 'F'],
  ['2026-06-21', '22:00', 'America/Monterrey', 'tunisia', 'japan', 0, 4, 'Finished', 'bbva', 'F'],
  ['2026-06-26', '18:00', 'America/Chicago', 'tunisia', 'netherlands', null, null, 'Scheduled', 'arrowhead-stadium', 'F'],
  ['2026-06-26', '18:00', 'America/Chicago', 'japan', 'sweden', null, null, 'Scheduled', 'att-stadium', 'F'],
  // Group G
  ['2026-06-15', '12:00', 'America/Los_Angeles', 'belgium', 'egypt', 1, 1, 'Finished', 'bc-place', 'G'],
  ['2026-06-15', '18:00', 'America/Los_Angeles', 'iran', 'new-zealand', 2, 2, 'Finished', 'sofi-stadium', 'G'],
  ['2026-06-21', '12:00', 'America/Los_Angeles', 'belgium', 'iran', 0, 0, 'Finished', 'sofi-stadium', 'G'],
  ['2026-06-21', '18:00', 'America/Vancouver', 'new-zealand', 'egypt', 1, 3, 'Finished', 'bc-place', 'G'],
  ['2026-06-27', '20:00', 'America/Vancouver', 'new-zealand', 'belgium', null, null, 'Scheduled', 'bc-place', 'G'],
  ['2026-06-27', '20:00', 'America/Los_Angeles', 'egypt', 'iran', null, null, 'Scheduled', 'lumen-field', 'G'],
  // Group H
  ['2026-06-15', '12:00', 'America/New_York', 'spain', 'cape-verde', 0, 0, 'Finished', 'mercedes-benz-stadium', 'H'],
  ['2026-06-15', '18:00', 'America/New_York', 'saudi-arabia', 'uruguay', 1, 1, 'Finished', 'hard-rock-stadium', 'H'],
  ['2026-06-21', '12:00', 'America/New_York', 'spain', 'saudi-arabia', 4, 0, 'Finished', 'mercedes-benz-stadium', 'H'],
  ['2026-06-21', '18:00', 'America/New_York', 'uruguay', 'cape-verde', 2, 2, 'Finished', 'hard-rock-stadium', 'H'],
  ['2026-06-27', '18:00', 'America/Chicago', 'cape-verde', 'saudi-arabia', null, null, 'Scheduled', 'nrg-stadium', 'H'],
  ['2026-06-27', '19:00', 'America/Mexico_City', 'uruguay', 'spain', null, null, 'Scheduled', 'akron', 'H'],
  // Group I
  ['2026-06-16', '15:00', 'America/New_York', 'france', 'senegal', 3, 1, 'Finished', 'metlife-stadium', 'I'],
  ['2026-06-16', '18:00', 'America/New_York', 'iraq', 'norway', 1, 4, 'Finished', 'gillette-stadium', 'I'],
  ['2026-06-22', '20:00', 'America/New_York', 'norway', 'senegal', 3, 2, 'Finished', 'metlife-stadium', 'I'],
  ['2026-06-22', '17:00', 'America/New_York', 'france', 'iraq', 3, 0, 'Finished', 'lincoln-financial', 'I'],
  ['2026-06-26', '15:00', 'America/New_York', 'norway', 'france', null, null, 'Scheduled', 'gillette-stadium', 'I'],
  ['2026-06-26', '15:00', 'America/Toronto', 'senegal', 'iraq', null, null, 'Scheduled', 'bmo-field', 'I'],
  // Group J
  ['2026-06-16', '20:00', 'America/Chicago', 'argentina', 'algeria', 3, 0, 'Finished', 'arrowhead-stadium', 'J'],
  ['2026-06-16', '21:00', 'America/Los_Angeles', 'austria', 'jordan', 3, 1, 'Finished', 'levis-stadium', 'J'],
  ['2026-06-22', '12:00', 'America/Chicago', 'argentina', 'austria', 2, 0, 'Finished', 'att-stadium', 'J'],
  ['2026-06-22', '20:00', 'America/Los_Angeles', 'jordan', 'algeria', 1, 2, 'Finished', 'levis-stadium', 'J'],
  ['2026-06-27', '21:00', 'America/Chicago', 'algeria', 'austria', null, null, 'Scheduled', 'arrowhead-stadium', 'J'],
  ['2026-06-27', '21:00', 'America/Chicago', 'jordan', 'argentina', null, null, 'Scheduled', 'att-stadium', 'J'],
  // Group K
  ['2026-06-17', '12:00', 'America/Chicago', 'portugal', 'dr-congo', 1, 1, 'Finished', 'nrg-stadium', 'K'],
  ['2026-06-17', '20:00', 'America/Mexico_City', 'uzbekistan', 'colombia', 1, 3, 'Finished', 'azteca', 'K'],
  ['2026-06-23', '12:00', 'America/Chicago', 'portugal', 'uzbekistan', 5, 0, 'Finished', 'nrg-stadium', 'K'],
  ['2026-06-23', '20:00', 'America/Mexico_City', 'colombia', 'dr-congo', 1, 0, 'Finished', 'akron', 'K'],
  ['2026-06-27', '19:30', 'America/New_York', 'colombia', 'portugal', null, null, 'Scheduled', 'hard-rock-stadium', 'K'],
  ['2026-06-27', '19:30', 'America/New_York', 'dr-congo', 'uzbekistan', null, null, 'Scheduled', 'mercedes-benz-stadium', 'K'],
  // Group L
  ['2026-06-17', '15:00', 'America/Chicago', 'england', 'croatia', 4, 2, 'Finished', 'att-stadium', 'L'],
  ['2026-06-17', '19:00', 'America/Toronto', 'ghana', 'panama', 1, 0, 'Finished', 'bmo-field', 'L'],
  ['2026-06-23', '16:00', 'America/New_York', 'england', 'ghana', 0, 0, 'Finished', 'gillette-stadium', 'L'],
  ['2026-06-23', '19:00', 'America/Toronto', 'panama', 'croatia', 0, 1, 'Finished', 'bmo-field', 'L'],
  ['2026-06-27', '17:00', 'America/New_York', 'panama', 'england', null, null, 'Scheduled', 'metlife-stadium', 'L'],
  ['2026-06-27', '17:00', 'America/New_York', 'croatia', 'ghana', null, null, 'Scheduled', 'lincoln-financial', 'L'],
];

function computeStandings(matches, teams) {
  const byGroup = {};
  for (const t of teams) {
    if (!byGroup[t.group]) byGroup[t.group] = {};
    byGroup[t.group][t.id] = {
      group: t.group, teamId: t.id, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    };
  }
  for (const m of matches) {
    if (m.status !== 'Finished' || m.homeScore == null || m.awayScore == null) continue;
    const g = m.group;
    const home = byGroup[g][m.homeTeamId];
    const away = byGroup[g][m.awayTeamId];
    if (!home || !away) continue;
    home.played++; away.played++;
    home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) { home.won++; home.points += 3; away.lost++; }
    else if (m.homeScore < m.awayScore) { away.won++; away.points += 3; home.lost++; }
    else { home.drawn++; away.drawn++; home.points++; away.points++; }
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }
  return Object.values(byGroup).flatMap((g) => Object.values(g));
}

const teamsJson = TEAMS.map((t) => ({
  ...t,
  flag: '',
  coachId: `coach-${t.id}`,
  qualified: true,
}));

const coachesJson = TEAMS.map((t) => ({
  id: `coach-${t.id}`,
  teamId: t.id,
  name: COACHES[t.id] ?? 'Head Coach',
  nationality: t.name,
  notes: 'FIFA World Cup 2026',
}));

const matchesJson = MATCHES.map(([date, time, timezone, home, away, hs, as, status, stadiumId, group], i) => ({
  id: `match-${String(i + 1).padStart(3, '0')}`,
  date, time, timezone,
  homeTeamId: home, awayTeamId: away,
  homeScore: hs, awayScore: as, status,
  round: 'Group Stage', group, stadiumId,
}));

const standingsJson = computeStandings(matchesJson, teamsJson);

writeFileSync(join(dataDir, 'teams.json'), JSON.stringify(teamsJson, null, 2) + '\n');
writeFileSync(join(dataDir, 'coaches.json'), JSON.stringify(coachesJson, null, 2) + '\n');
writeFileSync(join(dataDir, 'matches.json'), JSON.stringify(matchesJson, null, 2) + '\n');
writeFileSync(join(dataDir, 'standings.json'), JSON.stringify(standingsJson, null, 2) + '\n');

console.log('Generated:', teamsJson.length, 'teams,', matchesJson.length, 'matches,', standingsJson.length, 'standings rows');
