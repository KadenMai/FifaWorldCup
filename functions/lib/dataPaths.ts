/** R2 object keys mirror browser paths: data/{edition}/file.json */
export function editionDataPaths(edition: string) {
  const base = `data/${edition}`;
  return {
    matches: `${base}/matches.json`,
    standings: `${base}/standings.json`,
    teams: `${base}/teams.json`,
    stadiums: `${base}/stadiums.json`,
    meta: `${base}/meta.json`,
  };
}

/** Map /api/data/* path segment to an R2 object key. Returns null for invalid paths. */
export function dataPathToObjectKey(pathParam: string): string | null {
  const normalized = pathParam.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!normalized || normalized.includes('..')) return null;
  if (!/^data\/[\w./-]+$/.test(`data/${normalized}`)) return null;
  return `data/${normalized}`;
}

export function contentTypeForKey(key: string): string {
  if (key.endsWith('.geojson')) return 'application/geo+json';
  return 'application/json';
}
