import type { Match, Team } from '../types';
import { areAllGroupsComplete, isGroupStageComplete } from './groupStageHelpers';
import { computeStandingsFromMatches, getGroupsFromTeams, sortStandings } from './helpers';

/** Each team plays 3 group-stage matches in 2026 (groups of 4). */
export const GROUP_MATCHES_PER_TEAM = 3;

export interface ThirdPlaceCandidate {
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
  /** Points if all remaining group games are wins (3 pts each). Used for ranking only. */
  assumedPoints: number;
  assumedGoalDifference: number;
  assumedGoalsFor: number;
  gamesRemaining: number;
  fifaRanking: number;
  groupComplete: boolean;
}

function teamGroupMatchesRemaining(
  teamId: string,
  group: string,
  groupMatches: Match[],
): number {
  const finished = groupMatches.filter(
    (m) =>
      m.group === group &&
      m.status === 'Finished' &&
      (m.homeTeamId === teamId || m.awayTeamId === teamId),
  ).length;
  return Math.max(0, GROUP_MATCHES_PER_TEAM - finished);
}

/** Assume each remaining match is a 1–0 win (3 pts, +1 GD, +1 GF). */
function applyMaxPointsAssumption(
  standing: { points: number; goalDifference: number; goalsFor: number },
  gamesRemaining: number,
) {
  return {
    assumedPoints: standing.points + gamesRemaining * 3,
    assumedGoalDifference: standing.goalDifference + gamesRemaining,
    assumedGoalsFor: standing.goalsFor + gamesRemaining,
  };
}

function compareThirdPlaceCandidates(a: ThirdPlaceCandidate, b: ThirdPlaceCandidate): number {
  if (b.assumedPoints !== a.assumedPoints) return b.assumedPoints - a.assumedPoints;
  if (b.assumedGoalDifference !== a.assumedGoalDifference) {
    return b.assumedGoalDifference - a.assumedGoalDifference;
  }
  if (b.assumedGoalsFor !== a.assumedGoalsFor) return b.assumedGoalsFor - a.assumedGoalsFor;
  return a.fifaRanking - b.fifaRanking;
}

/** Third-placed team per group, ranked by max-points assumption for unfinished teams. */
export function getThirdPlaceCandidates(teams: Team[], groupMatches: Match[]): ThirdPlaceCandidate[] {
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
    const gamesRemaining = teamGroupMatchesRemaining(third.teamId, group, groupMatches);
    const assumed = applyMaxPointsAssumption(third, gamesRemaining);

    candidates.push({
      group,
      teamId: third.teamId,
      played: third.played,
      won: third.won,
      drawn: third.drawn,
      lost: third.lost,
      goalsFor: third.goalsFor,
      goalsAgainst: third.goalsAgainst,
      goalDifference: third.goalDifference,
      points: third.points,
      ...assumed,
      gamesRemaining,
      fifaRanking: team?.fifaRanking ?? 9999,
      groupComplete: isGroupStageComplete(group, groupMatches),
    });
  }

  return candidates.sort(compareThirdPlaceCandidates);
}

/** True when this third-placed team has played all group games (no assumed bonus). */
export function isThirdPlaceKnockoutConfirmed(candidate: ThirdPlaceCandidate): boolean {
  return candidate.gamesRemaining === 0;
}

/** Rank all 12 third-placed teams; top 8 advance (FIFA Art. 13 tiebreakers). Final list only when every group is done. */
export function rankThirdPlaceTeams(teams: Team[], groupMatches: Match[]): ThirdPlaceCandidate[] {
  if (!areAllGroupsComplete(teams, groupMatches)) return [];
  return getThirdPlaceCandidates(teams, groupMatches);
}

export function qualifyingThirdPlaceGroups(teams: Team[], groupMatches: Match[]): string[] {
  if (!areAllGroupsComplete(teams, groupMatches)) return [];
  return rankThirdPlaceTeams(teams, groupMatches)
    .slice(0, 8)
    .map((c) => c.group);
}
