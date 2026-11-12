import { formatDate } from '../domain/dates.js';

export function monthDays(value) {
  const months = value.years * 12 + value.months;
  return `${months} ${months === 1 ? 'mes' : 'meses'} y ${value.days} ${value.days === 1 ? 'día' : 'días'}`;
}

export const weekDays = (days) => `${Math.floor(days / 7)} semanas y ${days % 7} días`;

export function resultSummary(r) {
  if (r.outsideInterval)
    return 'Fuera del intervalo habitual de uso para seguimiento del desarrollo';
  if (r.state === 'before-term')
    return `Aún no alcanza la fecha equivalente a 40 semanas. Faltan ${-r.corrected} días.`;
  if (r.state === 'at-term')
    return '0 meses y 0 días: alcanza hoy la fecha equivalente a 40 semanas';
  return `Edad corregida: ${monthDays(r.correctedCalendar)}`;
}

export function renderResult(container, r) {
  // Templates receive only validated numbers and internally formatted dates.
  const age =
    r.state === 'before-term'
      ? `<p class="result-label">ANTES DE 40 SEMANAS</p><p class="age-value">Faltan ${-r.corrected} días</p><p class="calendar-age">Edad posmenstrual: ${weekDays(r.postmenstrual)}</p>`
      : `<p class="result-label">${r.outsideInterval ? 'CÁLCULO MATEMÁTICO DE EDAD CORREGIDA' : 'EDAD CORREGIDA'}</p><p class="age-value">${monthDays(r.correctedCalendar)}</p><p class="calendar-age">${weekDays(r.corrected)} <span>· ${r.corrected} días en total</span></p>${r.state === 'at-term' ? '<p class="term-note">Alcanza hoy la fecha equivalente a 40 semanas.</p>' : ''}`;
  const warning = r.outsideInterval
    ? `<div class="interval-notice"><h3>${resultSummary(r)}</h3><p>Revisa el protocolo de tu establecimiento. El cálculo matemático no es una recomendación clínica.</p></div>`
    : '';
  container.innerHTML = `${warning}<div class="age-block">${age}</div>
    <dl class="result-metrics">
      <div><dt>Edad cronológica</dt><dd>${monthDays(r.chronologicalCalendar)}</dd></div>
      <div><dt>Tiempo descontado</dt><dd>${r.correction} días</dd></div>
      <div><dt>Fecha equivalente a 40 semanas (estimada)</dt><dd>${formatDate(r.equivalent)}</dd></div>
    </dl>`;
  container.classList.remove('result-enter');
  void container.offsetWidth;
  container.classList.add('result-enter');
}
