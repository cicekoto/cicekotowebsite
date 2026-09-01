const crypto = require('crypto');

const COOKIE_NAME = '__Host-cicek_admin';
const LEGACY_COOKIE_NAME = 'cicek_admin';
const SESSION_SECONDS = 60 * 60 * 4;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('base64url');
}

function createSession(username, secret, userAgent = '') {
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({
    v: 2,
    sub: digest(username),
    ua: digest(userAgent).slice(0, 22),
    nonce: crypto.randomBytes(18).toString('base64url'),
    iat: now,
    exp: now + SESSION_SECONDS * 1000
  })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function readCookie(header, name = COOKIE_NAME) {
  const cookies = String(header || '').split(';').map(part => part.trim());
  const match = cookies.find(part => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

function readSession(header, username, secret, userAgent = '') {
  try {
    const token = readCookie(header);
    const separator = token.lastIndexOf('.');
    if (separator < 1) return null;
    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload, secret))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Date.now();
    if (data.v !== 2 || data.sub !== digest(username) || data.ua !== digest(userAgent).slice(0, 22)) return null;
    if (!Number.isFinite(data.iat) || !Number.isFinite(data.exp) || data.iat > now + 60_000 || data.exp <= now || data.exp - data.iat > SESSION_SECONDS * 1000) return null;
    if (!/^[A-Za-z0-9_-]{20,40}$/.test(String(data.nonce || ''))) return null;
    return { token, data };
  } catch {
    return null;
  }
}

function verifySession(header, username, secret, userAgent = '') {
  return Boolean(readSession(header, username, secret, userAgent));
}

function csrfToken(header, username, secret, userAgent = '') {
  const session = readSession(header, username, secret, userAgent);
  return session ? sign(`csrf:${session.token}`, secret) : '';
}

function verifyCsrf(req, username, secret) {
  const expected = csrfToken(req.headers.cookie, username, secret, req.headers['user-agent'] || '');
  const supplied = String(req.headers['x-cicek-csrf'] || '');
  return Boolean(expected && supplied && safeEqual(expected, supplied));
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict; Priority=High`;
}

function clearSessionCookies() {
  const attributes = 'Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Priority=High';
  return [`${COOKIE_NAME}=; ${attributes}`, `${LEGACY_COOKIE_NAME}=; ${attributes}`];
}

function sameOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim().toLowerCase();
  const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin') return false;
  if (!origin || !host || !['http','https'].includes(protocol)) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === `${protocol}:` && parsed.host.toLowerCase() === host && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function isAdminRequest(req) {
  return sameOrigin(req) && String(req.headers['x-requested-with'] || '') === 'cicek-admin';
}

module.exports = { COOKIE_NAME, clearSessionCookies, createSession, csrfToken, isAdminRequest, readSession, safeEqual, sameOrigin, sessionCookie, verifyCsrf, verifySession };
