const assert = require('node:assert/strict');
const publicApi = require('../api/appointments')._test;
const adminApi = require('../api/admin/appointments')._test;

const beforeStart = new Date('2026-09-15T08:58:00+03:00').getTime();
const afterStart = new Date('2026-09-15T09:02:00+03:00').getTime();

for (const api of [publicApi, adminApi]) {
  assert.equal(api.isBookableStart('2026-09-15', '09:00', beforeStart), true);
  assert.equal(api.isBookableStart('2026-09-15', '09:00', afterStart), false);
  assert.equal(api.isBookableStart('invalid', '09:00', beforeStart), false);
}

const first = publicApi.makeReference();
const second = publicApi.makeReference();
assert.match(first, /^CO-\d{2}[A-F0-9]{8}$/);
assert.notEqual(first, second);

console.log('time-boundary and reference tests passed');
