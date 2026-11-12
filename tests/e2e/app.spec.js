import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('sin JavaScript no envía entradas y explica el requisito', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.getByRole('button', { name: 'Calcular edad corregida' })).toBeDisabled();
    await expect(page.locator('#startup-notice')).toBeVisible();
    await expect(page.locator('#startup-notice')).toContainText('JavaScript');
    for (const [key, value] of Object.entries({
      birth: '2026-01-01',
      weeks: '32',
      days: '4',
      evaluation: '2026-03-26',
    })) {
      if (key === 'weeks') await page.locator('#weeks').selectOption(value);
      else await page.locator(`#${key}`).fill(value);
    }
    const submitted = [];
    page.on('request', (request) => submitted.push(request.url()));
    await page.locator('#days').press('Enter');
    await expect(page).toHaveURL(baseURL);
    expect(submitted).toEqual([]);
  } finally {
    await context.close();
  }
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T17:00:00Z'));
  await page.goto('./');
});

async function fillCase(
  page,
  { weeks = '32', days = '4', evaluation = '2026-03-26', birth = '2026-01-01' } = {},
) {
  await page.getByLabel('Fecha de nacimiento', { exact: true }).fill(birth);
  await page.getByLabel('Semanas completas').selectOption(weeks);
  await page.getByLabel('Días adicionales').fill(days);
  await page.getByLabel('Fecha de evaluación', { exact: true }).fill(evaluation);
  await page.getByRole('button', { name: 'Calcular edad corregida' }).click();
}

test('cálculo preciso, invalidación y nuevo cálculo', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.getByLabel('Días adicionales')).toHaveValue('');
  await expect(page.getByLabel('Fecha de evaluación', { exact: true })).toHaveValue('2026-11-12');
  await fillCase(page);
  await expect(page.locator('#evaluation-help')).toContainText('26/03/2026');
  await expect(page.locator('#result-content')).toContainText('4 semanas y 4 días');
  await expect(page.locator('#result-content')).toContainText('52 días');
  // 1 January + 52 elapsed days = 22 February (not inclusive counting).
  await expect(page.locator('#result-content')).toContainText('22/02/2026');
  await page.getByLabel('Días adicionales').fill('0');
  await expect(page.getByRole('status')).toContainText('Los datos cambiaron. Vuelve a calcular');
  await expect(page.getByRole('button', { name: 'Copiar resultado', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Imprimir', exact: true })).toBeDisabled();
  await expect(page.locator('#result-content')).not.toContainText('4 semanas y 4 días');
  await page.getByRole('button', { name: 'Nuevo cálculo', exact: true }).click();
  await expect(page.getByLabel('Fecha de nacimiento', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Semanas completas')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('validación específica, conserva valores y enfoca primer error', async ({ page }) => {
  await page.getByRole('button', { name: 'Calcular edad corregida' }).click();
  await expect(page.getByLabel('Fecha de nacimiento', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Fecha de nacimiento', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await fillCase(page, { days: '7' });
  await expect(page.getByLabel('Días adicionales')).toBeFocused();
  await expect(page.locator('#days-error')).toContainText('entre 0 y 6');
  await expect(page.getByLabel('Semanas completas')).toHaveValue('32');
});

test('estados antes de término, cero, sin corrección y fuera del intervalo', async ({ page }) => {
  await fillCase(page, { days: '0', evaluation: '2026-01-29' });
  await expect(page.locator('#result-content')).toContainText('Faltan 28 días');
  await expect(page.locator('#result-content')).toContainText('36 semanas y 0 días');
  await fillCase(page, { days: '0', evaluation: '2026-02-26' });
  await expect(page.locator('#result-content')).toContainText('alcanza hoy');
  await fillCase(page, { weeks: '37', days: '0' });
  await expect(page.locator('#result-content')).toContainText(
    'No corresponde corrección por prematuridad',
  );
  await fillCase(page, { birth: '2024-01-01', evaluation: '2026-01-01' });
  await expect(page.locator('#result-content')).toContainText('Fuera del intervalo habitual');
  await expect(page.locator('#result-content')).toContainText('Cálculo matemático');
});

test('copia fallida ofrece texto e impresión usa el resultado vigente', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    });
    window.print = () => {
      window.printRequested = true;
    };
  });
  await fillCase(page);
  await page.getByRole('button', { name: 'Copiar resultado', exact: true }).click();
  await expect(page.getByLabel('Texto para copiar')).toBeVisible();
  await expect(page.getByLabel('Texto para copiar')).toHaveValue(/Método v1.1.0/);
  await page.getByRole('button', { name: 'Imprimir', exact: true }).click();
  expect(await page.evaluate(() => window.printRequested)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  expect(
    await page.locator('#result-content').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await expect(page.locator('form')).toBeHidden();
  await expect(page.locator('#result-content')).toBeVisible();
  await expect(page.locator('#references')).toBeVisible();
});

test('copia correcta incluye entradas y versión', async ({ page }) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copied = text;
        },
      },
    }),
  );
  await fillCase(page);
  await page.getByRole('button', { name: 'Copiar resultado', exact: true }).click();
  expect(await page.evaluate(() => window.copied)).toContain('26/03/2026');
  await expect(page.getByRole('status')).toContainText('Resultado copiado');
});

