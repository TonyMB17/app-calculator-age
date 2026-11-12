import { expect, it } from 'vitest';
import { calendarText } from '../../src/ui/results.js';
import { exportText } from '../../src/ui/export.js';
import { calculate } from '../../src/domain/corrected-age.js';

it('presenta unidades singulares legibles', () => {
  expect(calendarText({ years: 1, months: 1, days: 1 })).toBe('1 año, 1 mes y 1 día calendario');
});

it('explicita la suposición de cero días al copiar un cálculo solo con semanas', () => {
  const result = calculate(
    { birth: '2026-01-01', weeks: '32', days: '', evaluation: '2026-03-26' },
    '2026-11-12',
  );
  expect(exportText(result)).toContain('Días adicionales no ingresados');
  expect(exportText(result)).toContain('0 días adicionales');
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
  expect(text).toContain('Método v1.1.0');
  expect(text).not.toContain('Fecha equivalente a 40 semanas (estimada):');
});
