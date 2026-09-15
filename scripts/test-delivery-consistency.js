const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const services = read('hizmetler.html');
const main = read('js/main.js');
const admin = read('admin.html');
const adminJs = read('js/admin.js');
const privacy = read('gizlilik.html');
const kvkk = read('kvkk.html');
const terms = read('kullanim-kosullari.html');

assert.match(index, /<span>E-posta<\/span><input type="email" name="email" required/);
assert.doesNotMatch(index, /name="whatsapp_consent"/);
assert.doesNotMatch(index, /E-posta \(isteğe bağlı\)/);
assert.match(index, /E-posta bilgilendirme/);
assert.match(index, /<strong data-count="4\.9">4\.9<\/strong>/);
assert.match(index, /<strong>174<\/strong><span>Google yorumu<\/span>/);
assert.match(index, /<b>4,9 \/ 5<\/b><span>174 Google yorumu<\/span>/);
assert.doesNotMatch(index + main, /1,9 bin|1\.9K|1\.9 bin/i);
assert.match(index + services + main, /wa\.me\/905325953964/);
assert.doesNotMatch(index + services + main, /wa\.me\/902125491763/);
assert.doesNotMatch(main, /configureCustomerNotifications/);
assert.match(admin, /id="emailCoverage"/);
assert.doesNotMatch(admin + adminJs, /WhatsApp izni/);
assert.match(privacy + kvkk, /CallMeBot/);
assert.match(privacy + kvkk, /Resend/);
assert.doesNotMatch(privacy + kvkk, /WhatsApp bildirimi isteğe bağlıdır|isteğe bağlı WhatsApp iletişim tercihi/);
assert.doesNotMatch(terms, /izin vermeniz halinde WhatsApp/);
assert.match(privacy + kvkk + terms, /GÜNCELLEME · 15\.09\.2026/);

console.log('delivery consistency tests passed');
