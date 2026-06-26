import annexData from '../data/annex-c-2026.json';

/** Maps sorted qualifying third-place groups → { 1A: "3H", 1B: "3G", ... } */
const assignments = annexData.assignments as Record<string, Record<string, string>>;

export function annexCCombinationKey(qualifyingGroups: string[]): string {
  return [...qualifyingGroups].sort().join(',');
}

export function lookupAnnexC(qualifyingGroups: string[]): Record<string, string> | null {
  if (qualifyingGroups.length !== 8) return null;
  return assignments[annexCCombinationKey(qualifyingGroups)] ?? null;
}

/** Which group's third-place team faces group winner `winnerGroup` (e.g. "A" for 1A). */
export function thirdGroupForWinner(
  qualifyingGroups: string[],
  winnerGroup: string,
): string | null {
  const entry = lookupAnnexC(qualifyingGroups);
  if (!entry) return null;
  const raw = entry[`1${winnerGroup}`];
  if (!raw) return null;
  return raw.replace(/^3/, '');
}
