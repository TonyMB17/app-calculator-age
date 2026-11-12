import { describe, expect, it } from 'vitest';
import {
  parseDate,
  addMonths,
  calendarDifference,
  todayInLima,
  formatDate,
} from '../../src/domain/dates.js';
import { calculate, validate } from '../../src/domain/corrected-age.js';

const today = '2026-11-12';
const input = (overrides = {}) => ({
  birth: '2026-01-01',
  weeks: '32',
  days: '0',
  evaluation: '2026-03-26',
  ...overrides,
});

describe('fechas civiles', () => {
  it.each(['2026-02-31', '2025-02-29', '2026-13-01', '2026-00-10', '', '26/03/2026', '2026-1-01'])(
    'rechaza %s sin desbordar',
    (value) => {
      expect(parseDate(value)).toBeNull();
    },
  );
  it('cuenta días bisiestos y cambios de año', () => {
    expect(parseDate('2024-03-01') - parseDate('2024-02-28')).toBe(2);
    expect(parseDate('2026-01-01') - parseDate('2025-12-31')).toBe(1);
  });
  it('limita meses desde el día original sin acumular desplazamientos', () => {
    expect(formatDate(addMonths(parseDate('2026-01-31'), 1))).toBe('28/02/2026');
    expect(calendarDifference(parseDate('2026-01-31'), parseDate('2026-03-30'))).toEqual({
      years: 0,
      months: 1,
      days: 30,
    });
    expect(calendarDifference(parseDate('2026-01-31'), parseDate('2026-02-28'))).toEqual({
      years: 0,
      months: 1,
      days: 0,
    });
  });
  it('obtiene hoy en Lima incluso antes de medianoche UTC', () => {
    expect(todayInLima(new Date('2026-11-13T02:00:00Z'))).toBe('2026-11-12');
  });
});

describe('cálculo', () => {
  it.each([
    [{}, 84, 56, 28, 'corrected'],
    [{ days: '4' }, 84, 52, 32, 'corrected'],
    [{ evaluation: '2026-01-29' }, 28, 56, -28, 'before-term'],
    [{ evaluation: '2026-02-26' }, 56, 56, 0, 'at-term'],
    [{ weeks: '36', days: '6', evaluation: '2026-01-29' }, 28, 22, 6, 'corrected'],
    [{ evaluation: '2026-01-01' }, 0, 56, -56, 'before-term'],
  ])('resuelve %j', (overrides, chronological, correction, corrected, state) => {
    expect(calculate(input(overrides), today)).toMatchObject({
      chronological,
      correction,
      corrected,
      state,
    });
  });
  it('calcula edad posmenstrual antes de término', () => {
    expect(calculate(input({ evaluation: '2026-01-29' }), today).postmenstrual).toBe(252);
  });
  it.each([
    ['2024-01-01', '2025-12-31', false],
    ['2024-01-01', '2026-01-01', true],
    ['2024-02-29', '2026-02-27', false],
    ['2024-02-29', '2026-02-28', true],
  ])('umbral de 24 meses %s a %s', (birth, evaluation, outsideInterval) => {
    expect(calculate(input({ birth, evaluation }), today).outsideInterval).toBe(outsideInterval);
  });
});

describe('validación', () => {
  it.each([
    ['birth', ''],
    ['birth', '2026-02-31'],
    ['birth', '2026-11-13'],
    ['weeks', '19'],
    ['weeks', '37'],
    ['weeks', '42'],
    ['weeks', '32.4'],
    ['weeks', ''],
    ['days', '7'],
    ['days', '-1'],
    ['days', '1.5'],
    ['evaluation', ''],
    ['evaluation', '2025-12-31'],
    ['evaluation', '2026-11-13'],
  ])('bloquea %s = %s', (field, value) => {
    expect(validate(input({ [field]: value }), today)[field]).toBeTruthy();
    expect(() => calculate(input({ [field]: value }), today)).toThrow();
  });
  it('acepta los extremos operativos', () => {
    expect(validate(input({ weeks: '20', days: '0' }), today)).toEqual({});
    expect(validate(input({ weeks: '36', days: '6' }), today)).toEqual({});
  });
  it.each(['', undefined])('calcula solo con semanas cuando se omiten los días: %s', (days) => {
    const result = calculate(input({ days }), today);
    expect(result).toMatchObject({ correction: 56, corrected: 28, daysAssumed: true });
    expect(result.input.days).toBe('0');
  });
});
