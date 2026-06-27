/// <reference types="@cloudflare/workers-types" />

interface Env {
  DATA_BUCKET: R2Bucket;
  ADMIN_API_KEY: string;
  WEATHER_CRON_SECRET?: string;
  DEFAULT_EDITION?: string;
}
