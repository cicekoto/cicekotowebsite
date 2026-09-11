const assert = require('node:assert/strict');
const handler = require('../api/appointments');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

global.fetch = async url => String(url).includes('consume_api_rate_limit') ? ({
  ok: true,
  json: async () => ({ allowed: true, retry_after: 600 })
}) : ({
  ok: true,
  json: async () => [
    { requested_time: '09:00', duration_minutes: 60 },
    { requested_time: '10:00', duration_minutes: 60 },
    { requested_time: '11:00', duration_minutes: 60 },
    { requested_time: '12:00', duration_minutes: 60 },
    { requested_time: '13:00', duration_minutes: 60 }
  ]
});

const futureWeekday = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  while (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
})();

const req = {
  method: 'GET',
  headers: { 'x-forwarded-for': '203.0.113.20' },
  query: {
    date: futureWeekday,
    services: JSON.stringify(['Periyodik Bakım'])
  }
};

let payload;
const res = {
  setHeader() {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(value) {
    payload = value;
    return value;
  }
};

handler(req, res).then(() => {
  assert.equal(res.statusCode, 200);
  assert.deepEqual(payload.available, ['14:00', '15:00', '16:00', '17:00']);
  assert.equal('remaining' in payload, false);
  assert.equal('day_full' in payload, false);
  console.log('capacity-limit test passed');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
