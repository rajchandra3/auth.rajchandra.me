export function getRedirectTarget(search) {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const target =
    params.get('returnTo') ||
    params.get('redirect_to') ||
    params.get('redirect');

  if (!target || !target.trim()) return null;
  return target.trim();
}

export function extractDomain(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') return null;
  const clean = targetUrl.trim();
  if (!clean) return null;

  try {
    const toParse = clean.startsWith('http://') || clean.startsWith('https://')
      ? clean
      : `https://${clean}`;
    const url = new URL(toParse);
    if (!url.hostname) return null;
    return url.hostname.toLowerCase();
  } catch {
    const match = clean.replace(/^[a-zA-Z]+:\/\//, '').split(/[\/?#:]/)[0];
    return match ? match.toLowerCase() : null;
  }
}

export function getRedirectDomain(search) {
  const target = getRedirectTarget(search);
  return target ? extractDomain(target) : null;
}

export function buildLoginUrl(search, baseUrl = 'https://api.rajchandra.me/identity/auth/google/start') {
  const target = getRedirectTarget(search);
  return target ? `${baseUrl}?returnTo=${encodeURIComponent(target)}` : baseUrl;
}

export function buildAgentBypassUrl(search, apiUrl = 'https://api.rajchandra.me') {
  const params = new URLSearchParams(search || '');
  const returnTo = getRedirectTarget(search);
  const email = params.get('email');
  const url = new URL(`${apiUrl}/identity/auth/agent-bypass`);
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo);
  }
  if (email) {
    url.searchParams.set('email', email);
  }
  return url.toString();
}

export function isAgentBypassActive(search) {
  const params = new URLSearchParams(search || '');
  return params.get('agent_bypass') === 'true';
}

export function isAutoBypassActive(search) {
  const params = new URLSearchParams(search || '');
  const isBypass = params.get('agent_bypass') === 'true';
  return params.get('agent_bypass') === 'auto' || (isBypass && params.get('auto') === 'true');
}
