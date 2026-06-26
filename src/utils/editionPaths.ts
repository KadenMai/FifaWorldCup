export function editionPath(edition: string, suffix = ''): string {
  if (!suffix || suffix === '/') {
    return `/${edition}`;
  }
  const normalized = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `/${edition}${normalized}`;
}

export function isEditionId(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}$/.test(value));
}
