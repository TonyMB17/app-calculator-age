import { calculate, validate } from '../domain/corrected-age.js';
import { todayInLima } from '../domain/dates.js';
import { renderResult, resultSummary } from './results.js';

export function setupForm() {
  const form = document.querySelector('#age-form');
  const fields = ['birth', 'weeks', 'days', 'evaluation'];
  const elements = Object.fromEntries(fields.map((key) => [key, form.elements[key]]));
  const content = document.querySelector('#result-content');
  const initialContent = content.innerHTML;
  const status = document.querySelector('#status');
  const summary = document.querySelector('#error-summary');
  const tag = document.querySelector('#result-tag');
  let active = null;

  function refreshToday() {
    const today = todayInLima();
    elements.birth.max = elements.evaluation.max = today;
    return today;
  }

  function clearErrors() {
    summary.hidden = true;
    for (const key of fields) {
      elements[key].removeAttribute('aria-invalid');
      document.querySelector(`#${key}-error`).hidden = true;
    }
  }

  function invalidate(message = '') {
    delete status.dataset.kind;
    active = null;
    content.innerHTML = initialContent;
    content.classList.remove('result-enter');
    tag.textContent = message ? 'Por actualizar' : 'Por calcular';
    status.textContent = message;
  }

  elements.evaluation.value = refreshToday();
  form.addEventListener('input', () => {
    if (active) invalidate('Los datos cambiaron. Vuelve a calcular');
    clearErrors();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const input = Object.fromEntries(fields.map((key) => [key, elements[key].value]));
    const today = refreshToday();
    const errors = validate(input, today);
    if (Object.keys(errors).length) {
      invalidate();
      summary.textContent = `Revisa los datos para calcular. ${Object.values(errors).join(' ')}`;
      summary.hidden = false;
      for (const [key, error] of Object.entries(errors)) {
        elements[key].setAttribute('aria-invalid', 'true');
        const message = document.querySelector(`#${key}-error`);
        message.textContent = error;
        message.hidden = false;
      }
      status.textContent = summary.textContent;
      elements[fields.find((key) => errors[key])].focus();
      return;
    }
    active = calculate(input, today);
    renderResult(content, active);
    tag.textContent = 'Calculado';
    status.textContent = resultSummary(active);
    status.dataset.kind = 'result';
    if (matchMedia('(max-width: 760px)').matches)
      document.querySelector('#result-title').focus({ preventScroll: true });
  });
  document.querySelector('#reset').addEventListener('click', () => {
    form.reset();
    clearErrors();
    invalidate('Listo para un nuevo cálculo.');
    tag.textContent = 'Por calcular';
    elements.evaluation.value = refreshToday();
    elements.birth.focus();
  });
  // Inputs have no name attributes, so native submission cannot serialize them.
  form.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#startup-notice').hidden = true;
}
