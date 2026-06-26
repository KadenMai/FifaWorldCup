import { fetchJsonOrNull } from '../utils/fetchJson';

export interface SiteConfig {
  defaultEdition: string | null;
}

function localDefaultEdition(): string | null {
  const fallback = import.meta.env.VITE_DEFAULT_EDITION?.trim() ?? '';
  return /^\d{4}$/.test(fallback) ? fallback : null;
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const payload = await fetchJsonOrNull<{ defaultEdition?: string | null }>('/api/config', {
      cache: 'no-store',
    });
    if (payload) {
      const raw = payload.defaultEdition?.trim() ?? '';
      const defaultEdition = /^\d{4}$/.test(raw) ? raw : null;
      return { defaultEdition };
    }
  } catch {
    // Network error — fall through to local default
  }

  return { defaultEdition: localDefaultEdition() };
}
