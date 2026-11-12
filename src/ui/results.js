import { formatDate } from '../domain/dates.js';

export const weekDays = (days) => `${Math.floor(days / 7)} semanas y ${days % 7} días`;
export const calendarText = (value) =>
  `${value.years} ${value.years === 1 ? 'año' : 'años'}, ${value.months} ${value.months === 1 ? 'mes' : 'meses'} y ${value.days} ${value.days === 1 ? 'día' : 'días'} calendario`;

export function resultSummary(r) {
  if (r.outsideInterval)
    return 'Fuera del intervalo habitual de uso para seguimiento del desarrollo';
  if (r.state === 'not-preterm') return 'No corresponde corrección por prematuridad';
  if (r.state === 'before-term') return 'Aún no alcanza la fecha equivalente a 40 semanas';
  if (r.state === 'at-term')
    return '0 semanas y 0 días: alcanza hoy la fecha equivalente a 40 semanas';
  return `Edad corregida: ${weekDays(r.corrected)}`;
}

export function methodText(r) {
  if (r.state === 'not-preterm')
    return `Gestación: ${r.gestational} días, igual o mayor que 259 días (37 semanas). No se aplica corrección. Edad cronológica: ${r.chronological} días.`;
  return `Gestación: ${r.input.weeks} × 7 + ${r.input.days} = ${r.gestational} días. Corrección: 280 − ${r.gestational} = ${r.correction} días. Edad cronológica: ${r.chronological} días. Edad corregida: ${r.chronological} − ${r.correction} = ${r.corrected} días.${r.corrected < 0 ? ` El valor negativo expresa tiempo pendiente: faltan ${-r.corrected} días. Edad posmenstrual: ${r.gestational} + ${r.chronological} = ${r.postmenstrual} días.` : ''}`;
}

export const CALENDAR_CONVENTION =
  'Para la equivalencia calendario se toma el máximo de meses completos desde el día original, limitado al último día del mes destino; luego se cuentan los días restantes. Los meses completos se convierten en años y meses. No se usan meses de duración fija. El total exacto de días es la referencia técnica. El intervalo de 24 meses termina en el segundo aniversario; el 29 de febrero se ajusta al último día de febrero.';

export function renderResult(container, r) {
  // Only validated numerical values and internally formatted dates enter this template.
  const mainAge = r.state === 'not-preterm' ? r.chronological : r.corrected;
  const mainCalendar = r.state === 'not-preterm' ? r.chronologicalCalendar : r.correctedCalendar;
  const ageMarkup =
    r.state === 'before-term'
      ? `<p class="age-value">Faltan ${-r.corrected} días</p><p class="calendar-age">Edad posmenstrual: ${weekDays(r.postmenstrual)}</p>`
      : `<p class="age-value">${weekDays(mainAge)}</p><p class="calendar-age">${calendarText(mainCalendar)} <span>· ${mainAge} días exactos</span></p>`;
  const title = resultSummary(r);
  container.innerHTML = `
    ${
      r.outsideInterval
        ? `<div class="interval-notice"><h3>${title}</h3><p>Revisa el protocolo de tu establecimiento. El cálculo matemático se conserva como dato secundario y no es una recomendación clínica.</p></div><details class="math-secondary"><summary>Cálculo matemático de edad corregida</summary><div class="age-block"><p>${r.state === 'before-term' ? 'Aún no alcanza la fecha equivalente a 40 semanas' : 'Edad corregida matemática'}</p>${ageMarkup}</div></details>`
        : `<div class="age-block"><p class="result-label">${r.state === 'corrected' ? 'EDAD CORREGIDA' : r.state === 'not-preterm' ? 'EDAD CRONOLÓGICA' : r.state === 'before-term' ? 'ANTES DE 40 SEMANAS' : 'ALCANZA HOY LAS 40 SEMANAS'}</p>${ageMarkup}</div>`
    }
    <details class="result-details" ${matchMedia('(max-width: 760px)').matches ? '' : 'open'}><summary>Ver detalle del cálculo</summary><div><p class="result-explanation">${title}</p>
    ${r.daysAssumed ? '<p class="assumption-note">Días no ingresados: se usaron semanas completas + 0 días.</p>' : ''}
    <dl class="result-metrics"><div><dt>Edad cronológica</dt><dd>${weekDays(r.chronological)}<small>${r.chronological} días · ${calendarText(r.chronologicalCalendar)}</small></dd></div><div><dt>Tiempo descontado por prematuridad</dt><dd>${r.correction} días${r.correction ? `<small>${weekDays(r.correction)}</small>` : '<small>No se aplica corrección</small>'}</dd></div>${r.equivalent !== null ? `<div><dt>Fecha equivalente a 40 semanas (estimada)</dt><dd>${formatDate(r.equivalent)}</dd></div>` : ''}</dl>
    <div class="input-summary"><h3>Datos utilizados</h3><dl><div><dt>Nacimiento</dt><dd>${formatDate(r.birth)}</dd></div><div><dt>Gestación</dt><dd>${Number(r.input.weeks)} semanas + ${Number(r.input.days)} días</dd></div><div><dt>Evaluación</dt><dd>${formatDate(r.evaluation)}</dd></div></dl></div>
    <details class="method"><summary>Cómo se calcula</summary><p>${methodText(r)}</p><p>${CALENDAR_CONVENTION}</p></details></div></details>`;
  container.classList.remove('result-enter');
  void container.offsetWidth;
  container.classList.add('result-enter');
}
