const { verifySession } = require('../../lib/admin-auth');

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
  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    integrations: {
      database: { configured: has('SUPABASE_URL') && has('SUPABASE_SERVICE_ROLE_KEY'), label: 'Supabase veritabanı' },
      ownerWhatsApp: { configured: has('CALLMEBOT_PHONE') && has('CALLMEBOT_API_KEY'), label: 'CallMeBot işletme bildirimi' },
      customerWhatsApp: { configured: has('WHATSAPP_ACCESS_TOKEN') && has('WHATSAPP_PHONE_NUMBER_ID') && has('WHATSAPP_GRAPH_API_VERSION') && has('WHATSAPP_TEMPLATE_RECEIVED'), label: 'WhatsApp müşteri bildirimi' },
      googleReviews: { configured: has('GOOGLE_PLACES_API_KEY') && has('GOOGLE_PLACE_ID'), label: 'Google yorum bağlantısı' }
    },
    security: { sessionHours: 4, csrf: true, rateLimit: true, secureCookie: true },
    booking: { start: '09:00', end: '17:00', closedDay: 'Pazar', dailyVehicleLimit: null }
  });
};

