import type {
  Coach,
  EditionWeatherData,
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

  const [teams, players, coaches, matches, stadiums, standings, weatherRaw] =
    await Promise.all([
      loadJson<Team[]>(edition, 'teams.json'),
      loadJson<Player[]>(edition, 'players.json'),
      loadJson<Coach[]>(edition, 'coaches.json'),
      loadJson<Match[]>(edition, 'matches.json'),
      loadJson<Stadium[]>(edition, 'stadiums.json'),
      loadJson<Standing[]>(edition, 'standings.json'),
      loadJson<EditionWeatherData | WeatherInfo[]>(edition, 'weather.json'),
    ]);

  const weather = normalizeWeatherData(weatherRaw);

  return { meta, teams, players, coaches, matches, stadiums, standings, weather };
}

/** Support legacy array weather.json and new { stadiums, matches } shape. */
function normalizeWeatherData(
  raw: EditionWeatherData | WeatherInfo[] | null | undefined,
): EditionWeatherData {
  if (!raw) {
    return { updatedAt: null, stadiums: {}, matches: {} };
  }
  if (Array.isArray(raw)) {
    const stadiumMap: EditionWeatherData['stadiums'] = {};
    for (const entry of raw) {
      if (entry?.stadiumId) {
        const { stadiumId, ...rest } = entry;
        stadiumMap[stadiumId] = rest;
      }
    }
    return { updatedAt: null, stadiums: stadiumMap, matches: {} };
  }
  return {
    updatedAt: raw.updatedAt ?? null,
    stadiums: raw.stadiums ?? {},
    matches: raw.matches ?? {},
  };
}

export function stadiumWeatherList(
  weather: EditionWeatherData,
  stadiums: Stadium[],
): WeatherInfo[] {
  return stadiums.flatMap((stadium) => {
    const snap = weather.stadiums[stadium.id];
    if (!snap) return [];
    return [
      {
        stadiumId: stadium.id,
        city: snap.city ?? stadium.city,
        temperatureF: snap.temperatureF,
        condition: snap.condition,
        wind: snap.wind,
        updatedAt: snap.updatedAt,
      },
    ];
  });
}

export type AppData = Awaited<ReturnType<typeof loadAllData>>;
