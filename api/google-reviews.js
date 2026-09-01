module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Yalnızca GET desteklenir.' });
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) { res.setHeader('Cache-Control','public, s-maxage=300'); return res.status(200).json({ configured: false, reviews: [] }); }
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return res.status(503).json({ error: 'Google yorum yapılandırması geçersiz.' });
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Places API ${response.status}`);
    const data = await response.json();
    const reviews = (data.reviews || []).slice(0, 5).map(review => ({
      author: String(review.authorAttribution?.displayName || 'Google kullanıcısı').slice(0, 80),
      rating: Number(review.rating) || 0,
      text: String(review.text?.text || review.originalText?.text || '').slice(0, 600),
      published: String(review.relativePublishTimeDescription || ''),
      url: safeGoogleUrl(review.googleMapsUri || data.googleMapsUri)
    })).filter(review => review.text);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ rating: Math.max(0,Math.min(5,Number(data.rating)||0)), count: Math.max(0,Math.min(1000000,Number(data.userRatingCount)||0)), reviews, url: safeGoogleUrl(data.googleMapsUri) });
  } catch (error) {
    console.error('google_reviews_failed', error.message);
    return res.status(502).json({ error: 'Google yorumları şu anda alınamadı.' });
  }
};

function safeGoogleUrl(value){try{const url=new URL(String(value||''));const host=url.hostname.toLowerCase();return url.protocol==='https:'&&(host==='google.com'||host.endsWith('.google.com')||host==='maps.app.goo.gl')?url.toString():''}catch{return''}}

module.exports._test={safeGoogleUrl};
