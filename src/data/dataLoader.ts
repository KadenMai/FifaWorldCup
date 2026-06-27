import type {
  Coach,
  Match,
  Player,
  Stadium,
  Standing,
  Team,
} from '../types';
import { fetchJson } from '../utils/fetchJson';

export interface EditionMeta {
  id: string;
  name: string;
  hosts: string;
  dataVersion: string;
}

export interface EditionSummary {
  id: string;
  name: string;
  hosts: string;
  available: boolean;
}

export interface EditionCatalog {
  editions: EditionSummary[];
}

let runtimeDataVersion = '1';

/** Base URL for edition JSON. Production reads R2 via /api/data/; dev uses public/data/. */
export function getDataBaseUrl(): string {
  const override = import.meta.env.VITE_DATA_URL?.trim();
  if (override) {
    return override.endsWith('/') ? override : `${override}/`;
  }
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}data/`;
  }
  return '/api/data/';
}

export function setRuntimeDataVersion(version: string): void {
  runtimeDataVersion = version;
}

export function getRuntimeDataVersion(): string {
  return runtimeDataVersion;
}

export async function loadEditionCatalog(): Promise<EditionCatalog> {
  const url = `${getDataBaseUrl()}index.json`;
  return fetchJson<EditionCatalog>(url, { cache: 'no-store' });
}

export async function loadEditionMeta(edition: string): Promise<EditionMeta> {
  const url = `${getDataBaseUrl()}${edition}/meta.json`;
  return fetchJson<EditionMeta>(url, { cache: 'no-store' });
}

export async function loadJson<T>(edition: string, fileName: string): Promise<T> {
  const url = `${getDataBaseUrl()}${edition}/${fileName}?v=${runtimeDataVersion}`;
  return fetchJson<T>(url, { cache: 'no-store' });
}

export async function loadAllData(edition: string) {
  const meta = await loadEditionMeta(edition);
  setRuntimeDataVersion(meta.dataVersion);

  const [teams, players, coaches, matches, stadiums, standings] =
    await Promise.all([
      loadJson<Team[]>(edition, 'teams.json'),
      loadJson<Player[]>(edition, 'players.json'),
      loadJson<Coach[]>(edition, 'coaches.json'),
      loadJson<Match[]>(edition, 'matches.json'),
      loadJson<Stadium[]>(edition, 'stadiums.json'),
      loadJson<Standing[]>(edition, 'standings.json'),
    ]);

  return { meta, teams, players, coaches, matches, stadiums, standings };
}

export type AppData = Awaited<ReturnType<typeof loadAllData>>;
