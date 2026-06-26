function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const isJson =
    contentType.includes('application/json') || contentType.includes('+json');

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  if (!isJson && looksLikeHtml(text)) {
    throw new Error(
      `Expected JSON from ${url} but received HTML. The file or API route may be missing from the deployment.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

/** Like fetchJson but returns null when the response is HTML (e.g. SPA fallback for /api/*). */
export async function fetchJsonOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    return await fetchJson<T>(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('HTML')) {
      return null;
    }
    throw error;
  }
}
