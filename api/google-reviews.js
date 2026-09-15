const DEFAULT_GOOGLE_PLACE_ID = 'ChIJKZIl83-vyhQR8y5m3bAz9Ug';
const { applyRateLimit, clientIp, consumeRateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Yalnızca GET desteklenir.' });
  if (Object.keys(req.query || {}).length) return res.status(400).json({ error: 'Sorgu parametresi desteklenmez.' });
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_GOOGLE_PLACE_ID;
  if (!apiKey) { res.setHeader('Cache-Control','public, s-maxage=300'); return res.status(200).json({ configured: false, reviews: [] }); }
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return res.status(503).json({ error: 'Google yorum yapılandırması geçersiz.' });
  try {
    const rate = await consumeRateLimit({ supabaseUrl:process.env.SUPABASE_URL, serviceKey:process.env.SUPABASE_SERVICE_ROLE_KEY, bucket:'google-reviews', subject:clientIp(req), limit:30, windowSeconds:600 });
    if (!applyRateLimit(res, rate)) return res.status(429).json({ error:'Çok fazla yorum isteği. Lütfen kısa süre sonra tekrar deneyin.' });
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Places API ${response.status}`);
    const data = await response.json();
    const reviews = (data.reviews || []).slice(0, 5).map(review => ({
      author: String(review.authorAttribution?.displayName || 'Google kullanıcısı').slice(0, 80),
      rating: Number(review.rating),
      text: String(review.text?.text || review.originalText?.text || '').slice(0, 600),
      published: String(review.relativePublishTimeDescription || '').slice(0, 80),
      url: safeGoogleUrl(review.googleMapsUri || data.googleMapsUri)
    })).filter(review => review.text && Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5);
    const rating = Number(data.rating);
    const count = Number(data.userRatingCount);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(count) || count < 1) throw new Error('Places API invalid rating payload');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ rating, count:Math.min(1000000,count), reviews, url: safeGoogleUrl(data.googleMapsUri) });
  } catch (error) {
    console.error('google_reviews_failed', error.message);
    return res.status(502).json({ error: 'Google yorumları şu anda alınamadı.' });
  }
};

function safeGoogleUrl(value){try{const url=new URL(String(value||''));const host=url.hostname.toLowerCase();return url.protocol==='https:'&&(host==='google.com'||host.endsWith('.google.com')||host==='maps.app.goo.gl')?url.toString():''}catch{return''}}

module.exports._test={safeGoogleUrl,DEFAULT_GOOGLE_PLACE_ID};
