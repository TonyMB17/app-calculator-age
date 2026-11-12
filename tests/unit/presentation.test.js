import { expect, it } from 'vitest';
import { calendarText } from '../../src/ui/results.js';
import { exportText } from '../../src/ui/export.js';
import { calculate } from '../../src/domain/corrected-age.js';

it('presenta unidades singulares legibles', () => {
  expect(calendarText({ years: 1, months: 1, days: 1 })).toBe('1 año, 1 mes y 1 día calendario');
});

it('incluye datos y versión en la exportación de un caso sin corrección', () => {
  const text = exportText(
    calculate(
      { birth: '2026-01-01', weeks: '39', days: '0', evaluation: '2026-03-26' },
      '2026-11-12',
    ),
  );
  expect(text).toContain('No corresponde corrección');
  expect(text).toContain('84 días');
  expect(text).toContain('Método v1.0.0');
  expect(text).not.toContain('Fecha equivalente a 40 semanas (estimada):');
});
