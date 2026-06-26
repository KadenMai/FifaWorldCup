import type {
  Coach,
  Match,
  Player,
  Stadium,
  Standing,
  Team,
  WeatherInfo,
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

export function setRuntimeDataVersion(version: string): void {
  runtimeDataVersion = version;
}

export function getRuntimeDataVersion(): string {
  return runtimeDataVersion;
}

export async function loadEditionCatalog(): Promise<EditionCatalog> {
  const url = `${import.meta.env.BASE_URL}data/index.json`;
  return fetchJson<EditionCatalog>(url, { cache: 'no-store' });
}

export async function loadEditionMeta(edition: string): Promise<EditionMeta> {
  const url = `${import.meta.env.BASE_URL}data/${edition}/meta.json`;
  return fetchJson<EditionMeta>(url, { cache: 'no-store' });
}

export async function loadJson<T>(edition: string, fileName: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${edition}/${fileName}?v=${runtimeDataVersion}`;
  return fetchJson<T>(url, { cache: 'no-store' });
}

export async function loadAllData(edition: string) {
  const meta = await loadEditionMeta(edition);
  setRuntimeDataVersion(meta.dataVersion);

  const [teams, players, coaches, matches, stadiums, standings, weather] =
    await Promise.all([
      loadJson<Team[]>(edition, 'teams.json'),
      loadJson<Player[]>(edition, 'players.json'),
      loadJson<Coach[]>(edition, 'coaches.json'),
      loadJson<Match[]>(edition, 'matches.json'),
      loadJson<Stadium[]>(edition, 'stadiums.json'),
      loadJson<Standing[]>(edition, 'standings.json'),
      loadJson<WeatherInfo[]>(edition, 'weather.json'),
    ]);

  return { meta, teams, players, coaches, matches, stadiums, standings, weather };
}

export type AppData = Awaited<ReturnType<typeof loadAllData>>;
