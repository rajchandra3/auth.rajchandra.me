import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getRedirectTarget,
  buildLoginUrl,
  buildAgentBypassUrl,
  isAgentBypassActive,
  isAutoBypassActive,
} from '../src/lib/login-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Auth Login Helpers & Redirect Targeting', () => {
  test('returns null when no redirect parameter is present', () => {
    assert.equal(getRedirectTarget(''), null);
    assert.equal(getRedirectTarget('?foo=bar'), null);
    assert.equal(getRedirectTarget('?returnTo='), null);
    assert.equal(getRedirectTarget('?returnTo=   '), null);
  });

  test('extracts redirect target from returnTo, redirect_to, or redirect', () => {
    assert.equal(
      getRedirectTarget('?returnTo=https://finance.rajchandra.me'),
      'https://finance.rajchandra.me'
    );
    assert.equal(
      getRedirectTarget('?redirect_to=https://portfolio.rajchandra.me'),
      'https://portfolio.rajchandra.me'
    );
    assert.equal(
      getRedirectTarget('?redirect=https://example.com/app'),
      'https://example.com/app'
    );
  });

  test('buildLoginUrl constructs Google OAuth url with or without returnTo', () => {
    const base = 'https://api.rajchandra.me/identity/auth/google/start';
    assert.equal(buildLoginUrl('', base), base);
    assert.equal(
      buildLoginUrl('?returnTo=https://finance.rajchandra.me', base),
      `${base}?returnTo=${encodeURIComponent('https://finance.rajchandra.me')}`
    );
  });

  test('buildAgentBypassUrl appends returnTo and email when present', () => {
    const apiUrl = 'https://api.rajchandra.me';
    assert.equal(
      buildAgentBypassUrl('?agent_bypass=true', apiUrl),
      'https://api.rajchandra.me/identity/auth/agent-bypass'
    );
    assert.equal(
      buildAgentBypassUrl('?agent_bypass=true&returnTo=https://finance.rajchandra.me', apiUrl),
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=https%3A%2F%2Ffinance.rajchandra.me'
    );
    assert.equal(
      buildAgentBypassUrl(
        '?agent_bypass=true&returnTo=https://finance.rajchandra.me&email=agent@rajchandra.me',
        apiUrl
      ),
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=https%3A%2F%2Ffinance.rajchandra.me&email=agent%40rajchandra.me'
    );
  });

  test('isAgentBypassActive gates button strictly on agent_bypass=true', () => {
    assert.equal(isAgentBypassActive(''), false);
    assert.equal(isAgentBypassActive('?agent_bypass=false'), false);
    assert.equal(isAgentBypassActive('?agent_bypass=auto'), false);
    assert.equal(isAgentBypassActive('?agent_bypass=true'), true);
  });

  test('isAutoBypassActive detects agent_bypass=auto or agent_bypass=true&auto=true', () => {
    assert.equal(isAutoBypassActive(''), false);
    assert.equal(isAutoBypassActive('?agent_bypass=true'), false);
    assert.equal(isAutoBypassActive('?agent_bypass=auto'), true);
    assert.equal(isAutoBypassActive('?agent_bypass=true&auto=true'), true);
  });
});

describe('Login.jsx Template Requirements', () => {
  const loginJsxPath = path.resolve(__dirname, '../src/pages/Login.jsx');
  const source = fs.readFileSync(loginJsxPath, 'utf8');

  test('does not contain "Welcome back"', () => {
    assert.equal(source.includes('Welcome back'), false);
  });

  test('does not contain app name in header/domain', () => {
    assert.equal(source.includes('login-domain'), false);
    assert.equal(source.includes('rajchandra.me</span>'), false);
  });

  test('does not contain security or identity platform v2 mentions', () => {
    assert.equal(source.includes('Protected by Identity Platform'), false);
    assert.equal(source.includes('login-badge'), false);
    assert.equal(source.toLowerCase().includes('security'), false);
  });

  test('contains clear sign-in guidance and conditional sharing disclosure', () => {
    assert.match(source, /Sign in/);
    assert.match(source, /Log in with your Google account/);
    assert.match(source, /By logging in you will be sharing information with/);
  });
});
