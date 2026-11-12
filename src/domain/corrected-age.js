import { addMonths, calendarDifference, parseDate, todayInLima } from './dates.js';

export const METHOD_VERSION = '1.1.0';
// UI support limits; not clinical viability limits. Review with any local protocol.
export const LIMITS = Object.freeze({
  minWeeks: 20,
  maxWeeks: 42,
  minDays: 0,
  maxDays: 6,
  pretermDays: 259,
  termDays: 280,
  followUpMonths: 24,
});

export function validate(input, today = todayInLima()) {
  const errors = {};
  const birth = parseDate(input.birth);
  const evaluation = parseDate(input.evaluation);
  const now = parseDate(today);
  if (now === null) throw new TypeError('Hoy debe ser una fecha civil válida.');
  for (const [key, label, ordinal] of [
    ['birth', 'nacimiento', birth],
    ['evaluation', 'evaluación', evaluation],
  ]) {
    if (!input[key]) errors[key] = `Ingresa la fecha de ${label}.`;
    else if (ordinal === null) errors[key] = `Ingresa una fecha de ${label} real.`;
    else if (ordinal > now)
      errors[key] = `La fecha de ${label} no puede ser posterior a hoy en Lima.`;
  }
  if (birth !== null && evaluation !== null && evaluation < birth)
    errors.evaluation = 'La evaluación debe ser igual o posterior al nacimiento.';
  for (const [key, min, max, label] of [
    ['weeks', LIMITS.minWeeks, LIMITS.maxWeeks, 'las semanas completas'],
    ['days', LIMITS.minDays, LIMITS.maxDays, 'los días adicionales'],
  ]) {
    const value = String(input[key] ?? '');
    if (key === 'days' && value === '') continue;
    if (!value.trim()) errors[key] = `Ingresa ${label}; no se asume un valor desconocido.`;
    else if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) {
      errors[key] =
        `Usa un entero entre ${min} y ${max}. Verifica el registro: esta herramienta no calcula fuera de ese rango.`;
    }
  }
  return errors;
}

export function calculate(input, today = todayInLima()) {
  const errors = validate(input, today);
  if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
  const birth = parseDate(input.birth);
  const evaluation = parseDate(input.evaluation);
  const daysAssumed = input.days === '' || input.days == null;
  const normalizedInput = { ...input, days: daysAssumed ? '0' : input.days };
  const gestational = Number(input.weeks) * 7 + Number(normalizedInput.days);
  const chronological = evaluation - birth;
  const preterm = gestational < LIMITS.pretermDays;
  const correction = preterm ? LIMITS.termDays - gestational : 0;
  const equivalent = preterm ? birth + correction : null;
  const corrected = preterm ? chronological - correction : null;
  return {
    input: normalizedInput,
    daysAssumed,
    birth,
    evaluation,
    gestational,
    chronological,
    correction,
    equivalent,
    corrected,
    postmenstrual: gestational + chronological,
    chronologicalCalendar: calendarDifference(birth, evaluation),
    correctedCalendar:
      preterm && corrected >= 0 ? calendarDifference(equivalent, evaluation) : null,
    outsideInterval: preterm && evaluation >= addMonths(birth, LIMITS.followUpMonths),
    state: !preterm
      ? 'not-preterm'
      : corrected < 0
        ? 'before-term'
        : corrected === 0
          ? 'at-term'
          : 'corrected',
  };
}
