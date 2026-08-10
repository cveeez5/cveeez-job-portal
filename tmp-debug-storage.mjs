import { chromium } from 'playwright';

const BASE = 'https://job-portal-inky-five-98.vercel.app';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

await page.goto(`${BASE}/apply/moderator`, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// نتجسس على كل كتابة/مسح في localStorage
await page.evaluate(() => {
  window.__log = [];
  const set = Storage.prototype.setItem;
  const del = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    if (k.includes('moderator_v2')) window.__log.push(`t=${Date.now() % 100000} SET   len=${v.length}`);
    return set.apply(this, arguments);
  };
  Storage.prototype.removeItem = function (k) {
    if (k.includes('moderator_v2')) window.__log.push(`t=${Date.now() % 100000} CLEAR`);
    return del.apply(this, arguments);
  };
});

for (const [n, v] of [['g1', 'no'], ['g2', 'yes'], ['g3', 'both'], ['g4', 'bachelor'], ['g5', 'free']]) {
  await page.locator(`input[name="${n}"][value="${v}"]`).check();
}
await page.waitForTimeout(1600); // نسيب الحفظ المؤجل يحصل
await page.evaluate(() => window.__log.push('--- ضغط التالي ---'));
await page.getByRole('button', { name: /التالي/ }).click();
await page.waitForTimeout(7000);

const log = await page.evaluate(() => window.__log);
console.log(log.join('\n'));
console.log('\nالنتيجة النهائية:', await page.evaluate(() => localStorage.getItem('cveeez_form_moderator_v2') ? 'لسه موجود' : 'اتمسح'));

await browser.close();
