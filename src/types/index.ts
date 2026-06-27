export type MatchStatus = 'Scheduled' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  flag?: string;
  flagCode?: string;
  group?: string;
  confederation?: string;
  coachId?: string;
  fifaRanking?: number | null;
  qualified?: boolean;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position?: string;
  shirtNumber?: number | null;
  club?: string;
  age?: number | null;
}

export interface Coach {
  id: string;
  teamId: string;
  name: string;
  nationality?: string;
  notes?: string;
}

export interface MatchWeather {
  temperatureF?: number | null;
  condition?: string;
  wind?: string | null;
  atKickoff?: string;
  fetchedAt?: string;
  source?: 'archive' | 'forecast' | 'current';
}

export interface Match {
  id: string;
  date: string;
  time: string;
  timezone: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  round?: string;
  group?: string;
  stadiumId?: string;
  referee?: string;
  notes?: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
}

export interface Standing {
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
}

export interface WeatherSnapshot {
  temperatureF?: number | null;
  condition?: string;
  wind?: string | null;
  updatedAt?: string | null;
  atKickoff?: string;
  fetchedAt?: string;
  source?: 'archive' | 'forecast';
  city?: string;
}

export interface EditionWeatherData {
  updatedAt: string | null;
  stadiums: Record<string, WeatherSnapshot>;
  matches: Record<string, WeatherSnapshot>;
}

export interface WeatherInfo {
  stadiumId: string;
  city: string;
  temperatureF?: number | null;
  condition?: string;
  wind?: string | null;
  updatedAt?: string | null;
}
