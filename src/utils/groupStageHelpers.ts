import type { Match, Team } from '../types';
import { computeStandingsFromMatches, getGroupsFromTeams, sortStandings } from './helpers';
import { getThirdPlaceCandidates, isThirdPlaceKnockoutConfirmed } from './thirdPlaceRanking';

/** True when every group-stage match in this group is Finished (6/6 for 2026). */
export function isGroupStageComplete(group: string, groupMatches: Match[]): boolean {
  const inGroup = groupMatches.filter((m) => m.group === group);
  return inGroup.length > 0 && inGroup.every((m) => m.status === 'Finished');
}

export function getCompletedGroups(teams: Team[], groupMatches: Match[]): Set<string> {
  const groups = getGroupsFromTeams(teams);
  return new Set(groups.filter((g) => isGroupStageComplete(g, groupMatches)));
}

/** Annex C and best-thirds selection apply only after all 12 groups finish. */
export function areAllGroupsComplete(teams: Team[], groupMatches: Match[]): boolean {
  const groups = getGroupsFromTeams(teams);
  return groups.length > 0 && groups.every((g) => isGroupStageComplete(g, groupMatches));
}

/** Teams that are guaranteed knockout qualifiers (finished group top 2, or confirmed top-8 third). */
export function getConfirmedKnockoutTeamIds(teams: Team[], matches: Match[]): Set<string> {
  const groupMatches = matches.filter((m) => m.group);
  const confirmed = new Set<string>();
  const standings = computeStandingsFromMatches(teams, groupMatches);

  for (const group of getCompletedGroups(teams, groupMatches)) {
    const sorted = sortStandings(
      standings.filter((s) => s.group === group),
      teams,
    );
    if (sorted[0]) confirmed.add(sorted[0].teamId);
    if (sorted[1]) confirmed.add(sorted[1].teamId);
  }

  for (const candidate of getThirdPlaceCandidates(teams, groupMatches).slice(0, 8)) {
    if (isThirdPlaceKnockoutConfirmed(candidate)) {
      confirmed.add(candidate.teamId);
    }
  }

  return confirmed;
}
