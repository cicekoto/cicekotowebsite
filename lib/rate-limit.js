const crypto = require('crypto');

const memoryBuckets = new Map();

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
  return forwarded.split(',')[0].trim().replace(/^::ffff:/, '').slice(0, 96) || 'unknown';
}

function subjectHash(value, secret) {
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex');
}

function rateLimitSecret(fallback = '') {
  return process.env.RATE_LIMIT_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || fallback || 'cicek-rate-limit-fallback';
}

async function consumeRateLimit({ supabaseUrl, serviceKey, bucket, subject, limit, windowSeconds }) {
  const safeBucket = String(bucket || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 1));
  const safeWindow = Math.max(10, Math.min(86400, Number(windowSeconds) || 60));
  const hash = subjectHash(subject, rateLimitSecret(serviceKey));
  if (supabaseUrl && serviceKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_api_rate_limit`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_bucket: safeBucket, p_subject_hash: hash, p_limit: safeLimit, p_window_seconds: safeWindow }),
        signal: AbortSignal.timeout(2500)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object' && !Array.isArray(result) && typeof result.allowed === 'boolean') return { allowed: result.allowed, retryAfter: Math.max(1, Number(result.retry_after) || safeWindow), source: 'database' };
      }
    } catch (error) {
      console.error('rate_limit_database_unavailable', String(error.message || '').slice(0, 80));
    }
  }
  return consumeMemory(`${safeBucket}:${hash}`, safeLimit, safeWindow);
}

function consumeMemory(key, limit, windowSeconds, now = Date.now()) {
  const windowMs = windowSeconds * 1000;
  let entry = memoryBuckets.get(key);
  if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  memoryBuckets.set(key, entry);
  if (memoryBuckets.size > 2500) {
    for (const [storedKey, stored] of memoryBuckets) {
      if (stored.resetAt <= now || memoryBuckets.size > 2000) memoryBuckets.delete(storedKey);
      if (memoryBuckets.size <= 2000) break;
    }
  }
  return { allowed: entry.count <= limit, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)), source: 'memory' };
}

function applyRateLimit(res, result) {
  res.setHeader('X-RateLimit-Policy', result.source === 'database' ? 'durable' : 'instance');
  if (!result.allowed) res.setHeader('Retry-After', String(result.retryAfter));
  return result.allowed;
}

module.exports = { applyRateLimit, clientIp, consumeMemory, consumeRateLimit, rateLimitSecret, subjectHash };
