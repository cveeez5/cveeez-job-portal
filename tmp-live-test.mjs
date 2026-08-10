import { chromium } from 'playwright';

const BASE = 'https://job-portal-inky-five-98.vercel.app';
const OUT = process.argv[2];

const browser = await chromium.launch();
const errors = [];

for (const [tag, viewport] of [
  ['mobile375', { width: 375, height: 812 }],
  ['desktop', { width: 1440, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: 'ar-EG' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${tag} console: ${m.text().slice(0, 140)}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${tag} HTTP ${r.status()} ${r.url().slice(0, 90)}`);
  });

  await page.goto(`${BASE}/apply/moderator`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const gateVisible = await page.locator('input[name="g1"]').count();
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  console.log(`${tag}: خيارات g1 = ${gateVisible} | عرض ${overflow.scrollW}/${overflow.clientW} ${overflow.scrollW <= overflow.clientW ? '✓' : '✗ فيه تمدد'}`);

  await page.screenshot({ path: `${OUT}/live-${tag}-gate.png`, fullPage: true });

  // تدفق الاستبعاد الحقيقي على الموقع الحي
  await page.locator('input[name="g1"][value="no"]').check();
  await page.locator('input[name="g2"][value="yes"]').check();
  await page.locator('input[name="g3"][value="both"]').check();
  await page.locator('input[name="g4"][value="bachelor"]').check();
  await page.locator('input[name="g5"][value="free"]').check();
  await page.getByRole('button', { name: /التالي/ }).click();
  await page.waitForTimeout(6000);

  const apology = await page.getByText(/شكرًا لاهتمامك بالانضمام لفريق CVeeez/).count();
  console.log(`${tag}: شاشة الاعتذار ظهرت = ${apology === 1 ? 'أيوه ✓' : 'لأ ✗'}`);
  await page.screenshot({ path: `${OUT}/live-${tag}-knockout.png`, fullPage: true });

  // localStorage اتمسح بعد الإرسال؟
  const leftover = await page.evaluate(() => localStorage.getItem('cveeez_form_moderator_v2'));
  console.log(`${tag}: localStorage بعد الإرسال = ${leftover === null ? 'اتمسح ✓' : 'لسه موجود ✗'}`);

  await ctx.close();
}

await browser.close();
console.log(errors.length === 0 ? '\nمفيش أي أخطاء في الكونسول ولا ريكوستات فاشلة ✓' : `\nأخطاء (${errors.length}):`);
errors.slice(0, 10).forEach((e) => console.log('  ‼', e));
