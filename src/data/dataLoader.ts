import type {
  Coach,
  Match,
  Player,
  Stadium,
  Standing,
  Team,
  WeatherInfo,
} from '../types';

/** Bump when JSON data changes to bust browser/CDN cache */
const DATA_VERSION = '202606251926';

let runtimeDataVersion = DATA_VERSION;

export function setRuntimeDataVersion(version: string): void {
  runtimeDataVersion = version;
}

export function getRuntimeDataVersion(): string {
  return runtimeDataVersion;
}

export async function loadJson<T>(fileName: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${fileName}?v=${runtimeDataVersion}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}`);
  }

  return response.json();
}

export async function loadAllData() {
  const [teams, players, coaches, matches, stadiums, standings, weather] =
    await Promise.all([
      loadJson<Team[]>('teams.json'),
      loadJson<Player[]>('players.json'),
      loadJson<Coach[]>('coaches.json'),
      loadJson<Match[]>('matches.json'),
      loadJson<Stadium[]>('stadiums.json'),
      loadJson<Standing[]>('standings.json'),
      loadJson<WeatherInfo[]>('weather.json'),
    ]);

  return { teams, players, coaches, matches, stadiums, standings, weather };
}

export type AppData = Awaited<ReturnType<typeof loadAllData>>;
