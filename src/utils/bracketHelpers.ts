import type { Match, Team } from '../types';
import { computeStandingsFromMatches, sortStandings } from './helpers';

export type BracketRound = 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

export type BracketSlot =
  | { kind: 'team'; teamId: string }
  | { kind: 'winner'; group: string }
  | { kind: 'runner-up'; group: string }
  | { kind: 'third'; groups: string[] }
  | { kind: 'winner-of'; matchId: number }
  | { kind: 'loser-of'; matchId: number };

export interface BracketFixture {
  id: number;
  round: BracketRound;
  date: string;
  time: string;
  timezone: string;
  home: BracketSlot;
  away: BracketSlot;
}

export interface ResolvedBracketMatch {
  id: number;
  round: BracketRound;
  date: string;
  time: string;
  timezone: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

const KNOCKOUT_FIXTURES: BracketFixture[] = [
  { id: 73, round: 'r32', date: '2026-06-28', time: '12:00', timezone: 'America/Los_Angeles', home: { kind: 'runner-up', group: 'A' }, away: { kind: 'runner-up', group: 'B' } },
  { id: 74, round: 'r32', date: '2026-06-29', time: '16:30', timezone: 'America/New_York', home: { kind: 'winner', group: 'E' }, away: { kind: 'third', groups: ['A', 'B', 'C', 'D', 'F'] } },
  { id: 75, round: 'r32', date: '2026-06-30', time: '21:00', timezone: 'America/Chicago', home: { kind: 'winner', group: 'F' }, away: { kind: 'runner-up', group: 'C' } },
  { id: 76, round: 'r32', date: '2026-06-29', time: '13:00', timezone: 'America/Los_Angeles', home: { kind: 'winner', group: 'C' }, away: { kind: 'runner-up', group: 'F' } },
  { id: 77, round: 'r32', date: '2026-06-30', time: '17:00', timezone: 'America/Los_Angeles', home: { kind: 'winner', group: 'I' }, away: { kind: 'third', groups: ['C', 'D', 'F', 'G', 'H'] } },
  { id: 78, round: 'r32', date: '2026-06-30', time: '13:00', timezone: 'America/Los_Angeles', home: { kind: 'runner-up', group: 'E' }, away: { kind: 'runner-up', group: 'I' } },
  { id: 79, round: 'r32', date: '2026-06-30', time: '21:00', timezone: 'America/Los_Angeles', home: { kind: 'winner', group: 'A' }, away: { kind: 'third', groups: ['C', 'E', 'F', 'H', 'I'] } },
  { id: 80, round: 'r32', date: '2026-07-01', time: '18:00', timezone: 'America/New_York', home: { kind: 'winner', group: 'L' }, away: { kind: 'third', groups: ['E', 'H', 'I', 'J', 'K'] } },
  { id: 81, round: 'r32', date: '2026-07-01', time: '20:00', timezone: 'America/Los_Angeles', home: { kind: 'winner', group: 'D' }, away: { kind: 'third', groups: ['B', 'E', 'F', 'I', 'J'] } },
  { id: 82, round: 'r32', date: '2026-07-01', time: '13:00', timezone: 'America/New_York', home: { kind: 'winner', group: 'G' }, away: { kind: 'third', groups: ['A', 'E', 'H', 'I', 'J'] } },
  { id: 83, round: 'r32', date: '2026-07-02', time: '13:00', timezone: 'America/New_York', home: { kind: 'runner-up', group: 'K' }, away: { kind: 'runner-up', group: 'L' } },
  { id: 84, round: 'r32', date: '2026-07-02', time: '15:00', timezone: 'America/Los_Angeles', home: { kind: 'winner', group: 'H' }, away: { kind: 'runner-up', group: 'J' } },
  { id: 85, round: 'r32', date: '2026-07-02', time: '20:00', timezone: 'America/Chicago', home: { kind: 'winner', group: 'B' }, away: { kind: 'third', groups: ['E', 'F', 'G', 'I', 'J'] } },
  { id: 86, round: 'r32', date: '2026-07-03', time: '18:00', timezone: 'America/New_York', home: { kind: 'winner', group: 'J' }, away: { kind: 'runner-up', group: 'H' } },
  { id: 87, round: 'r32', date: '2026-07-03', time: '21:30', timezone: 'America/Chicago', home: { kind: 'winner', group: 'K' }, away: { kind: 'third', groups: ['D', 'E', 'I', 'J', 'L'] } },
  { id: 88, round: 'r32', date: '2026-07-03', time: '13:00', timezone: 'America/Los_Angeles', home: { kind: 'runner-up', group: 'D' }, away: { kind: 'runner-up', group: 'G' } },
  { id: 89, round: 'r16', date: '2026-07-04', time: '17:00', timezone: 'America/Chicago', home: { kind: 'winner-of', matchId: 74 }, away: { kind: 'winner-of', matchId: 77 } },
  { id: 90, round: 'r16', date: '2026-07-04', time: '13:00', timezone: 'America/Los_Angeles', home: { kind: 'winner-of', matchId: 73 }, away: { kind: 'winner-of', matchId: 75 } },
  { id: 91, round: 'r16', date: '2026-07-05', time: '16:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 76 }, away: { kind: 'winner-of', matchId: 78 } },
  { id: 92, round: 'r16', date: '2026-07-06', time: '20:00', timezone: 'America/Los_Angeles', home: { kind: 'winner-of', matchId: 79 }, away: { kind: 'winner-of', matchId: 80 } },
  { id: 93, round: 'r16', date: '2026-07-06', time: '13:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 83 }, away: { kind: 'winner-of', matchId: 84 } },
  { id: 94, round: 'r16', date: '2026-07-07', time: '20:00', timezone: 'America/Los_Angeles', home: { kind: 'winner-of', matchId: 81 }, away: { kind: 'winner-of', matchId: 82 } },
  { id: 95, round: 'r16', date: '2026-07-07', time: '12:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 86 }, away: { kind: 'winner-of', matchId: 88 } },
  { id: 96, round: 'r16', date: '2026-07-07', time: '16:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 85 }, away: { kind: 'winner-of', matchId: 87 } },
  { id: 97, round: 'qf', date: '2026-07-09', time: '20:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 89 }, away: { kind: 'winner-of', matchId: 90 } },
  { id: 98, round: 'qf', date: '2026-07-10', time: '20:00', timezone: 'America/Los_Angeles', home: { kind: 'winner-of', matchId: 91 }, away: { kind: 'winner-of', matchId: 92 } },
  { id: 99, round: 'qf', date: '2026-07-11', time: '15:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 93 }, away: { kind: 'winner-of', matchId: 94 } },
  { id: 100, round: 'qf', date: '2026-07-11', time: '18:00', timezone: 'America/Chicago', home: { kind: 'winner-of', matchId: 95 }, away: { kind: 'winner-of', matchId: 96 } },
  { id: 101, round: 'sf', date: '2026-07-14', time: '20:00', timezone: 'America/Chicago', home: { kind: 'winner-of', matchId: 97 }, away: { kind: 'winner-of', matchId: 98 } },
  { id: 102, round: 'sf', date: '2026-07-15', time: '19:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 99 }, away: { kind: 'winner-of', matchId: 100 } },
  { id: 103, round: 'third', date: '2026-07-18', time: '16:00', timezone: 'America/New_York', home: { kind: 'loser-of', matchId: 101 }, away: { kind: 'loser-of', matchId: 102 } },
  { id: 104, round: 'final', date: '2026-07-19', time: '15:00', timezone: 'America/New_York', home: { kind: 'winner-of', matchId: 101 }, away: { kind: 'winner-of', matchId: 102 } },
];

export const BRACKET_ROUNDS: BracketRound[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];

/** Main knockout tree (excludes third-place play-off column). */
export const BRACKET_TREE_ROUNDS: BracketRound[] = ['r32', 'r16', 'qf', 'sf', 'final'];

const SF_TREE_INDEX = 3;

function groupPlacements(teams: Team[], matches: Match[]): Map<string, string[]> {
  const standings = computeStandingsFromMatches(teams, matches);
  const groups = [...new Set(teams.map((t) => t.group).filter((g): g is string => Boolean(g)))].sort();
  const map = new Map<string, string[]>();

  for (const group of groups) {
    const sorted = sortStandings(
      standings.filter((s) => s.group === group),
      teams
    );
    map.set(
      group,
      sorted.map((s) => s.teamId)
    );
  }

  return map;
}

function resolveSlot(
  slot: BracketSlot,
  placements: Map<string, string[]>,
  knockoutResults: Map<number, string>,
  knockoutLosers: Map<number, string>
): string | null {
  switch (slot.kind) {
    case 'team':
      return slot.teamId;
    case 'winner':
      return placements.get(slot.group)?.[0] ?? null;
    case 'runner-up':
      return placements.get(slot.group)?.[1] ?? null;
    case 'third':
      return null;
    case 'winner-of':
      return knockoutResults.get(slot.matchId) ?? null;
    case 'loser-of':
      return knockoutLosers.get(slot.matchId) ?? null;
    default:
      return null;
  }
}

function getKnockoutWinner(matchId: number, matches: Match[]): string | null {
  const data = matches.find((m) => m.id === `match-${matchId}`);
  if (!data || data.status !== 'Finished' || data.homeScore == null || data.awayScore == null) {
    return null;
  }
  if (data.homeScore > data.awayScore) return data.homeTeamId;
  if (data.awayScore > data.homeScore) return data.awayTeamId;
  return null;
}

function getKnockoutLoser(matchId: number, matches: Match[]): string | null {
  const data = matches.find((m) => m.id === `match-${matchId}`);
  if (!data || data.status !== 'Finished' || data.homeScore == null || data.awayScore == null) {
    return null;
  }
  if (data.homeScore > data.awayScore) return data.awayTeamId;
  if (data.awayScore > data.homeScore) return data.homeTeamId;
  return null;
}

export function resolveBracket(
  teams: Team[],
  groupMatches: Match[],
  knockoutMatches: Match[] = []
): ResolvedBracketMatch[] {
  const placements = groupPlacements(teams, groupMatches);
  const knockoutResults = new Map<number, string>();
  const knockoutLosers = new Map<number, string>();

  for (const fixture of KNOCKOUT_FIXTURES) {
    const winner = getKnockoutWinner(fixture.id, knockoutMatches);
    const loser = getKnockoutLoser(fixture.id, knockoutMatches);
    if (winner) knockoutResults.set(fixture.id, winner);
    if (loser) knockoutLosers.set(fixture.id, loser);
  }

  const resolve = (slot: BracketSlot) =>
    resolveSlot(slot, placements, knockoutResults, knockoutLosers);

  return KNOCKOUT_FIXTURES.map((fixture) => ({
    id: fixture.id,
    round: fixture.round,
    date: fixture.date,
    time: fixture.time,
    timezone: fixture.timezone,
    homeTeamId: resolve(fixture.home),
    awayTeamId: resolve(fixture.away),
  }));
}

function parseMatchNumber(matchId: string): number | null {
  const num = parseInt(matchId.replace('match-', ''), 10);
  return Number.isNaN(num) ? null : num;
}

/** Merge bracket-resolved teams into knockout rows stored with empty team IDs. */
export function resolveMatchTeams(
  match: Match,
  teams: Team[],
  allMatches: Match[]
): { homeTeamId: string; awayTeamId: string } {
  const hasHome = Boolean(match.homeTeamId);
  const hasAway = Boolean(match.awayTeamId);
  if (hasHome && hasAway) {
    return { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };
  }

  const matchNum = parseMatchNumber(match.id);
  if (matchNum == null || matchNum < 73) {
    return { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };
  }

  const groupMatches = allMatches.filter((m) => m.round === 'Group Stage' || m.group);
  const knockoutMatches = allMatches.filter(
    (m) => m.round && m.round !== 'Group Stage' && !m.group
  );
  const resolved = resolveBracket(teams, groupMatches, knockoutMatches).find(
    (m) => m.id === matchNum
  );

  return {
    homeTeamId: match.homeTeamId || resolved?.homeTeamId || '',
    awayTeamId: match.awayTeamId || resolved?.awayTeamId || '',
  };
}

export function getBracketMatchesByRound(
  resolved: ResolvedBracketMatch[]
): Map<BracketRound, ResolvedBracketMatch[]> {
  const map = new Map<BracketRound, ResolvedBracketMatch[]>();
  for (const round of BRACKET_ROUNDS) {
    map.set(
      round,
      resolved.filter((m) => m.round === round)
    );
  }
  return map;
}

export function getBracketMatchY(roundIndex: number, matchIndex: number, cardHeight: number, gap: number): number {
  const unit = cardHeight + gap;
  const multiplier = 2 ** roundIndex;
  return matchIndex * unit * multiplier + ((multiplier - 1) * unit) / 2;
}

export function getBracketTreeHeight(roundIndex: number, matchCount: number, cardHeight: number, gap: number): number {
  if (matchCount === 0) return 0;
  const unit = cardHeight + gap;
  const multiplier = 2 ** roundIndex;
  return (matchCount - 1) * unit * multiplier + cardHeight + ((multiplier - 1) * unit) / 2;
}

export function getBracketMatchTop(
  round: BracketRound,
  matchIndex: number,
  byRound: Map<BracketRound, ResolvedBracketMatch[]>,
  cardHeight: number,
  gap: number
): number {
  if (round === 'final') {
    const sf = byRound.get('sf') ?? [];
    if (sf.length >= 2) {
      const y0 = getBracketMatchY(SF_TREE_INDEX, 0, cardHeight, gap);
      const y1 = getBracketMatchY(SF_TREE_INDEX, 1, cardHeight, gap);
      return (y0 + y1) / 2;
    }
    return getBracketMatchY(BRACKET_TREE_ROUNDS.indexOf('final'), 0, cardHeight, gap);
  }

  const treeIndex = BRACKET_TREE_ROUNDS.indexOf(round);
  if (treeIndex >= 0) {
    return getBracketMatchY(treeIndex, matchIndex, cardHeight, gap);
  }

  return 0;
}

export function getThirdPlaceTop(
  byRound: Map<BracketRound, ResolvedBracketMatch[]>,
  cardHeight: number,
  gap: number
): number {
  const finalTop = getBracketMatchTop('final', 0, byRound, cardHeight, gap);
  return finalTop + cardHeight + gap * 2;
}

export function getMatchCenterY(top: number, cardHeight: number): number {
  return top + cardHeight / 2;
}

/** Which matches connect to which in the bracket tree. */
export function getBracketConnectors(
  byRound: Map<BracketRound, ResolvedBracketMatch[]>
): Array<{ sources: number[]; target: number }> {
  const connectors: Array<{ sources: number[]; target: number }> = [];

  for (let r = 0; r < BRACKET_TREE_ROUNDS.length - 1; r++) {
    const currentRound = BRACKET_TREE_ROUNDS[r];
    const nextRound = BRACKET_TREE_ROUNDS[r + 1];
    const current = byRound.get(currentRound) ?? [];
    const next = byRound.get(nextRound) ?? [];

    if (currentRound === 'sf' && nextRound === 'final') {
      if (current.length >= 2 && next.length >= 1) {
        connectors.push({ sources: [current[0].id, current[1].id], target: next[0].id });
      }
      continue;
    }

    for (let i = 0; i < current.length; i += 2) {
      const parentIdx = i / 2;
      if (i + 1 < current.length && parentIdx < next.length) {
        connectors.push({
          sources: [current[i].id, current[i + 1].id],
          target: next[parentIdx].id,
        });
      }
    }
  }

  const third = byRound.get('third')?.[0];
  const sf = byRound.get('sf') ?? [];
  if (third && sf.length >= 2) {
    connectors.push({ sources: [sf[0].id, sf[1].id], target: third.id });
  }

  return connectors;
}

export function bracketConnectorPath(
  sources: Array<{ x: number; y: number }>,
  target: { x: number; y: number },
  stub = 28
): string {
  if (sources.length === 1) {
    const s = sources[0];
    const xMid = s.x + stub;
    return `M ${s.x} ${s.y} H ${xMid} V ${target.y} H ${target.x}`;
  }

  const [a, b] = sources;
  const yTop = Math.min(a.y, b.y);
  const yBottom = Math.max(a.y, b.y);
  const xMid = a.x + stub;
  const yJoin = (a.y + b.y) / 2;

  return [
    `M ${a.x} ${a.y} H ${xMid}`,
    `M ${b.x} ${b.y} H ${xMid}`,
    `M ${xMid} ${yTop} V ${yBottom}`,
    `M ${xMid} ${yJoin} V ${target.y}`,
    `M ${xMid} ${target.y} H ${target.x}`,
  ].join(' ');
}
