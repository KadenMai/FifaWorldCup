/**
 * Open-Meteo weather sync — shared by Node script and Cloudflare Worker.
 * @returns {Promise<{ weather: object, stats: object, skipped: boolean }>}
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

const WMO_CONDITIONS = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Freezing Drizzle',
  57: 'Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm & Hail',
  99: 'Thunderstorm & Hail',
};

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function wmoToCondition(code) {
  return WMO_CONDITIONS[code] ?? 'Unknown';
}

function formatWind(speedMph, directionDeg) {
  if (speedMph == null) return null;
  const mph = Math.round(speedMph);
  if (directionDeg == null) return `${mph} mph`;
  const idx = Math.round(directionDeg / 22.5) % 16;
  return `${mph} mph ${COMPASS[idx]}`;
}

function kickoffLocalIso(match) {
  const [hour, minute] = match.time.split(':');
  return `${match.date}T${hour.padStart(2, '0')}:${(minute ?? '00').padStart(2, '0')}`;
}

function nowInTimezone(timezone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

function isPastKickoff(match) {
  if (match.status === 'Finished') return true;
  if (!match.date || !match.time || !match.timezone) return false;
  return kickoffLocalIso(match) <= nowInTimezone(match.timezone);
}

export function hasRemainingMatches(matches) {
  return matches.some((m) => m.status === 'Scheduled' || m.status === 'Live');
}

function pickHourlyIndex(times, targetIso) {
  const exact = times.indexOf(targetIso);
  if (exact >= 0) return exact;
  let best = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - new Date(targetIso).getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

function hourlyToWeather(hourly, index, source) {
  if (index < 0) return null;
  const temp = hourly.temperature_2m?.[index];
  const code = hourly.weather_code?.[index];
  const windSpeed = hourly.wind_speed_10m?.[index];
  const windDir = hourly.wind_direction_10m?.[index];
  const atKickoff = hourly.time?.[index];
  if (temp == null && code == null) return null;
  return {
    temperatureF: temp != null ? Math.round(temp) : null,
    condition: code != null ? wmoToCondition(code) : undefined,
    wind: formatWind(windSpeed, windDir),
    atKickoff,
    fetchedAt: new Date().toISOString(),
    source,
  };
}

function currentToStadiumWeather(current) {
  if (!current) return null;
  return {
    temperatureF: current.temperature_2m != null ? Math.round(current.temperature_2m) : null,
    condition: current.weather_code != null ? wmoToCondition(current.weather_code) : undefined,
    wind: formatWind(current.wind_speed_10m, current.wind_direction_10m),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Open-Meteo ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchStadiumCurrent(stadium) {
  const params = new URLSearchParams({
    latitude: String(stadium.latitude),
    longitude: String(stadium.longitude),
    current: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
  });
  const data = await fetchJson(`${FORECAST_URL}?${params}`);
  return currentToStadiumWeather(data.current);
}

async function fetchArchiveDay(stadium, date, timezone) {
  const params = new URLSearchParams({
    latitude: String(stadium.latitude),
    longitude: String(stadium.longitude),
    start_date: date,
    end_date: date,
    hourly: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
    timezone,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
  });
  return fetchJson(`${ARCHIVE_URL}?${params}`);
}

function maxForecastDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 15);
  return d.toISOString().slice(0, 10);
}

async function fetchForecastRange(stadium, startDate, endDate, timezone) {
  const cap = maxForecastDate();
  const end = endDate > cap ? cap : endDate;
  if (startDate > end) return null;
  const params = new URLSearchParams({
    latitude: String(stadium.latitude),
    longitude: String(stadium.longitude),
    hourly: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
    start_date: startDate,
    end_date: end,
    timezone,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
  });
  return fetchJson(`${FORECAST_URL}?${params}`);
}

async function fetchForecastDay(stadium, date, timezone) {
  return fetchForecastRange(stadium, date, date, timezone);
}

/** Normalize legacy array weather.json or partial data into map shape. */
export function normalizeWeatherData(raw) {
  if (!raw || typeof raw !== 'object') {
    return { updatedAt: null, stadiums: {}, matches: {} };
  }
  if (Array.isArray(raw)) {
    const stadiums = {};
    for (const entry of raw) {
      if (entry?.stadiumId) {
        const { stadiumId, ...rest } = entry;
        stadiums[stadiumId] = rest;
      }
    }
    return { updatedAt: null, stadiums, matches: {} };
  }
  return {
    updatedAt: raw.updatedAt ?? null,
    stadiums: raw.stadiums ?? {},
    matches: raw.matches ?? {},
  };
}

/**
 * @param {object} options
 * @param {object[]} options.stadiums
 * @param {object[]} options.matches
 * @param {Record<string, string>} options.timezoneByStadium
 * @param {object} options.existingWeather
 * @param {boolean} [options.force=false]
 * @param {number} [options.delayMs=120]
 * @param {(msg: string) => void} [options.log=console.log]
 */
