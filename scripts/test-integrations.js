const assert = require('node:assert/strict');
const { notifyCustomerWhatsApp, notifyOwnerCallMeBot } = require('../lib/notifications');
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
  const record = { reference: 'CO-26TEST', customer_name: 'Test Kullanıcı', customer_phone: '+905551112233', vehicle_brand: 'Volkswagen', vehicle_model: 'Golf', services: ['Periyodik Bakım'], requested_date: '2026-09-02', requested_time: '10:00', whatsapp_consent: true };
  assert.equal(await notifyOwnerCallMeBot(record), false);
  assert.equal(await notifyCustomerWhatsApp(record), false);

  process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '12345';
  process.env.WHATSAPP_GRAPH_API_VERSION = 'v-test';
  process.env.WHATSAPP_TEMPLATE_RECEIVED = 'appointment_received';
  let request;
  global.fetch = async (url, options) => { request = { url, options }; return { ok: true }; };
  assert.equal(await notifyCustomerWhatsApp(record), true);
  assert.equal(request.url, 'https://graph.facebook.com/v-test/12345/messages');
  const message = JSON.parse(request.options.body);
  assert.equal(message.to, '905551112233');
  assert.equal(message.template.name, 'appointment_received');
  assert.equal(message.template.components[0].parameters.length, 4);

  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.GOOGLE_PLACE_ID;
  const fallbackRes = response();
  await googleReviewsHandler({ method: 'GET' }, fallbackRes);
  assert.equal(fallbackRes.statusCode, 200);
  assert.deepEqual(fallbackRes.body, { configured: false, reviews: [] });

  process.env.GOOGLE_PLACES_API_KEY = 'places-key';
  process.env.GOOGLE_PLACE_ID = 'place-id-123';
  global.fetch = async () => ({ ok: true, json: async () => ({ rating: 4.9, userRatingCount: 168, googleMapsUri: 'https://maps.google.com/', reviews: [{ rating: 5, text: { text: 'Memnun kaldım.' }, authorAttribution: { displayName: 'Müşteri' }, relativePublishTimeDescription: 'bir ay önce' }] }) });
  const reviewsRes = response();
  await googleReviewsHandler({ method: 'GET' }, reviewsRes);
  assert.equal(reviewsRes.statusCode, 200);
  assert.equal(reviewsRes.body.reviews[0].author, 'Müşteri');
  assert.equal(reviewsRes.body.count, 168);
  assert.equal(googleReviewsHandler._test.safeGoogleUrl('javascript:alert(1)'), '');
  console.log('integration tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
