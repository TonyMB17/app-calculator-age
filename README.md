# Calculadora de edad corregida

Aplicación estática en español para personal de salud que atiende a niños prematuros. HTML semántico, CSS y JavaScript modular con Vite, sin framework, backend ni dependencias de ejecución.

## Desarrollo y pruebas

Requiere Node.js 22.12 o posterior. Entorno de entrega: Node 24.13.0 y npm 11.12.0. El lockfile fija las dependencias y `.npmrc` bloquea sus scripts de instalación.

```sh
npm ci
npm run dev
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
npm run build
npm run preview
npm run format:check
npm audit --audit-level=moderate
```

Las pruebas de navegador sirven el build bajo `/calculadora/`, como una subruta de GitHub Pages. Las auditorías axe se ejecutan en procesos independientes para evitar un cierre de Firefox en Windows al inyectarlas desde el worker de pruebas. No se omiten reglas.

## Uso — método v1.2.0

Ingresar nacimiento, semanas completas, días adicionales y fecha de evaluación; pulsar **Calcular edad corregida** o Enter. Los selectores admiten únicamente **20–36 semanas** y **0–6 días**. Los días muestran 0 inicialmente; las semanas no se presuponen. El máximo soportado es 36 semanas y 6 días. El rango es operativo, no una afirmación de viabilidad. Esta versión está destinada exclusivamente a prematuros; no admite gestaciones desde 37 semanas.

El resultado principal se expresa en **meses y días calendario**. Debajo aparecen semanas/días y el total exacto de días. Se muestran una sola vez edad cronológica, tiempo descontado y fecha equivalente a 40 semanas (estimada). No se repiten las entradas del formulario ni se incluyen explicación desplegable, copia o impresión: esas funciones se retiraron por solicitud del usuario.

Editar una entrada retira el resultado anterior. **Nuevo cálculo** limpia nacimiento y semanas, selecciona 0 días, restablece hoy en Lima y enfoca nacimiento.

### Cálculo y fechas

```text
gestación_días = semanas × 7 + días
edad_cronológica = evaluación − nacimiento
corrección = 280 − gestación_días
fecha_equivalente_40s = nacimiento + corrección
edad_corregida = edad_cronológica − corrección
```

Antes de la fecha equivalente se muestran los días pendientes y la edad posmenstrual; no se presenta una edad negativa ni se reemplaza por cero. En la fecha equivalente el resultado es 0 meses y 0 días. Desde el segundo aniversario se destaca el aviso de estar fuera del intervalo habitual y se identifica el resultado como cálculo matemático, sin recomendación clínica. El aniversario del 29 de febrero se ajusta al último día de febrero.

Se validan las fechas civiles antes de convertirlas en ordinales UTC de días enteros. `America/Lima` se usa para obtener hoy; no desplaza las fechas ingresadas. Se rechazan fechas futuras, fechas irreales y evaluación anterior al nacimiento.

Los selectores de fecha usan el formato del navegador; la fecha equivalente se presenta como `dd/mm/aaaa`. La diferencia calendario toma el máximo de meses completos sumados directamente desde el día original, limitado al último día del mes destino; después cuenta los días restantes. Los años se expresan como meses (un año y dos meses son 14 meses). No se usan meses de duración fija ni se redondean semanas. Ante discrepancias con otro sistema, el total exacto de días es la referencia técnica.

## Interfaz y privacidad

Se usa el logo USI proporcionado por el usuario y se mantiene el crédito «Designed by Tony», enlazado a https://github.com/TonyMB17. No se atribuye aval ni certificación institucional.

La vista móvil prioriza el resultado y los controles, con comprobaciones de ajuste en 320×568, 375×667 y 390×844. El desplazamiento natural sigue disponible para errores, referencias abiertas, zoom y teclado; no se recorta contenido.

No se solicitan identificadores de pacientes. No se envían entradas, no se almacenan datos en cookies, localStorage o sessionStorage ni se añaden parámetros a la URL. Sin analítica, fuentes externas, historiales o service worker. El alojamiento solo recibe solicitudes de archivos estáticos. Si JavaScript no carga, el cálculo queda deshabilitado y los controles sin atributo `name` impiden serializar las entradas.

## Organización

```text
src/domain/             Fechas civiles, validación y cálculo puro
src/ui/form.js          Formulario, foco y resultado vigente
src/ui/results.js       Meses/días, equivalencias y datos complementarios
src/styles.css          Diseño adaptable, controles y movimiento reducido
tests/unit/             Vitest
tests/e2e/              Playwright sobre el build
.github/workflows/      Controles y despliegue a Pages
docs/ESPECIFICACION.md   Especificación inicial conservada como historial
docs/VERIFICACION.md     Evidencia técnica y cambios posteriores
```

## Publicación

El repositorio público es [TonyMB17/app-calculator-age](https://github.com/TonyMB17/app-calculator-age). En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**. No usar **Deploy from a branch**: esta aplicación necesita la compilación de Vite en `dist`; la raíz del repositorio contiene el código fuente sin compilar. El workflow **Calidad y GitHub Pages** se ejecuta al subir cambios a `main`. El sitio se publica en <https://tonymb17.github.io/app-calculator-age/>.

El workflow ejecuta instalación reproducible, formato, pruebas, auditoría y build; publica solo `dist`. Las pull requests no despliegan. Solo el trabajo de despliegue tiene permisos de escritura de Pages y OIDC. Vite usa `base: './'`. Configurar protección de `main` para exigir controles. Para volver a una versión anterior, revertir el cambio y ejecutar nuevamente el workflow.

Guía oficial: [workflows personalizados de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Alcance y referencias

Herramienta de apoyo para personal de salud; interpretar según la evaluación clínica y el protocolo local. Las pruebas técnicas no constituyen validación clínica, certificación ni cumplimiento de una norma MINSA. Sin diagnóstico, tratamiento, vacunas o programación CRED.

Referencias consultadas el 12/11/2026:

- [OMS — Preterm birth](https://www.who.int/news-room/fact-sheets/detail/preterm-birth): definición antes de 37 semanas completas.
- [AAP / HealthyChildren — Corrected Age For Preemies](https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx): corrección respecto de 40 semanas.
- [Washington DCYF — Age Correction in Evaluation and Assessment](https://www.dcyf.wa.gov/sites/default/files/pdf/esit/AgeCorrect-PrematureGuide.pdf): guía revisada en junio de 2020, referencia del intervalo de 24 meses cronológicos.

Pendiente: publicación real, revisión clínica local, pruebas con lector de pantalla y teléfonos físicos, y validación con 3–5 profesionales. No se han realizado sesiones de usabilidad ni se inventan sus resultados. Una auditoría axe sin infracciones no demuestra por sí sola cumplimiento integral WCAG 2.2 AA.
