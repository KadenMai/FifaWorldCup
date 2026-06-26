import { contentTypeForKey, dataPathToObjectKey } from '../../lib/dataPaths';

interface Env {
  DATA_BUCKET: R2Bucket;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  const pathParam = typeof params.path === 'string' ? params.path : '';
  const key = dataPathToObjectKey(pathParam);
  if (!key) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (!env.DATA_BUCKET) {
    return new Response(JSON.stringify({ error: 'DATA_BUCKET binding not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const object = await env.DATA_BUCKET.get(key);
  if (!object) {
    return new Response(JSON.stringify({ error: 'Not found', key }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const isMeta = key.endsWith('/meta.json') || key === 'data/index.json';
  const hasVersion = new URL(request.url).searchParams.has('v');
  const cacheControl = isMeta || !hasVersion ? 'no-store' : 'public, max-age=3600';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentTypeForKey(key),
      'Cache-Control': cacheControl,
      ...CORS_HEADERS,
    },
  });
};
