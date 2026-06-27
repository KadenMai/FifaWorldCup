import type { Match, Stadium, Standing, Team } from '../types';

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True when a match day still has games not yet finished (Scheduled or Live). */
export function isMatchDayStillActive(matches: Match[]): boolean {
  return matches.some((m) => m.status === 'Scheduled' || m.status === 'Live');
}

/** Expand match-day section when any game is live or not yet finished. */
export function shouldExpandMatchDay(matches: Match[]): boolean {
  return matches.some(
    (m) =>
      m.status === 'Live' ||
      m.status === 'Scheduled' ||
      m.status === 'Postponed' ||
      m.status === 'Cancelled'
  );
}

/** Parse wall-clock kickoff in the stadium IANA timezone to a UTC instant. */
export function parseMatchDateTime(
  date: string,
  time: string,
  timeZone: string
): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute);

  for (let i = 0; i < 6; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date(utcMs));

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

    let h = get('hour');
    if (h === 24) h = 0;

    const y = get('year');
    const mo = get('month');
    const d = get('day');
    const mi = get('minute');

    if (y === year && mo === month && d === day && h === hour && mi === minute) {
      return new Date(utcMs);
    }

    utcMs += ((hour - h) * 60 + (minute - mi)) * 60_000 + (day - d) * 86_400_000;
  }

  return new Date(utcMs);
}

export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Kickoff time in the visitor's local timezone (browser default). */
export function formatMatchTime(
  date: string,
  time: string,
  matchTimeZone: string,
  locale = 'en-US'
): string {
  try {
    const instant = parseMatchDateTime(date, time, matchTimeZone);
    return instant.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return `${time} (${matchTimeZone})`;
  }
}

/** Weekday, date, and kickoff time in the visitor's local timezone. */
export function formatMatchKickoff(
  date: string,
  time: string,
  matchTimeZone: string,
  locale = 'en-US'
): string {
  try {
    const instant = parseMatchDateTime(date, time, matchTimeZone);
    const weekday = instant.toLocaleDateString(locale, { weekday: 'short' });
    const day = instant.getDate();
    const month = instant.getMonth() + 1;
    const timeStr = instant.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    return locale.startsWith('vi')
      ? `${weekday}, ${day}/${month}, ${timeStr}`
      : `${weekday}, ${month}/${day}, ${timeStr}`;
  } catch {
    return `${date} ${time}`;
  }
}

export function formatDate(dateStr: string, locale = 'en-US'): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getTeamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function sortStandings(standings: Standing[], teams: Team[]): Standing[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const nameA = teamMap.get(a.teamId)?.name ?? a.teamId;
    const nameB = teamMap.get(b.teamId)?.name ?? b.teamId;
    return nameA.localeCompare(nameB);
  });
}

const EMPTY_STANDING = (group: string, teamId: string): Standing => ({
  group,
  teamId,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
});

/** Compute group standings from finished matches (source of truth when matches exist). */
export function computeStandingsFromMatches(teams: Team[], matches: Match[]): Standing[] {
  const stats = new Map<string, Standing>();

  for (const team of teams) {
    if (!team.group) continue;
    stats.set(team.id, EMPTY_STANDING(team.group, team.id));
  }

  for (const m of matches) {
    if (
      !m.group ||
      m.status !== 'Finished' ||
      m.homeScore === null ||
      m.awayScore === null
    ) {
      continue;
    }

    const home = stats.get(m.homeTeamId);
    const away = stats.get(m.awayTeamId);
    if (!home || !away || home.group !== m.group || away.group !== m.group) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return Array.from(stats.values());
}

/** All teams in a group, merged with standings stats (computed from matches when provided). */
export function getMergedGroupStandings(
  group: string,
  standings: Standing[],
  teams: Team[],
  matches?: Match[]
): Standing[] {
  const groupTeams = teams.filter((t) => t.group === group);
  const source = matches?.length
    ? computeStandingsFromMatches(teams, matches)
    : standings;
  const byTeam = new Map(
    source.filter((s) => s.group === group).map((s) => [s.teamId, s])
  );

  const merged = groupTeams.map(
    (team) => byTeam.get(team.id) ?? EMPTY_STANDING(group, team.id)
  );

  return sortStandings(merged, teams);
}

export function getGroupsFromTeams(teams: Team[]): string[] {
  return Array.from(new Set(teams.map((t) => t.group).filter(Boolean))).sort() as string[];
}

export function getMatchWinner(
  match: Match,
  teams: Team[]
): Team | null {
  if (match.status !== 'Finished' || match.homeScore === null || match.awayScore === null) {
    return null;
  }
  if (match.homeScore > match.awayScore) return getTeamById(teams, match.homeTeamId) ?? null;
  if (match.awayScore > match.homeScore) return getTeamById(teams, match.awayTeamId) ?? null;
  return null;
}

export function translateMatchRound(
  t: (key: string) => string,
  round?: string
): string {
  if (!round) return '';
  const key = `match.round.${round}`;
  const translated = t(key);
  return translated === key ? round : translated;
}

export function countTeamMatches(teamId: string, matches: Match[]): number {
  return matches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  ).length;
}

export function countStadiumMatches(stadiumId: string, matches: Match[]): number {
  return matches.filter((m) => m.stadiumId === stadiumId).length;
}

export function formatStadiumLabel(
  stadium: Pick<Stadium, 'name' | 'city' | 'state' | 'country'>
): string {
  const place = stadium.state ? `${stadium.city}, ${stadium.state}` : stadium.city;
  return `${stadium.name} · ${place}, ${stadium.country}`;
}

export function matchesSearchText(
  match: Match,
  teams: Team[],
  stadiumName?: string,
  city?: string
): string {
  const home = getTeamById(teams, match.homeTeamId);
  const away = getTeamById(teams, match.awayTeamId);
  return [
    home?.name,
    home?.shortName,
    away?.name,
    away?.shortName,
    stadiumName,
    city,
    match.round,
    match.group,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
