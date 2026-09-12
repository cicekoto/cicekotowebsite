const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.QA_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await desktop.waitForTimeout(700);
  assert.match(await desktop.locator('.google-rating').innerText(), /174 Google yorumu/);
  await desktop.getByLabel('Periyodik Bakım', { exact: true }).evaluate(input => {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(await desktop.getByLabel('Periyodik Bakım', { exact: true }).isChecked(), true);
  await desktop.getByRole('button', { name: /Devam Et/ }).click();
  await expectVisible(desktop.locator('.form-step[data-step="2"]'));
  await desktop.screenshot({ path: 'output/playwright/delivery-final-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await mobile.waitForTimeout(1700);
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
      customerWhatsApp: { configured: false, reachable: null, state: 'missing', label: 'WhatsApp müşteri bildirimi' },
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
