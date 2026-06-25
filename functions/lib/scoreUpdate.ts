export type MatchStatus = 'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled';

export interface MatchRecord {
  id: string;
  group?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

export interface TeamRecord {
  id: string;
  name?: string;
  group?: string;
}

export interface StandingRecord {
  group: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const VALID_STATUSES = new Set<MatchStatus>([
  'Scheduled',
  'Live',
  'Finished',
  'Postponed',
  'Cancelled',
]);

function emptyStanding(group: string, teamId: string): StandingRecord {
  return {
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
  };
}

export function computeStandingsFromMatches(
  teams: TeamRecord[],
  matches: MatchRecord[]
): StandingRecord[] {
  const stats = new Map<string, StandingRecord>();

  for (const team of teams) {
    if (!team.group) continue;
    stats.set(team.id, emptyStanding(team.group, team.id));
  }

  for (const match of matches) {
    if (
      !match.group ||
      match.status !== 'Finished' ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      continue;
    }

    const home = stats.get(match.homeTeamId);
    const away = stats.get(match.awayTeamId);
    if (!home || !away || home.group !== match.group || away.group !== match.group) {
      continue;
    }

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
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

  const teamNames = new Map(teams.map((team) => [team.id, team.name ?? team.id]));
  return Array.from(stats.values()).sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return (teamNames.get(a.teamId) ?? a.teamId).localeCompare(teamNames.get(b.teamId) ?? b.teamId);
  });
}

export function bumpDataVersion(source: string): string {
  const version = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
  const updated = source.replace(/const DATA_VERSION = '[^']+';/, `const DATA_VERSION = '${version}';`);
  if (!updated.includes(`const DATA_VERSION = '${version}';`)) {
    throw new Error('Could not update DATA_VERSION in dataLoader.ts');
  }
  return updated;
}

export function extractDataVersion(source: string): string | null {
  const match = source.match(/const DATA_VERSION = '([^']+)';/);
  return match?.[1] ?? null;
}

export interface ScoreUpdateInput {
  matchId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: MatchStatus;
}

export function applyMatchUpdate(
  matches: MatchRecord[],
  teams: TeamRecord[],
  dataLoaderSource: string,
  input: ScoreUpdateInput
) {
  if (!VALID_STATUSES.has(input.status)) {
    throw new Error(`Invalid status '${input.status}'`);
  }

  const updatedMatches = structuredClone(matches);
  const target = updatedMatches.find((match) => match.id === input.matchId);
  if (!target) {
    throw new Error(`Match not found: ${input.matchId}`);
  }

  if (input.status === 'Scheduled') {
    target.homeScore = null;
    target.awayScore = null;
  } else {
    if (input.homeScore === null || input.homeScore === undefined || input.awayScore === null || input.awayScore === undefined) {
      throw new Error('homeScore and awayScore are required unless status is Scheduled');
    }
    target.homeScore = Number(input.homeScore);
    target.awayScore = Number(input.awayScore);
  }

  target.status = input.status;

  const standings = computeStandingsFromMatches(teams, updatedMatches);
  const dataLoaderTs = bumpDataVersion(dataLoaderSource);
  const dataVersion = extractDataVersion(dataLoaderTs);

  return {
    match: target,
    matches: updatedMatches,
    standings,
    dataLoaderTs,
    dataVersion,
  };
}
