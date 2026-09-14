function supabaseHeaders(serviceKey, extra = {}) {
  const key = String(serviceKey || '').trim();
  const headers = { apikey: key, ...extra };
  // Supabase's current sb_secret_ keys authenticate through the apikey header.
  // Legacy service_role JWTs still require the bearer header for PostgREST.
  if (key && !key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

module.exports = { supabaseHeaders };
