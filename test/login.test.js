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

describe('Unslop Craft & Design System Invariants', () => {
  const readSrc = (relPath) =>
    fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');

  const indexCss = readSrc('src/index.css');
  const loginJsx = readSrc('src/pages/Login.jsx');
  const navbarJsx = readSrc('src/components/Navbar.jsx');
  const profileJsx = readSrc('src/pages/Profile.jsx');
  const usersJsx = readSrc('src/pages/admin/Users.jsx');
  const userDetailJsx = readSrc('src/pages/admin/UserDetail.jsx');

  test('removes radial color blobs, decorative rings, pulsing glows, and transition-all from index.css and Login.jsx', () => {
    assert.equal(indexCss.includes('stage-glow'), false);
    assert.equal(indexCss.includes('stage-rings'), false);
    assert.equal(indexCss.includes('ping-pulse'), false);
    assert.equal(indexCss.includes('transition: all'), false);
    assert.equal(loginJsx.includes('stage-glow'), false);
    assert.equal(loginJsx.includes('connector-pulse'), false);
    assert.equal(loginJsx.includes('disclosure-icon'), false);
  });

  test('unifies brand breadcrumb across Login.jsx and Navbar.jsx without legacy @auth mark', () => {
    assert.equal(navbarJsx.includes('@</span>auth'), false);
    assert.match(navbarJsx, /rajchandra\.me/);
    assert.match(navbarJsx, /identity/);
  });

  test('enforces sentence-case headings and eliminates uppercase tracking-wider across authenticated views', () => {
    for (const [name, content] of [
      ['Profile.jsx', profileJsx],
      ['Users.jsx', usersJsx],
      ['UserDetail.jsx', userDetailJsx],
    ]) {
      assert.equal(content.includes('uppercase'), false, `${name} should not contain uppercase class`);
      assert.equal(content.includes('tracking-wider'), false, `${name} should not contain tracking-wider class`);
    }
  });

  test('replaces stale MongoDB ID label with Record ID and eliminates native browser alert() calls', () => {
    assert.equal(userDetailJsx.includes('MongoDB ID'), false);
    assert.match(userDetailJsx, /Record ID/);
    assert.equal(usersJsx.includes('alert('), false);
    assert.equal(userDetailJsx.includes('alert('), false);
  });

  test('applies tabular-nums to numeric figures, dates, and IDs across Profile, Users, and UserDetail', () => {
    assert.match(profileJsx, /tabular-nums/);
    assert.match(usersJsx, /tabular-nums/);
    assert.match(userDetailJsx, /tabular-nums/);
  });
});

