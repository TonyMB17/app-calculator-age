import { strict as assert } from 'node:assert';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Run in an independent process: Firefox on this Windows host crashes while
// injecting axe from the Playwright test worker, but not with the standalone API.
const [engine, state, url] = process.argv.slice(2);
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    reducedMotion: 'reduce',
    locale: 'es-PE',
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-11-12T17:00:00Z'));
  await page.goto(url);
  if (state === 'resultado') {
    for (const [key, value] of Object.entries({
      birth: '2026-01-01',
      weeks: '32',
      days: '4',
      evaluation: '2026-03-26',
    })) {
      await page.locator(`#${key}`).fill(value);
    }
    await page.locator('button[type="submit"]').click();
  }
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished)),
  );
  const report = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(report.violations, []);
  console.log(`${engine}: ${state}, sin infracciones detectadas por axe.`);
} finally {
  await browser.close();
}
