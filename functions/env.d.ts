/// <reference types="@cloudflare/workers-types" />

interface Env {
  DATA_BUCKET: R2Bucket;
  ADMIN_API_KEY: string;
  DEFAULT_EDITION?: string;
}
