const crypto = require('crypto');

const COOKIE_NAME = 'cicek_admin';
const SESSION_SECONDS = 60 * 60 * 8;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createSession(username, secret) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + SESSION_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function readCookie(header) {
  const cookies = String(header || '').split(';').map(part => part.trim());
  const match = cookies.find(part => part.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : '';
}

function verifySession(header, username, secret) {
  try {
    const token = readCookie(header);
    const separator = token.lastIndexOf('.');
    if (separator < 1) return false;
    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload, secret))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.username === username && Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function sameOrigin(req) {
  const origin = String(req.headers.origin || '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const protocol = String(req.headers['x-forwarded-proto'] || 'https');
  return Boolean(origin && host && origin === `${protocol}://${host}`);
}

module.exports = { clearSessionCookie, createSession, safeEqual, sameOrigin, sessionCookie, verifySession };