test('teclado, 320 px y movimiento reducido', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fillCase(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Nuevo cálculo', exact: true }).click();
  // Native date controls may have several internal Tab stops, depending on engine.
  for (
    let i = 0;
    i < 6 &&
    !(await page.getByLabel('Semanas completas').evaluate((el) => el === document.activeElement));
    i++
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(page.getByLabel('Semanas completas')).toBeFocused();
  await fillCase(page);
  await page.getByLabel('Días adicionales').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#result-content')).toContainText('4 semanas y 4 días');
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

test('días opcionales y evaluación futura', async ({ page }) => {
  await fillCase(page, { days: '' });
  await expect(page.locator('#result-content')).toContainText('4 semanas y 0 días');
  await expect(page.locator('#result-content')).toContainText('Días no ingresados');
  await fillCase(page, { evaluation: '2026-11-13' });
  await expect(page.locator('#evaluation-error')).toContainText('posterior a hoy');
});

test('logo, selector de semanas y crédito del autor', async ({ page }) => {
  await expect(page.locator('.brand img')).toHaveAttribute('src', './logo-usi.jpg');
  await expect(page.getByRole('link', { name: 'Designed by Tony' })).toHaveAttribute(
    'href',
    'https://github.com/TonyMB17',
  );
  await expect(page.locator('#weeks optgroup').first()).toHaveAttribute(
    'label',
    '29–36 semanas · Prematuro',
  );
  await page.locator('#weeks').selectOption('36');
  await expect(page.locator('#gestation-status')).toContainText('Prematuro');
  await page.locator('#weeks').selectOption('37');
  await expect(page.locator('#gestation-status')).toContainText('edad cronológica sin corrección');
  await fillCase(page, { weeks: '37', days: '' });
  await expect(page.locator('.age-block')).toContainText('EDAD CRONOLÓGICA');
  await expect(page.locator('.age-block')).toContainText('12 semanas y 0 días');
});

test('vista móvil principal sin scroll y detalles accesibles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await fillCase(page, { days: '' });
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
    );
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('.result-details')).not.toHaveAttribute('open', '');
    await expect(
      page.getByRole('button', { name: 'Copiar resultado', exact: true }),
    ).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Designed by Tony' })).toBeInViewport();
  }
  await page.getByText('Ver detalle del cálculo', { exact: true }).click();
  await expect(page.locator('.result-details')).toHaveAttribute('open', '');
  await expect(page.locator('.assumption-note')).toBeVisible();
});

test('no revela una copia pendiente tras cambiar los datos', async ({ page }) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise((_, reject) => {
            window.rejectCopy = reject;
          }),
      },
    }),
  );
  await fillCase(page);
  await page.getByRole('button', { name: 'Copiar resultado', exact: true }).click();
  await page.getByLabel('Días adicionales').fill('0');
  await page.evaluate(() => window.rejectCopy(new Error('denied')));
  await expect(page.locator('#copy-fallback')).toBeHidden();
  await expect(page.getByRole('status')).toContainText('Los datos cambiaron');
});

test('diseño, privacidad y detalles de impresión', async ({ page }, testInfo) => {
  const outgoing = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) outgoing.push(request.url());
  });
  await page.screenshot({
    path: testInfo.outputPath('initial.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await fillCase(page);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({
    path: testInfo.outputPath('desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  // 640 CSS px approximates the available width of a 1280 px desktop at 200% zoom.
  await page.setViewportSize({ width: 640, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(outgoing).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: '' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('#references')).toHaveAttribute('open', '');
  await expect(page.locator('.method')).toHaveAttribute('open', '');
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({
    path: testInfo.outputPath('print.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#references')).not.toHaveAttribute('open', '');
});
