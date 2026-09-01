const { clearSessionCookie, createSession, safeEqual, sessionCookie, verifySession } = require('../../lib/admin-auth');
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return res.status(503).json({ error: 'Yönetim servisi yapılandırılmadı.' });

  if (req.method === 'GET') {
    return verifySession(req.headers.cookie, username, password)
      ? res.status(200).json({ ok: true })
      : res.status(401).json({ error: 'Oturum gerekli.' });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Desteklenmeyen metod.' });
  const client = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 80);
  const now = Date.now();
  const current = attempts.get(client);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.' });
  }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Geçersiz istek.' }); }
  if (!safeEqual(body.username, username) || !safeEqual(body.password, password)) {
    const next = !current || current.resetAt <= now ? { count: 1, resetAt: now + WINDOW_MS } : { ...current, count: current.count + 1 };
    attempts.set(client, next);
    if (attempts.size > 1000) attempts.delete(attempts.keys().next().value);
    await new Promise(resolve => setTimeout(resolve, 450));
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  attempts.delete(client);
  res.setHeader('Set-Cookie', sessionCookie(createSession(username, password)));
  return res.status(200).json({ ok: true });
};
