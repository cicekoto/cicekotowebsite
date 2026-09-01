const assert = require('node:assert/strict');
const { createSession, sameOrigin, verifySession } = require('../lib/admin-auth');
const sessionHandler = require('../api/admin/session');
const appointmentsHandler = require('../api/admin/appointments');

process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password-with-enough-entropy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return value; }
  };
}

(async () => {
  const token = createSession(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
  assert.equal(verifySession(`cicek_admin=${encodeURIComponent(token)}`, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD), true);
  assert.equal(verifySession(`cicek_admin=${encodeURIComponent(token)}x`, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD), false);
  assert.equal(sameOrigin({ headers: { origin: 'https://example.com', host: 'example.com', 'x-forwarded-proto': 'https' } }), true);

  const loginRes = response();
  await sessionHandler({ method: 'POST', body: { username: 'test-admin', password: 'test-password-with-enough-entropy' }, headers: {} }, loginRes);
  assert.equal(loginRes.statusCode, 200);
  assert.match(loginRes.headers['Set-Cookie'], /HttpOnly/);
  assert.match(loginRes.headers['Set-Cookie'], /SameSite=Strict/);

  const cookie = loginRes.headers['Set-Cookie'].split(';')[0];
  global.fetch = async () => ({ ok: true, json: async () => [] });
  const listRes = response();
  await appointmentsHandler({ method: 'GET', headers: { cookie } }, listRes);
  assert.equal(listRes.statusCode, 200);
  assert.deepEqual(listRes.body, { appointments: [], events: [] });

  const unauthorizedRes = response();
  await appointmentsHandler({ method: 'GET', headers: {} }, unauthorizedRes);
  assert.equal(unauthorizedRes.statusCode, 401);
  console.log('admin-session tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
