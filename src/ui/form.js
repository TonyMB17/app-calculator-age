import { LIMITS, calculate, validate } from '../domain/corrected-age.js';
import { formatDate, parseDate, todayInLima } from '../domain/dates.js';
import { renderResult, resultSummary } from './results.js';
import { exportText } from './export.js';

export function setupForm() {
  const form = document.querySelector('#age-form');
  const fields = ['birth', 'weeks', 'days', 'evaluation'];
  const elements = Object.fromEntries(fields.map((key) => [key, form.elements[key]]));
  const content = document.querySelector('#result-content');
  const initialContent = content.innerHTML;
  const status = document.querySelector('#status');
  const summary = document.querySelector('#error-summary');
  const copy = document.querySelector('#copy');
  const print = document.querySelector('#print');
  const fallback = document.querySelector('#copy-fallback');
  const copyText = document.querySelector('#copy-text');
  const tag = document.querySelector('#result-tag');
  let active = null;

  elements.days.min = LIMITS.minDays;
  elements.days.max = LIMITS.maxDays;
  const mobile = matchMedia('(max-width: 760px)');
  mobile.addEventListener('change', () => {
    const details = content.querySelector('.result-details');
    if (details) details.open = !mobile.matches;
  });

  function updateGestationStatus() {
    const weeks = Number(elements.weeks.value);
    document.querySelector('#gestation-status').textContent = !weeks
      ? 'Selecciona las semanas de gestación.'
      : weeks < 37
        ? 'Prematuro: se aplica corrección de edad.'
        : 'No prematuro: edad cronológica sin corrección.';
  }

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

  function updateDateHints() {
    for (const key of ['birth', 'evaluation']) {
      const ordinal = parseDate(elements[key].value);
      document.querySelector(`#${key}-help`).textContent =
        ordinal === null
          ? 'El selector usa el formato de tu navegador.'
          : `Fecha seleccionada: ${formatDate(ordinal)} (dd/mm/aaaa).${key === 'evaluation' ? ' Hoy en Lima, o una fecha anterior.' : ''}`;
    }
  }

  function invalidate(message = '') {
    delete status.dataset.kind;
    active = null;
    copy.disabled = print.disabled = true;
    fallback.hidden = true;
    copyText.value = '';
    content.innerHTML = initialContent;
    content.classList.remove('result-enter');
    tag.textContent = message ? 'Por actualizar' : 'Por calcular';
    status.textContent = message;
  }

  elements.evaluation.value = refreshToday();
  updateDateHints();
  updateGestationStatus();
  form.addEventListener('input', () => {
    if (active) invalidate('Los datos cambiaron. Vuelve a calcular');
    clearErrors();
    updateDateHints();
    updateGestationStatus();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const input = Object.fromEntries(fields.map((key) => [key, elements[key].value]));
    const today = refreshToday();
    const errors = validate(input, today);
    if (Object.keys(errors).length) {
      invalidate();
      summary.textContent = `Revisa ${Object.keys(errors).length} campo(s) para calcular. ${Object.values(errors).join(' ')}`;
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
    fallback.hidden = true;
    copyText.value = '';
    renderResult(content, active);
    copy.disabled = print.disabled = false;
    tag.textContent = 'Calculado';
    status.textContent = resultSummary(active);
    status.dataset.kind = 'result';
    if (matchMedia('(max-width: 760px)').matches) {
      const heading = document.querySelector('#result-title');
      heading.focus({ preventScroll: true });
    }
  });
  document.querySelector('#reset').addEventListener('click', () => {
    form.reset();
    clearErrors();
    invalidate('Listo para un nuevo cálculo.');
    tag.textContent = 'Por calcular';
    elements.evaluation.value = refreshToday();
    updateDateHints();
    updateGestationStatus();
    elements.birth.focus();
  });
  copy.addEventListener('click', async () => {
    if (!active) return;
    const snapshot = active;
    const text = exportText(snapshot);
    try {
      await navigator.clipboard.writeText(text);
      if (active === snapshot) {
        status.dataset.kind = 'feedback';
        status.textContent = 'Resultado copiado. Ya puedes pegarlo.';
      }
    } catch {
      if (active !== snapshot) return;
      copyText.value = text;
      fallback.hidden = false;
      copyText.focus();
      copyText.select();
      status.textContent =
        'No se pudo acceder al portapapeles. Selecciona y copia el texto disponible.';
    }
  });
  print.addEventListener('click', () => {
    if (active) window.print();
  });
  // Browser-menu printing also reveals the method and references, then restores the UI.
  let closedDetails = [];
  window.addEventListener('beforeprint', () => {
    closedDetails = [...document.querySelectorAll('details:not([open])')];
    closedDetails.forEach((detail) => {
      detail.open = true;
    });
  });
  window.addEventListener('afterprint', () => {
    closedDetails.forEach((detail) => {
      detail.open = false;
    });
    closedDetails = [];
  });
  // Enable submission only after every handler is installed. Inputs deliberately
  // have no name attributes, so native submission cannot serialize their values.
  form.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#startup-notice').hidden = true;
}
