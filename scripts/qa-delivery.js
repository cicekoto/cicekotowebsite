const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.QA_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.route('**/api/appointments?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: ['09:00', '10:00'], duration_minutes: 60 }) }));
  await desktop.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await desktop.waitForTimeout(700);
  assert.match(await desktop.title(), /Çiçek Oto/);
  assert.equal(await desktop.locator('link[rel="icon"][type="image/png"]').count(), 3);
  const instagram = desktop.locator('.header-social');
  await expectVisible(instagram);
  assert.equal(await instagram.getAttribute('href'), 'https://www.instagram.com/cicekoto/');
  assert.doesNotMatch(await desktop.locator('.hero-stats .stat:nth-child(2) strong').innerText(), /NaN/);
  assert.match(await desktop.locator('.google-rating').innerText(), /\d+ Google yorumu/);
  await desktop.getByLabel('Periyodik Bakım', { exact: true }).evaluate(input => {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(await desktop.getByLabel('Periyodik Bakım', { exact: true }).isChecked(), true);
  await desktop.getByRole('button', { name: /Devam Et/ }).click();
  await expectVisible(desktop.locator('.form-step[data-step="2"]'));
  await desktop.getByLabel('Araç markası').selectOption('Volkswagen');
  await desktop.getByLabel('Model', { exact: true }).fill('Golf 7');
  await desktop.getByRole('button', { name: /Devam Et/ }).click();
  await expectVisible(desktop.locator('.form-step[data-step="3"]'));
  const bookingDate = await desktop.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  await desktop.getByLabel('Tarih', { exact: true }).fill(bookingDate);
  await desktop.locator('select[name="time"]').waitFor({ state: 'visible' });
  await desktop.waitForFunction(() => !document.querySelector('[name="time"]').disabled);
  await desktop.locator('select[name="time"]').selectOption('09:00');
  await desktop.getByRole('button', { name: /Devam Et/ }).click();
  await expectVisible(desktop.locator('.form-step[data-step="4"]'));
  assert.equal(await desktop.getByLabel('E-posta', { exact: true }).getAttribute('required'), '');
  assert.equal(await desktop.locator('[name="whatsapp_consent"]').count(), 0);
  await desktop.screenshot({ path: 'output/playwright/delivery-final-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await mobile.waitForTimeout(1700);
  await expectVisible(mobile.locator('.header-social'));
  assert.doesNotMatch(await mobile.locator('.hero-stats .stat:nth-child(2) strong').innerText(), /NaN/);
  await mobile.locator('#menuToggle').evaluate(button => button.click());
  await mobile.waitForTimeout(300);
  assert.equal(await mobile.locator('body').evaluate(body => body.classList.contains('menu-open')), true);
  const menuBox = await mobile.locator('#mobileMenu').boundingBox();
  assert.ok(menuBox && menuBox.width >= 389 && menuBox.height >= 770, 'Mobile menu must cover the viewport');
  const dockState = await mobile.locator('.mobile-dock').evaluate(element => ({ opacity: getComputedStyle(element).opacity, pointerEvents: getComputedStyle(element).pointerEvents }));
  assert.deepEqual(dockState, { opacity: '0', pointerEvents: 'none' });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await mobile.screenshot({ path: 'output/playwright/delivery-final-mobile.png', fullPage: false });

  const admin = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  admin.on('pageerror', error => errors.push(error.message));
  await admin.route('**/api/admin/session', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, csrfToken: 'qa-token' }) }));
  await admin.route('**/api/admin/appointments', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ appointments: [], events: [] }) }));
  await admin.route('**/api/admin/system', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    integrations: {
      database: { configured: true, reachable: false, state: 'error', label: 'Supabase veritabanı' },
      ownerWhatsApp: { configured: false, reachable: null, state: 'missing', label: 'CallMeBot işletme bildirimi' },
      customerEmail: { configured: false, reachable: null, state: 'missing', label: 'Resend müşteri e-postası' },
      googleReviews: { configured: false, reachable: null, state: 'missing', label: 'Google yorum bağlantısı' }
    }
  }) }));
  await admin.goto(`${baseUrl}/admin.html`, { waitUntil: 'domcontentloaded' });
  await admin.locator('[data-view="system"]').click();
  await admin.locator('.integration-card').first().waitFor({ state: 'visible' });
  assert.equal(await admin.locator('.integration-card').count(), 4);
  assert.equal(await admin.locator('.integration-card.error').count(), 1);
  assert.match(await admin.locator('.integration-card.error').innerText(), /HATA/);
  await admin.screenshot({ path: 'output/playwright/delivery-final-admin.png', fullPage: true });

  const notFound = await browser.newPage({ viewport: { width: 390, height: 844 } });
  notFound.on('pageerror', error => errors.push(error.message));
  const isLocal = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');
  const notFoundResponse = await notFound.goto(`${baseUrl}${isLocal ? '/404.html' : '/olmayan-sayfa-qa'}`, { waitUntil: 'networkidle' });
  if (!isLocal) assert.equal(notFoundResponse?.status(), 404);
  assert.equal(await notFound.locator('h1').innerText(), 'Bu sayfa bulunamadı.');
  assert.equal(await notFound.locator('body').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(0, 1, 5)');
  await notFound.screenshot({ path: 'output/playwright/delivery-final-404.png', fullPage: true });
  await notFound.close();

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('delivery browser QA passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function expectVisible(locator) {
  await locator.waitFor({ state: 'visible', timeout: 5000 });
  assert.equal(await locator.isVisible(), true);
}
