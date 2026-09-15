const assert = require('node:assert/strict');
const handler = require('../api/admin/system');
const { COOKIE_NAME, createSession } = require('../lib/admin-auth');

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return value; } };
}

(async () => {
  process.env.ADMIN_USERNAME = 'test-admin';
  process.env.ADMIN_PASSWORD = 'a-strong-test-password';
  process.env.ADMIN_SESSION_SECRET = 'a-separate-session-secret-with-32-chars';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
  delete process.env.CALLMEBOT_API_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  const userAgent = 'system-test-agent';
  const token = createSession(process.env.ADMIN_USERNAME, process.env.ADMIN_SESSION_SECRET, userAgent);
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true });

  const unauthorized = response();
  await handler({ method: 'GET', headers: {} }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);

  const authorized = response();
  await handler({ method: 'GET', headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}`, 'user-agent': userAgent } }, authorized);
  assert.equal(authorized.statusCode, 200);
  assert.equal(authorized.body.integrations.database.configured, true);
  assert.equal(authorized.body.integrations.database.reachable, true);
  assert.equal(authorized.body.integrations.database.state, 'ready');
  assert.equal(authorized.body.integrations.ownerWhatsApp.configured, false);
  assert.equal(authorized.body.integrations.customerEmail.configured, false);
  assert.equal(authorized.body.security.sessionHours, 4);
  assert.equal(JSON.stringify(authorized.body).includes(process.env.SUPABASE_SERVICE_ROLE_KEY), false);
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM_EMAIL = 'Çiçek Oto <randevu@bildirim.example.com>';
  const configured = response();
  await handler({ method: 'GET', headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}`, 'user-agent': userAgent } }, configured);
  assert.equal(configured.body.integrations.customerEmail.configured, true);
  global.fetch = async () => { throw new Error('dns'); };
  const unreachable = response();
  await handler({ method: 'GET', headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}`, 'user-agent': userAgent } }, unreachable);
  assert.equal(unreachable.body.integrations.database.state, 'error');
  global.fetch = originalFetch;
  console.log('admin-system security tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
