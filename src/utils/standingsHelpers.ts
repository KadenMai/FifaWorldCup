import type { Match } from '../types';

export const FORM_MATCH_COUNT = 3;

export type FormResult = 'W' | 'D' | 'L';

export interface TeamLastResult {
  score: string;
  outcome: FormResult;
}

export interface TeamFormData {
  lastResult?: TeamLastResult;
  form: (FormResult | null)[];
}

export function getTeamFormFromMatches(teamId: string, matches: Match[]): TeamFormData {
  const finished = matches
    .filter(
      (m) =>
        (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
        m.status === 'Finished' &&
        m.homeScore != null &&
        m.awayScore != null
    )
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      return byDate !== 0 ? byDate : a.time.localeCompare(b.time);
    });

  const results: FormResult[] = finished.map((m) => {
    const isHome = m.homeTeamId === teamId;
    const gf = isHome ? m.homeScore! : m.awayScore!;
    const ga = isHome ? m.awayScore! : m.homeScore!;
    if (gf > ga) return 'W';
    if (gf < ga) return 'L';
    return 'D';
  });

  const form: (FormResult | null)[] = Array(FORM_MATCH_COUNT).fill(null);
  const recent = results.slice(-FORM_MATCH_COUNT);
  recent.forEach((r, i) => {
    form[i] = r;
  });

  const last = finished[finished.length - 1];
  let lastResult: TeamLastResult | undefined;
  if (last) {
    const isHome = last.homeTeamId === teamId;
    const gf = isHome ? last.homeScore! : last.awayScore!;
    const ga = isHome ? last.awayScore! : last.homeScore!;
    const outcome: FormResult = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    lastResult = { score: `${gf}-${ga}`, outcome };
  }

  return { lastResult, form };
}

export function buildFormMap(teamIds: string[], matches: Match[]): Map<string, TeamFormData> {
  const map = new Map<string, TeamFormData>();
  teamIds.forEach((id) => map.set(id, getTeamFormFromMatches(id, matches)));
  return map;
}
