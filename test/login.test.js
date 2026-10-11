import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getRedirectTarget,
  extractDomain,
  getRedirectDomain,
  buildLoginUrl,
  buildAgentBypassUrl,
  isAgentBypassActive,
  isAutoBypassActive,
} from '../src/lib/login-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Auth Login Helpers & Domain Extraction', () => {
  test('returns null when no redirect parameter is present', () => {
    assert.equal(getRedirectTarget(''), null);
    assert.equal(getRedirectTarget('?foo=bar'), null);
    assert.equal(getRedirectTarget('?returnTo='), null);
    assert.equal(getRedirectDomain(''), null);
    assert.equal(getRedirectDomain('?foo=bar'), null);
  });

  test('extractDomain extracts clean hostname without path or query params', () => {
    assert.equal(
      extractDomain('https://lia.rajchandra.me/studio?step=1'),
      'lia.rajchandra.me'
    );
    assert.equal(
      extractDomain('https://finance.rajchandra.me/transactions'),
      'finance.rajchandra.me'
    );
    assert.equal(
      extractDomain('http://portfolio.rajchandra.me/projects'),
      'portfolio.rajchandra.me'
    );
    assert.equal(
      extractDomain('example.com/app/dashboard'),
      'example.com'
    );
    assert.equal(extractDomain(''), null);
    assert.equal(extractDomain(null), null);
  });

  test('getRedirectDomain extracts domain from returnTo, redirect_to, or redirect', () => {
    assert.equal(
      getRedirectDomain('?returnTo=https://lia.rajchandra.me/studio?step=1'),
      'lia.rajchandra.me'
    );
    assert.equal(
      getRedirectDomain('?redirect_to=https://finance.rajchandra.me'),
      'finance.rajchandra.me'
    );
    assert.equal(
      getRedirectDomain('?redirect=https://portfolio.rajchandra.me/view'),
      'portfolio.rajchandra.me'
    );
  });

  test('buildLoginUrl preserves full destination path in returnTo query param', () => {
    const base = 'https://api.rajchandra.me/identity/auth/google/start';
    assert.equal(buildLoginUrl('', base), base);
    assert.equal(
      buildLoginUrl('?returnTo=https://lia.rajchandra.me/studio?step=1', base),
      `${base}?returnTo=${encodeURIComponent('https://lia.rajchandra.me/studio?step=1')}`
    );
  });

  test('buildAgentBypassUrl preserves full returnTo and email', () => {
    const apiUrl = 'https://api.rajchandra.me';
    assert.equal(
      buildAgentBypassUrl(
        '?agent_bypass=true&returnTo=https://lia.rajchandra.me/studio?step=1&email=agent@rajchandra.me',
        apiUrl
      ),
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=https%3A%2F%2Flia.rajchandra.me%2Fstudio%3Fstep%3D1&email=agent%40rajchandra.me'
    );
  });

  test('isAgentBypassActive and isAutoBypassActive behavior', () => {
    assert.equal(isAgentBypassActive(''), false);
    assert.equal(isAgentBypassActive('?agent_bypass=false'), false);
    assert.equal(isAgentBypassActive('?agent_bypass=true'), true);

    assert.equal(isAutoBypassActive(''), false);
    assert.equal(isAutoBypassActive('?agent_bypass=auto'), true);
    assert.equal(isAutoBypassActive('?agent_bypass=true&auto=true'), true);
  });
});

describe('Login.jsx Impeccable Trust Requirements', () => {
  const loginJsxPath = path.resolve(__dirname, '../src/pages/Login.jsx');
  const source = fs.readFileSync(loginJsxPath, 'utf8');

  test('does not contain "Welcome back" or suspicious raw security badges', () => {
    assert.equal(source.includes('Welcome back'), false);
    assert.equal(source.includes('login-badge'), false);
    assert.equal(source.includes('Protected by Identity Platform'), false);
  });

  test('informs where the user is coming from and where they will be redirected back', () => {
    assert.match(source, /You came from \$\{redirectDomain\} and will be redirected back after signing in\./);
  });

  test('provides login CTA buttons only in action area', () => {
    assert.match(source, /google-login-btn/);
    assert.match(source, /Continue with Google/);
    assert.match(source, /agent-login-btn/);
  });

  test('informs that basic profile details are shared with domain only', () => {
    assert.match(source, /By signing in, you will be sharing basic profile details with/);
    assert.match(source, /\{redirectDomain\}/);
    // Must NOT display full redirectTarget path in disclosure
    assert.equal(source.includes('{redirectTarget}'), false);
  });
});
