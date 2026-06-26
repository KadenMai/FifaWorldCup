export class R2Store {
  constructor(private readonly bucket: R2Bucket) {}

  async readText(key: string): Promise<string | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return object.text();
  }

  async readJson<T>(key: string): Promise<T> {
    const text = await this.readText(key);
    if (text == null) {
      throw new Error(`Object not found: ${key}`);
    }
    return JSON.parse(text) as T;
  }

  async writeJson(key: string, data: unknown): Promise<void> {
    const body = `${JSON.stringify(data, null, 2)}\n`;
    await this.bucket.put(key, body, {
      httpMetadata: { contentType: 'application/json' },
    });
  }
}
