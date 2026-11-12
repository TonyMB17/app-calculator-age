import { expect, it } from 'vitest';
import { monthDays, resultSummary } from '../../src/ui/results.js';
import { calculate } from '../../src/domain/corrected-age.js';

it.each([
  [{ years: 0, months: 1, days: 1 }, '1 mes y 1 día'],
  [{ years: 0, months: 0, days: 0 }, '0 meses y 0 días'],
  [{ years: 1, months: 2, days: 4 }, '14 meses y 4 días'],
])('presenta meses calendario completos y días: %j', (value, expected) => {
  expect(monthDays(value)).toBe(expected);
});

it('anuncia la edad corregida en meses y días', () => {
  const r = calculate(
    { birth: '2026-01-01', weeks: '32', days: '4', evaluation: '2026-03-26' },
    '2026-11-12',
  );
  expect(resultSummary(r)).toBe('Edad corregida: 1 mes y 4 días');
});
