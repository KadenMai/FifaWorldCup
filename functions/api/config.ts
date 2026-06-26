interface Env {
  DEFAULT_EDITION?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = env.DEFAULT_EDITION?.trim() ?? '';
  const defaultEdition = /^\d{4}$/.test(raw) ? raw : null;

  return new Response(JSON.stringify({ defaultEdition }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
};
