const { verifySession } = require('../../lib/admin-auth');
const { supabaseHeaders } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Desteklenmeyen metod.' });
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || password;
  if (!username || !password || !secret || !verifySession(req.headers.cookie, username, secret, req.headers['user-agent'] || '')) return res.status(401).json({ error: 'Yönetici oturumu gerekli.' });

  const has = name => Boolean(String(process.env[name] || '').trim());
  const database = await databaseStatus(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    integrations: {
      database,
      ownerWhatsApp: integrationStatus(has('CALLMEBOT_PHONE') && has('CALLMEBOT_API_KEY'), 'CallMeBot usta bildirimi'),
      customerEmail: integrationStatus(has('RESEND_API_KEY') && has('RESEND_FROM_EMAIL'), 'Resend müşteri e-postası'),
      googleReviews: integrationStatus(has('GOOGLE_PLACES_API_KEY'), 'Google yorum bağlantısı')
    },
    security: { sessionHours: 4, csrf: true, rateLimit: true, secureCookie: true },
    booking: { start: '09:00', end: '17:00', closedDay: 'Pazar', dailyVehicleLimit: null }
  });
};

function integrationStatus(configured, label) {
  return { configured, reachable: null, state: configured ? 'ready' : 'missing', label };
}

async function databaseStatus(url, key) {
  const label = 'Supabase veritabanı';
  if (!String(url || '').trim() || !String(key || '').trim()) return { configured: false, reachable: false, state: 'missing', label };
  try {
    const response = await fetch(`${String(url).replace(/\/$/, '')}/rest/v1/appointments?select=id&limit=1`, {
      headers: supabaseHeaders(key),
      signal: AbortSignal.timeout(3500)
    });
    return { configured: true, reachable: response.ok, state: response.ok ? 'ready' : 'error', label };
  } catch {
    return { configured: true, reachable: false, state: 'error', label };
  }
}

module.exports._test = { databaseStatus, integrationStatus };
