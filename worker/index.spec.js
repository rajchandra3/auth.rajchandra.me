import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import worker, {
  NO_CACHE_PATHS,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from './index.js';

function makeMockEnv(options = {}) {
  const {
    status = 200,
    statusText = 'OK',
    headers = {},
    body = 'asset-body',
  } = options;
  const calls = [];
  return {
    calls,
    env: {
      ASSETS: {
        async fetch(request) {
          calls.push(request);
          return new Response(body, {
            status,
            statusText,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...headers,
            },
          });
        },
      },
    },
  };
}

describe('auth.rajchandra.me Cloudflare Worker', () => {
  it('applies all default security headers matching nginx/meauth-auth.conf without overwriting existing ones', () => {
    const fresh = withSecurityHeaders();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      assert.equal(fresh.get(key), value);
    }
    assert.equal(
      fresh.get('Permissions-Policy'),
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    assert.equal(fresh.get('X-Frame-Options'), 'DENY');

    const existing = withSecurityHeaders(
      new Headers({ 'X-Frame-Options': 'SAMEORIGIN' })
    );
    assert.equal(existing.get('X-Frame-Options'), 'SAMEORIGIN');
    assert.equal(
      existing.get('Strict-Transport-Security'),
      SECURITY_HEADERS['Strict-Transport-Security']
    );
  });

  it('rejects non-GET/HEAD methods with 405 and Allow header', async () => {
    const { env, calls } = makeMockEnv();
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
      const res = await worker.fetch(
        new Request('https://auth.rajchandra.me/', { method }),
        env
      );
      assert.equal(res.status, 405);
      assert.equal(res.headers.get('Allow'), 'GET, HEAD');
      assert.equal(await res.text(), 'Method Not Allowed');
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        assert.equal(res.headers.get(key), value);
      }
    }
    assert.equal(calls.length, 0);
  });

  it('serves GET and HEAD /healthz with 200, no-store, and security headers', async () => {
    const { env, calls } = makeMockEnv();

    const getRes = await worker.fetch(
      new Request('https://auth.rajchandra.me/healthz?probe=1'),
      env
    );
    assert.equal(getRes.status, 200);
    assert.equal(getRes.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.equal(getRes.headers.get('Cache-Control'), 'no-store');
    assert.equal(await getRes.text(), 'ok\n');
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      assert.equal(getRes.headers.get(key), value);
    }

    const headRes = await worker.fetch(
      new Request('https://auth.rajchandra.me/healthz', { method: 'HEAD' }),
      env
    );
    assert.equal(headRes.status, 200);
    assert.equal(headRes.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.equal(headRes.headers.get('Cache-Control'), 'no-store');
    assert.equal(await headRes.text(), '');
    assert.equal(calls.length, 0);
  });

  it('enforces no-store, no-cache, must-revalidate on /, /index.html, and /version.json', async () => {
    assert.deepEqual([...NO_CACHE_PATHS], ['/', '/index.html', '/version.json']);

    const { env, calls } = makeMockEnv({
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: '{"version":"2.1.1"}',
    });

    for (const path of ['/', '/index.html', '/version.json', '/version.json?t=123']) {
      const res = await worker.fetch(
        new Request(`https://auth.rajchandra.me${path}`),
        env
      );
      assert.equal(res.status, 200);
      assert.equal(
        res.headers.get('Cache-Control'),
        'no-store, no-cache, must-revalidate'
      );
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        assert.equal(res.headers.get(key), value);
      }
      assert.equal(await res.text(), '{"version":"2.1.1"}');
    }

    const headVersion = await worker.fetch(
      new Request('https://auth.rajchandra.me/version.json', {
        method: 'HEAD',
      }),
      env
    );
    assert.equal(headVersion.status, 200);
    assert.equal(
      headVersion.headers.get('Cache-Control'),
      'no-store, no-cache, must-revalidate'
    );
    assert.equal(await headVersion.text(), '');
    assert.equal(calls.length, 5);
  });

  it('forwards redirect and static asset responses with security headers and preserves cache policy', async () => {
    const redirectMock = makeMockEnv({
      status: 307,
      statusText: 'Temporary Redirect',
      headers: { Location: '/' },
      body: null,
    });
    const redirectRes = await worker.fetch(
      new Request('https://auth.rajchandra.me/index.html'),
      redirectMock.env
    );
    assert.equal(redirectRes.status, 307);
    assert.equal(redirectRes.headers.get('Location'), '/');
    assert.equal(
      redirectRes.headers.get('Cache-Control'),
      'no-store, no-cache, must-revalidate'
    );

    const staticMock = makeMockEnv({
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: 'console.log("ok")',
    });
    const staticGet = await worker.fetch(
      new Request('https://auth.rajchandra.me/assets/index-abc123.js'),
      staticMock.env
    );
    assert.equal(staticGet.status, 200);
    assert.equal(
      staticGet.headers.get('Cache-Control'),
      'public, max-age=31536000, immutable'
    );
    assert.equal(await staticGet.text(), 'console.log("ok")');
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      assert.equal(staticGet.headers.get(key), value);
    }

    const staticHead = await worker.fetch(
      new Request('https://auth.rajchandra.me/assets/index-abc123.js', {
        method: 'HEAD',
      }),
      staticMock.env
    );
    assert.equal(staticHead.status, 200);
    assert.equal(await staticHead.text(), '');
    assert.equal(staticMock.calls.length, 2);
  });
});
