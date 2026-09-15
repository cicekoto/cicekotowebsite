const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
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
assert.doesNotMatch(main, /configureCustomerNotifications/);
assert.match(admin, /id="emailCoverage"/);
assert.doesNotMatch(admin + adminJs, /WhatsApp izni/);
assert.match(privacy + kvkk, /CallMeBot/);
assert.match(privacy + kvkk, /Resend/);
assert.doesNotMatch(privacy + kvkk, /WhatsApp bildirimi isteğe bağlıdır|isteğe bağlı WhatsApp iletişim tercihi/);
assert.doesNotMatch(terms, /izin vermeniz halinde WhatsApp/);
assert.match(privacy + kvkk + terms, /GÜNCELLEME · 15\.09\.2026/);

console.log('delivery consistency tests passed');
