export interface GitHubFile {
  content: string;
  sha: string;
}

export class GitHubStore {
  private readonly api: string;
  private readonly branch: string;

  constructor(
    private readonly token: string,
    repo: string,
    branch = 'main'
  ) {
    this.api = `https://api.github.com/repos/${repo}`;
    this.branch = branch;
  }

  async readText(path: string): Promise<GitHubFile> {
    const encoded = encodeURIComponent(path).replace(/%2F/g, '/');
    const response = await fetch(`${this.api}/contents/${encoded}?ref=${this.branch}`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error(`GitHub read failed (${response.status}): ${path}`);
    }
    const payload = (await response.json()) as { content: string; sha: string };
    const content = fromBase64Utf8(payload.content);
    return { content, sha: payload.sha };
  }

  async readJson<T>(path: string): Promise<{ data: T; sha: string }> {
    const file = await this.readText(path);
    return { data: JSON.parse(file.content) as T, sha: file.sha };
  }

  async writeText(path: string, content: string, sha: string, message: string): Promise<void> {
    const encoded = encodeURIComponent(path).replace(/%2F/g, '/');
    const response = await fetch(`${this.api}/contents/${encoded}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({
        message,
        content: toBase64Utf8(content),
        sha,
        branch: this.branch,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub write failed (${response.status}): ${body}`);
    }
  }

  async writeJson(path: string, data: unknown, sha: string, message: string): Promise<void> {
    const text = `${JSON.stringify(data, null, 2)}\n`;
    await this.writeText(path, text, sha, message);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  }
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
