const assert = require('node:assert/strict');
const appointmentsHandler = require('../api/appointments');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.RATE_LIMIT_SECRET = 'test-rate-limit-secret-with-enough-entropy';

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return value; }
  };
}

const baseHeaders = {
  origin: 'https://cicek-otomotiv.vercel.app',
  host: 'cicek-otomotiv.vercel.app',
  'x-forwarded-proto': 'https',
  'sec-fetch-site': 'same-origin',
  'content-type': 'application/json',
  'user-agent': 'security-test-agent',
  'x-forwarded-for': '203.0.113.20'
};

(async () => {
  global.fetch = async (url) => {
    if (String(url).includes('consume_api_rate_limit')) {
      return { ok: true, json: async () => ({ allowed: true, retry_after: 60 }) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const crossOrigin = response();
  await appointmentsHandler({ method: 'POST', headers: { ...baseHeaders, origin: 'https://evil.example' }, body: {} }, crossOrigin);
  assert.equal(crossOrigin.statusCode, 403);

  const wrongType = response();
  await appointmentsHandler({ method: 'POST', headers: { ...baseHeaders, 'content-type': 'text/plain' }, body: '{}' }, wrongType);
  assert.equal(wrongType.statusCode, 415);

  const oversized = response();
  await appointmentsHandler({ method: 'POST', headers: { ...baseHeaders, 'content-length': '16385' }, body: {} }, oversized);
  assert.equal(oversized.statusCode, 413);

  const tooFast = response();
  await appointmentsHandler({ method: 'POST', headers: baseHeaders, body: { form_started_at: Date.now() } }, tooFast);
  assert.equal(tooFast.statusCode, 400);
  assert.match(tooFast.body.error, /Form oturumu/);

  const invalidAvailability = response();
  await appointmentsHandler({ method: 'GET', headers: baseHeaders, query: { date: 'not-a-date', services: '[]' } }, invalidAvailability);
  assert.equal(invalidAvailability.statusCode, 400);

  console.log('public API security tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
