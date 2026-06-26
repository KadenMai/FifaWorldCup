import type { Match, Team } from '../types';
import { areAllGroupsComplete } from './groupStageHelpers';
import { computeStandingsFromMatches, getGroupsFromTeams, sortStandings } from './helpers';

export interface ThirdPlaceCandidate {
  group: string;
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  fifaRanking: number;
}

/** Rank all 12 third-placed teams; top 8 advance (FIFA Art. 13 tiebreakers). */
export function rankThirdPlaceTeams(teams: Team[], groupMatches: Match[]): ThirdPlaceCandidate[] {
  if (!areAllGroupsComplete(teams, groupMatches)) return [];

  const standings = computeStandingsFromMatches(teams, groupMatches);
  const groups = getGroupsFromTeams(teams);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const candidates: ThirdPlaceCandidate[] = [];

  for (const group of groups) {
    const sorted = sortStandings(
      standings.filter((s) => s.group === group),
      teams,
    );
    if (sorted.length < 3) continue;

    const third = sorted[2];
    const team = teamById.get(third.teamId);
    candidates.push({
      group,
      teamId: third.teamId,
      points: third.points,
      goalDifference: third.goalDifference,
      goalsFor: third.goalsFor,
      fifaRanking: team?.fifaRanking ?? 9999,
    });
  }

  return candidates.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.fifaRanking - b.fifaRanking;
  });
}

export function qualifyingThirdPlaceGroups(teams: Team[], groupMatches: Match[]): string[] {
  if (!areAllGroupsComplete(teams, groupMatches)) return [];
  return rankThirdPlaceTeams(teams, groupMatches)
    .slice(0, 8)
    .map((c) => c.group);
}
