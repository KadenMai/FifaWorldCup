import type { Team } from '../types';

/** ISO 3166-1 alpha-2 codes for flagcdn.com */
export const TEAM_FLAG_CODES: Record<string, string> = {
  mexico: 'mx',
  'south-africa': 'za',
  'south-korea': 'kr',
  czechia: 'cz',
  canada: 'ca',
  bosnia: 'ba',
  qatar: 'qa',
  switzerland: 'ch',
  brazil: 'br',
  morocco: 'ma',
  haiti: 'ht',
  scotland: 'gb-sct',
  usa: 'us',
  paraguay: 'py',
  australia: 'au',
  turkiye: 'tr',
  germany: 'de',
  curacao: 'cw',
  'ivory-coast': 'ci',
  ecuador: 'ec',
  netherlands: 'nl',
  japan: 'jp',
  sweden: 'se',
  tunisia: 'tn',
  belgium: 'be',
  egypt: 'eg',
  iran: 'ir',
  'new-zealand': 'nz',
  spain: 'es',
  'cape-verde': 'cv',
  'saudi-arabia': 'sa',
  uruguay: 'uy',
  france: 'fr',
  senegal: 'sn',
  iraq: 'iq',
  norway: 'no',
  argentina: 'ar',
  algeria: 'dz',
  austria: 'at',
  jordan: 'jo',
  portugal: 'pt',
  'dr-congo': 'cd',
  uzbekistan: 'uz',
  colombia: 'co',
  england: 'gb-eng',
  croatia: 'hr',
  ghana: 'gh',
  panama: 'pa',
};

export function getTeamFlagCode(team: Pick<Team, 'id' | 'flagCode'>): string {
  return team.flagCode ?? TEAM_FLAG_CODES[team.id] ?? team.id;
}

/** flagcdn.com — reliable PNG flags on all platforms */
export function getFlagUrl(flagCode: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${flagCode}.png`;
}

export function getTeamFlagUrl(team: Pick<Team, 'id' | 'flagCode'>, width = 40): string {
  return getFlagUrl(getTeamFlagCode(team), width);
}