export async function runWeatherSync({
  stadiums,
  matches,
  timezoneByStadium,
  existingWeather,
  force = false,
  delayMs = 120,
  log = console.log,
}) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  if (!hasRemainingMatches(matches)) {
    log('No scheduled or live matches remain — skipping weather sync.');
    return { weather: normalizeWeatherData(existingWeather), stats: {}, skipped: true };
  }

  const stadiumById = Object.fromEntries(stadiums.map((s) => [s.id, s]));
  const base = normalizeWeatherData(existingWeather);
  const weather = {
    updatedAt: new Date().toISOString(),
    stadiums: { ...base.stadiums },
    matches: { ...base.matches },
  };

  let stadiumUpdated = 0;
  for (const stadium of stadiums) {
    if (stadium.latitude == null || stadium.longitude == null) continue;
    try {
      const current = await fetchStadiumCurrent(stadium);
      weather.stadiums[stadium.id] = { city: stadium.city, ...current };
      stadiumUpdated++;
      log(`Stadium ${stadium.id}: ${current.temperatureF}°F ${current.condition}`);
    } catch (err) {
      log(`Stadium ${stadium.id} failed: ${err.message}`);
    }
    await sleep(delayMs);
  }

  const archiveCache = new Map();
  const forecastCache = new Map();
  let matchUpdated = 0;
  let matchSkipped = 0;

  const matchList = matches.filter((m) => m.stadiumId && stadiumById[m.stadiumId]);

  const archiveKeys = new Set();
  for (const match of matchList) {
    if (!isPastKickoff(match)) continue;
    const existing = weather.matches[match.id];
    if (existing?.source === 'archive' && !force) continue;
    archiveKeys.add(`${match.stadiumId}|${match.date}`);
  }

  for (const key of archiveKeys) {
    const [stadiumId, date] = key.split('|');
    const stadium = stadiumById[stadiumId];
    const timezone = timezoneByStadium[stadiumId] ?? 'UTC';
    try {
      const data = await fetchArchiveDay(stadium, date, timezone);
      archiveCache.set(key, data.hourly);
      log(`Archive ${stadiumId} ${date}`);
    } catch (err) {
      log(`Archive ${key} failed: ${err.message}`);
    }
    await sleep(delayMs);
  }

  const forecastByStadium = new Map();
  const forecastCap = maxForecastDate();
  for (const match of matchList) {
    if (isPastKickoff(match)) continue;
    if (match.date > forecastCap) continue;
    if (!forecastByStadium.has(match.stadiumId)) {
      forecastByStadium.set(match.stadiumId, { min: match.date, max: match.date });
    } else {
      const range = forecastByStadium.get(match.stadiumId);
      if (match.date < range.min) range.min = match.date;
      if (match.date > range.max) range.max = match.date;
    }
  }

  for (const [stadiumId, range] of forecastByStadium) {
    const stadium = stadiumById[stadiumId];
    const timezone = timezoneByStadium[stadiumId] ?? 'UTC';
    try {
      const data = await fetchForecastRange(stadium, range.min, range.max, timezone);
      if (data?.hourly) {
        forecastCache.set(stadiumId, data.hourly);
        const cappedMax = range.max > forecastCap ? forecastCap : range.max;
        log(`Forecast ${stadiumId} ${range.min}..${cappedMax}`);
      }
    } catch (err) {
      log(`Forecast batch ${stadiumId} failed: ${err.message}`);
    }
    await sleep(delayMs);
  }

  for (const match of matchList) {
    if (isPastKickoff(match)) continue;
    if (match.date > forecastCap) continue;
    if (forecastCache.has(match.stadiumId)) {
      const hourly = forecastCache.get(match.stadiumId);
      if (pickHourlyIndex(hourly.time, kickoffLocalIso(match)) >= 0) continue;
    }
    const stadium = stadiumById[match.stadiumId];
    const timezone = timezoneByStadium[match.stadiumId] ?? match.timezone ?? 'UTC';
    try {
      const data = await fetchForecastDay(stadium, match.date, timezone);
      if (data?.hourly) {
        const existing = forecastCache.get(match.stadiumId);
        if (existing) {
          const merged = { ...existing };
          for (const key of Object.keys(data.hourly)) {
            if (Array.isArray(data.hourly[key])) {
              merged[key] = [...(merged[key] ?? []), ...data.hourly[key]];
            }
          }
          merged.time = [...new Set(merged.time)].sort();
          forecastCache.set(match.stadiumId, merged);
        } else {
          forecastCache.set(match.stadiumId, data.hourly);
        }
        log(`Forecast fallback ${match.id} ${match.date}`);
      }
    } catch (err) {
      log(`Forecast fallback ${match.id} failed: ${err.message}`);
    }
    await sleep(delayMs);
  }

  for (const match of matchList) {
    const targetIso = kickoffLocalIso(match);
    const past = isPastKickoff(match);

    if (past && weather.matches[match.id]?.source === 'archive' && !force) {
      matchSkipped++;
      continue;
    }

    let snapshot = null;
    if (past) {
      const hourly = archiveCache.get(`${match.stadiumId}|${match.date}`);
      if (hourly) {
        snapshot = hourlyToWeather(hourly, pickHourlyIndex(hourly.time, targetIso), 'archive');
      }
    } else {
      const hourly = forecastCache.get(match.stadiumId);
      if (hourly) {
        snapshot = hourlyToWeather(hourly, pickHourlyIndex(hourly.time, targetIso), 'forecast');
      }
    }

    if (!snapshot) {
      log(`No weather for ${match.id} at ${targetIso}`);
      continue;
    }

    const prev = JSON.stringify(weather.matches[match.id] ?? null);
    const next = JSON.stringify(snapshot);
    if (prev !== next) {
      weather.matches[match.id] = snapshot;
      matchUpdated++;
      log(`${match.id} (${past ? 'archive' : 'forecast'}): ${snapshot.temperatureF}°F ${snapshot.condition}`);
    }
  }

  return {
    weather,
    skipped: false,
    stats: { stadiumUpdated, matchUpdated, matchSkipped },
  };
}
