const ADMIN_KEY_STORAGE = 'fifa_admin_api_key';

export function getStoredAdminKey(): string {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function storeAdminKey(key: string, remember: boolean): void {
  try {
    if (remember && key.trim()) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
    } else {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  } catch {
    /* ignore */
  }
}
