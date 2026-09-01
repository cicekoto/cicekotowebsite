const { COOKIE_NAME, clearSessionCookies, createSession, csrfToken, isAdminRequest, safeEqual, sessionCookie, verifyCsrf, verifySession } = require('../../lib/admin-auth');
const { applyRateLimit, clientIp, consumeRateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Vary', 'Cookie');
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || password;
  const userAgent = String(req.headers['user-agent'] || '');
  if (!username || !password || password.length < 14 || !secret || secret.length < 14) return res.status(503).json({ error: 'Yönetim güvenlik yapılandırması eksik.' });

  if (req.method === 'GET') {
    if (!verifySession(req.headers.cookie, username, secret, userAgent)) return res.status(401).json({ error: 'Oturum gerekli.' });
    return res.status(200).json({ ok: true, csrfToken: csrfToken(req.headers.cookie, username, secret, userAgent) });
  }

  if (req.method === 'DELETE') {
    if (!isAdminRequest(req) || !verifySession(req.headers.cookie, username, secret, userAgent) || !verifyCsrf(req, username, secret)) return res.status(403).json({ error: 'Güvenlik doğrulaması başarısız.' });
    res.setHeader('Set-Cookie', clearSessionCookies());
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Desteklenmeyen metod.' });
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'Güvenlik doğrulaması başarısız.' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'JSON içerik türü gereklidir.' });
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'İstek çok büyük.' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Geçersiz istek.' }); }
  if (!body || Array.isArray(body) || typeof body !== 'object' || typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 256) return res.status(400).json({ error: 'Geçersiz istek.' });

  const rate = await consumeRateLimit({
    supabaseUrl: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: 'admin-login',
    subject: `${clientIp(req)}:${String(body.username).toLocaleLowerCase('tr-TR')}`,
    limit: 5,
    windowSeconds: 900
  });
  if (!applyRateLimit(res, rate)) return res.status(429).json({ error: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.' });

  if (!safeEqual(body.username, username) || !safeEqual(body.password, password)) {
    await new Promise(resolve => setTimeout(resolve, 650));
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const token = createSession(username, secret, userAgent);
  res.setHeader('Set-Cookie', [...clearSessionCookies(), sessionCookie(token)]);
  const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(token)}`;
  return res.status(200).json({ ok: true, csrfToken: csrfToken(cookieHeader, username, secret, userAgent) });
};
