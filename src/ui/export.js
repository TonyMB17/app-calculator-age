import { METHOD_VERSION } from '../domain/corrected-age.js';
import { formatDate } from '../domain/dates.js';
import {
  CALENDAR_CONVENTION,
  calendarText,
  methodText,
  resultSummary,
  weekDays,
} from './results.js';

export function exportText(r) {
  return [
    `EDAD CORREGIDA · Método v${METHOD_VERSION}`,
    `Nacimiento: ${formatDate(r.birth)}`,
    `Gestación al nacer: ${Number(r.input.weeks)} semanas y ${Number(r.input.days)} días`,
    r.daysAssumed
      ? 'Días adicionales no ingresados: cálculo con semanas completas y 0 días adicionales.'
      : '',
    `Evaluación: ${formatDate(r.evaluation)}`,
    '',
    resultSummary(r),
    r.corrected !== null && r.corrected >= 0
      ? `${r.outsideInterval ? 'Cálculo matemático secundario' : 'Edad corregida'}: ${weekDays(r.corrected)} (${r.corrected} días); ${calendarText(r.correctedCalendar)}.`
      : '',
    r.corrected < 0
      ? `Faltan ${-r.corrected} días. Edad posmenstrual: ${weekDays(r.postmenstrual)}.`
      : '',
    `Edad cronológica: ${weekDays(r.chronological)} (${r.chronological} días); ${calendarText(r.chronologicalCalendar)}.`,
    `Tiempo descontado por prematuridad: ${r.correction} días.`,
    r.equivalent !== null
      ? `Fecha equivalente a 40 semanas (estimada): ${formatDate(r.equivalent)}.`
      : '',
    '',
    methodText(r),
    CALENDAR_CONVENTION,
    'Herramienta de apoyo para personal de salud. Interpreta el resultado según la evaluación clínica y el protocolo de tu establecimiento.',
    'Referencias: OMS — Preterm birth; AAP / HealthyChildren — Corrected Age For Preemies; Washington DCYF — Age Correction in Evaluation and Assessment (revisión junio 2020). Consultadas el 12/11/2026.',
  ]
    .filter(Boolean)
    .join('\n');
}
