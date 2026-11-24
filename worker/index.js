export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

export const NO_CACHE_PATHS = new Set(['/', '/index.html', '/version.json']);

export function withSecurityHeaders(sourceHeaders) {
  const headers = new Headers(sourceHeaders);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
      const headers = withSecurityHeaders();
      headers.set('Allow', 'GET, HEAD');
      return new Response('Method Not Allowed', { status: 405, headers });
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/healthz') {
      const headers = withSecurityHeaders();
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      return new Response(method === 'HEAD' ? null : 'ok\n', {
        status: 200,
        headers,
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = withSecurityHeaders(assetResponse.headers);

    if (NO_CACHE_PATHS.has(pathname)) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    return new Response(method === 'HEAD' ? null : assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
