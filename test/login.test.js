import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Auth Login Agent Bypass Behavior', () => {
  function getLoginParams(search) {
    const params = new URLSearchParams(search);
    const isAgentBypass = params.get('agent_bypass') === 'true';
    const isAutoBypass =
      params.get('agent_bypass') === 'auto' ||
      (isAgentBypass && params.get('auto') === 'true');
    const returnTo = params.get('returnTo');
    const email = params.get('email');

    const apiUrl = 'https://api.rajchandra.me';
    let bypassUrl = null;
    if (isAgentBypass || isAutoBypass) {
      const url = new URL(`${apiUrl}/identity/auth/agent-bypass`);
      if (returnTo) url.searchParams.set('returnTo', returnTo);
      if (email) url.searchParams.set('email', email);
      bypassUrl = url.toString();
    }

    return {
      isAgentBypass,
      isAutoBypass,
      bypassUrl,
    };
  }

  test('normal user navigation hides the agent login button', () => {
    const { isAgentBypass, isAutoBypass } = getLoginParams('');
    assert.equal(isAgentBypass, false, 'Agent login button must be hidden for normal users');
    assert.equal(isAutoBypass, false, 'Should not auto-redirect');
  });

  test('normal user redirect with returnTo hides the agent login button', () => {
    const { isAgentBypass, isAutoBypass } = getLoginParams('?returnTo=https://finance.rajchandra.me');
    assert.equal(isAgentBypass, false, 'Agent login button must be hidden when returnTo is present without agent_bypass=true');
    assert.equal(isAutoBypass, false, 'Should not auto-redirect');
  });

  test('falsy or invalid agent_bypass values hide the button', () => {
    assert.equal(getLoginParams('?agent_bypass=false').isAgentBypass, false);
    assert.equal(getLoginParams('?agent_bypass=1').isAgentBypass, false);
    assert.equal(getLoginParams('?agent_bypass=null').isAgentBypass, false);
  });

  test('agent_bypass=true displays the agent login button without auto-redirecting', () => {
    const { isAgentBypass, isAutoBypass, bypassUrl } = getLoginParams(
      '?agent_bypass=true&returnTo=example.com'
    );
    assert.equal(isAgentBypass, true, 'Agent login button must be shown when agent_bypass=true');
    assert.equal(isAutoBypass, false, 'Must not auto-redirect so the user/agent can see and click the button');
    assert.equal(
      bypassUrl,
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=example.com'
    );
  });

  test('agent_bypass=true with email preserves email in bypass url', () => {
    const { isAgentBypass, isAutoBypass, bypassUrl } = getLoginParams(
      '?agent_bypass=true&returnTo=https://finance.rajchandra.me&email=custom-agent@rajchandra.me'
    );
    assert.equal(isAgentBypass, true);
    assert.equal(isAutoBypass, false);
    assert.equal(
      bypassUrl,
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=https%3A%2F%2Ffinance.rajchandra.me&email=custom-agent%40rajchandra.me'
    );
  });

  test('agent_bypass=auto triggers auto-redirect', () => {
    const { isAutoBypass, bypassUrl } = getLoginParams('?agent_bypass=auto&returnTo=https://finance.rajchandra.me');
    assert.equal(isAutoBypass, true, 'Should trigger auto-redirect when explicit auto bypass is requested');
    assert.equal(
      bypassUrl,
      'https://api.rajchandra.me/identity/auth/agent-bypass?returnTo=https%3A%2F%2Ffinance.rajchandra.me'
    );
  });
});
