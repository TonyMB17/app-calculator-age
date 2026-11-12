import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T17:00:00Z'));
  await page.goto('./');
});

async function fillCase(
  page,
  { birth = '2026-01-01', weeks = '32', days = '4', evaluation = '2026-03-26' } = {},
) {
  await page.locator('#birth').fill(birth);
  await page.locator('#weeks').selectOption(weeks);
  await page.locator('#days').selectOption(days);
  await page.locator('#evaluation').fill(evaluation);
  await page.getByRole('button', { name: 'Calcular edad corregida' }).click();
}

test('meses y días principales, precisión y retirada del resultado al editar', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(page.locator('#days')).toHaveValue('0');
  await fillCase(page);
  await expect(page.locator('.age-value')).toHaveText('1 mes y 4 días');
  await expect(page.locator('.calendar-age')).toContainText('4 semanas y 4 días');
  await expect(page.locator('.calendar-age')).toContainText('32 días en total');
  await expect(page.locator('.result-metrics')).toContainText('52 días');
  await expect(page.locator('.result-metrics')).toContainText('22/02/2026');
  await page.locator('#days').selectOption('0');
  await expect(page.getByRole('status')).toContainText('Los datos cambiaron');
  await expect(page.locator('.age-value')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nuevo cálculo' }).click();
  await expect(page.locator('#birth')).toBeFocused();
  await expect(page.locator('#weeks')).toHaveValue('');
  await expect(page.locator('#days')).toHaveValue('0');
  await expect(page.locator('#evaluation')).toHaveValue('2026-11-12');
  expect(errors).toEqual([]);
});

test('solo prematuros, días 0–6 y eliminación de información y acciones duplicadas', async ({
  page,
}) => {
  expect(
    await page.locator('#weeks option').evaluateAll((options) => options.map((o) => o.value)),
  ).toEqual(['', ...Array.from({ length: 17 }, (_, i) => String(i + 20))]);
  expect(
    await page.locator('#days option').evaluateAll((options) => options.map((o) => o.value)),
  ).toEqual(['0', '1', '2', '3', '4', '5', '6']);
  await fillCase(page, { weeks: '36', days: '6' });
  await expect(page.locator('.age-value')).toHaveText('2 meses y 3 días');
  await expect(page.getByRole('button', { name: /Copiar|Imprimir/ })).toHaveCount(0);
  await expect(page.getByText('Datos utilizados', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Cómo se calcula', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ver detalle del cálculo', { exact: true })).toHaveCount(0);
});

test('validaciones específicas, valores conservados y foco en el primer error', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Calcular edad corregida' }).click();
  await expect(page.locator('#birth')).toBeFocused();
  await expect(page.locator('#birth')).toHaveAttribute('aria-invalid', 'true');
  await fillCase(page, { evaluation: '2025-12-31' });
  await expect(page.locator('#evaluation-error')).toContainText('igual o posterior');
  await expect(page.locator('#weeks')).toHaveValue('32');
  await fillCase(page, { evaluation: '2026-11-13' });
  await expect(page.locator('#evaluation-error')).toContainText('posterior a hoy');
});

test('antes de término, cero exacto y fuera del intervalo', async ({ page }) => {
  await fillCase(page, { days: '0', evaluation: '2026-01-29' });
  await expect(page.locator('.age-value')).toHaveText('Faltan 28 días');
  await expect(page.locator('.calendar-age')).toContainText(
    'Edad posmenstrual: 36 semanas y 0 días',
  );
  await fillCase(page, { days: '0', evaluation: '2026-02-26' });
  await expect(page.locator('.age-value')).toHaveText('0 meses y 0 días');
  await expect(page.locator('.term-note')).toContainText('Alcanza hoy');
  await fillCase(page, { birth: '2024-01-01', evaluation: '2026-01-01' });
  await expect(page.locator('.interval-notice')).toContainText('Fuera del intervalo habitual');
  await expect(page.locator('.result-label')).toContainText('CÁLCULO MATEMÁTICO');
});

test('vista móvil sin scroll y controles visibles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [393, 852],
    [390, 780],
    [375, 812],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await fillCase(page);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.age-value')).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Nuevo cálculo' })).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Designed by Tony' })).toBeInViewport();
  }
});

test('los celulares altos tienen controles y resultado más amplios', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await fillCase(page);
  expect(
    await page.locator('#weeks').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(50);
  expect(
    await page.locator('.age-value').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(32);
  expect(
    await page.locator('.form-card').evaluate((el) => parseFloat(getComputedStyle(el).paddingTop)),
  ).toBeGreaterThanOrEqual(16);
});

test('teclado, reinicio y reducción de movimiento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fillCase(page);
  await page.getByRole('button', { name: 'Nuevo cálculo' }).click();
  for (
    let i = 0;
    i < 6 && !(await page.locator('#weeks').evaluate((el) => el === document.activeElement));
    i++
  )
    await page.keyboard.press('Tab');
  await expect(page.locator('#weeks')).toBeFocused();
  await fillCase(page, { days: '0' });
  await page.locator('[type="submit"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.age-value')).toHaveText('1 mes y 0 días');
  expect(
    await page.locator('.result-enter').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
});

for (const state of ['inicial', 'resultado']) {
  test(`auditoría de accesibilidad: ${state}`, async ({ browserName, baseURL }) => {
    const { stdout } = await execFileAsync(process.execPath, [
      'tests/audit-accessibility.js',
      browserName,
      state,
      baseURL,
    ]);
    expect(stdout).toContain('sin infracciones detectadas');
  });
}

test('privacidad, logo, crédito y diseño adaptable', async ({ page }, testInfo) => {
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url());
  });
  await expect(page.locator('.brand img')).toHaveAttribute('src', './logo-usi.jpg');
  await expect(page.getByRole('link', { name: 'Designed by Tony' })).toHaveAttribute(
    'href',
    'https://github.com/TonyMB17',
  );
  await page.screenshot({
    path: testInfo.outputPath('initial.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await fillCase(page);
  for (const width of [320, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({
    path: testInfo.outputPath('desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(external).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: '' });
});

test('sin JavaScript no se habilita el envío ni se serializan entradas', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.locator('[type="submit"]')).toBeDisabled();
    await expect(page.locator('#startup-notice')).toBeVisible();
    await expect(page.locator('#age-form [name]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
