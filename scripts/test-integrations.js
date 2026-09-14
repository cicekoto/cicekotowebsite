const assert = require('node:assert/strict');
const { notifyCustomerEmail, notifyOwnerCallMeBot, _test: notificationTest } = require('../lib/notifications');
const googleReviewsHandler = require('../api/google-reviews');

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return value; }
  };
}

(async () => {
  const record = { reference: 'CO-26TEST', customer_name: 'Test <Kullanıcı>', customer_phone: '+905551112233', customer_email: 'test@example.com', vehicle_brand: 'Volkswagen', vehicle_model: 'Golf', services: ['Periyodik Bakım'], requested_date: '2026-09-02', requested_time: '10:00', whatsapp_consent: true };
  delete process.env.CALLMEBOT_PHONE;
  delete process.env.CALLMEBOT_API_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  assert.equal(await notifyOwnerCallMeBot(record), false);
  assert.equal(await notifyCustomerEmail(record), false);

  let request;
  global.fetch = async (url, options) => { request = { url, options }; return { ok: true }; };
  process.env.CALLMEBOT_PHONE = '905559998877';
  process.env.CALLMEBOT_API_KEY = 'callmebot-test-key';
  assert.equal(await notifyOwnerCallMeBot(record), true);
  assert.match(request.url, /^https:\/\/api\.callmebot\.com\/whatsapp\.php/);
  assert.match(request.url, /phone=905559998877/);

  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_FROM_EMAIL = 'Çiçek Oto <randevu@bildirim.example.com>';
  process.env.RESEND_REPLY_TO = 'servis@example.com';
  assert.equal(await notifyCustomerEmail(record), true);
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.headers.Authorization, 'Bearer re_test');
  assert.equal(request.options.headers['Idempotency-Key'], 'appointment-CO-26TEST-received');
  const message = JSON.parse(request.options.body);
  assert.deepEqual(message.to, ['test@example.com']);
  assert.equal(message.reply_to, 'servis@example.com');
  assert.match(message.subject, /Randevu talebiniz alındı/);
  assert.match(message.text, /CO-26TEST/);
  assert.match(message.html, /Test &lt;Kullanıcı&gt;/);
  assert.doesNotMatch(message.html, /Test <Kullanıcı>/);
  assert.equal(notificationTest.emailContent(record, 'completed'), null);

  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.GOOGLE_PLACE_ID;
  const fallbackRes = response();
  await googleReviewsHandler({ method: 'GET' }, fallbackRes);
  assert.equal(fallbackRes.statusCode, 200);
  assert.deepEqual(fallbackRes.body, { configured: false, reviews: [] });

  process.env.GOOGLE_PLACES_API_KEY = 'places-key';
  delete process.env.GOOGLE_PLACE_ID;
  global.fetch = async (url) => {
    assert.match(url, new RegExp(googleReviewsHandler._test.DEFAULT_GOOGLE_PLACE_ID));
    return { ok: true, json: async () => ({ rating: 4.9, userRatingCount: 1900, googleMapsUri: 'https://maps.google.com/', reviews: [{ rating: 5, text: { text: 'Memnun kaldım.' }, authorAttribution: { displayName: 'Müşteri' }, relativePublishTimeDescription: 'bir ay önce' }] }) };
  };
  const reviewsRes = response();
  await googleReviewsHandler({ method: 'GET' }, reviewsRes);
  assert.equal(reviewsRes.statusCode, 200);
  assert.equal(reviewsRes.body.reviews[0].author, 'Müşteri');
  assert.equal(reviewsRes.body.count, 1900);
  assert.equal(googleReviewsHandler._test.safeGoogleUrl('javascript:alert(1)'), '');
  console.log('integration tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
