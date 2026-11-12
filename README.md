# Calculadora de edad corregida

Aplicación web estática en español para personal de salud que atiende a niños prematuros. Calcula edad cronológica, corrección por prematuridad, fecha equivalente a 40 semanas y edad corregida. Implementada con HTML semántico, CSS, JavaScript modular y Vite, sin framework ni dependencias de ejecución.

La especificación original se conserva en [docs/ESPECIFICACION.md](docs/ESPECIFICACION.md). El plan está en [tasks/plan.md](tasks/plan.md) y la evidencia en [docs/VERIFICACION.md](docs/VERIFICACION.md).

## Ejecutar y verificar

Requiere Node.js 22.12 o posterior. Entorno verificado: Node 24.13.0 y npm 11.12.0. El lockfile fija las versiones utilizadas; `.npmrc` bloquea los scripts de instalación de dependencias. No se necesita habilitarlos para compilar.

```sh
npm ci
npm run dev
```

Abrir la dirección local mostrada por Vite; no abrir `index.html` mediante `file://`.

```sh
npm test                        # Vitest: fechas, reglas y presentación
npx playwright install chromium firefox webkit
npm run test:e2e                # Compila y prueba dist bajo /calculadora/
npm run build                   # Genera dist/
npm run preview                 # Revisa dist localmente
npm run format:check            # Verifica formato
npm run format                  # Aplica formato
npm audit --audit-level=moderate
```

Las auditorías axe se ejecutan en procesos independientes: Firefox en este entorno Windows se cierra al inyectar axe desde el worker de Playwright, pero funciona con la API independiente. Se mantienen todas las auditorías y reglas en los tres motores. Las capturas se generan en `test-results/`.

## Método v1.0.0

Los límites están centralizados en `src/domain/corrected-age.js`: 20–42 semanas completas y 0–6 días adicionales. Son límites operativos, no afirmaciones de viabilidad. Los días comienzan vacíos y no se asumen iguales a cero.

```text
gestación_días = semanas × 7 + días
edad_cronológica = evaluación − nacimiento
si gestación_días < 259 (37 semanas):
    corrección = 280 − gestación_días
    fecha_equivalente_40s = nacimiento + corrección
    edad_corregida = edad_cronológica − corrección
```

Con 37 semanas o más no se aplica corrección. Antes de la fecha equivalente se presentan los días pendientes y la edad posmenstrual (gestación más edad cronológica), sin sustituir el resultado por cero. El día equivalente se muestra como cero exacto. La «Fecha equivalente a 40 semanas (estimada)» no representa una fecha obstétrica documentada.

Desde el segundo aniversario se destaca el aviso de estar fuera del intervalo habitual de uso para seguimiento del desarrollo. El cálculo matemático permanece como dato secundario desplegable, sin constituir una recomendación clínica. El aniversario del 29 de febrero se ajusta al último día de febrero. El umbral de 24 meses cronológicos es una regla explícita de esta versión, revisable ante un protocolo local.

### Convención de fechas

Se validan los componentes antes de convertir una fecha ISO en un ordinal UTC de días enteros. No se restan medianoches locales. `America/Lima` se usa exclusivamente para obtener hoy; las entradas no se desplazan. Se rechazan fechas futuras, desbordamientos y evaluación anterior al nacimiento.

Resultados y exportaciones usan `dd/mm/aaaa`. Los selectores nativos usan el formato del navegador; las ayudas y el resumen permiten verificar la fecha elegida.

La representación canónica son semanas completas, días restantes y total exacto de días. Para la equivalencia calendario se busca el máximo de meses completos sumados directamente desde el día original, limitado al último día del mes destino; después se cuentan los días restantes. Los meses completos se convierten en años y meses. No se suman meses iterativamente ni se usan meses de duración fija. Del 31/01/2026 al 28/02/2026 hay un mes calendario y 28 días exactos. Ante divergencias con otro sistema, el total exacto de días es la referencia técnica.

## Flujo y privacidad

Ingresar nacimiento, semanas, días y evaluación; pulsar **Calcular edad corregida** o Enter. Editar una entrada retira el resultado y deshabilita copia e impresión. **Nuevo cálculo** limpia nacimiento y gestación, restablece hoy en Lima y enfoca nacimiento.

El resumen copiado incluye entradas, resultados, método y versión. Si falla el portapapeles, se ofrece texto seleccionable. La impresión incluye método y referencias, sin formulario ni botones; el navegador permite guardar PDF.

No se solicitan nombres, DNI, historias clínicas ni teléfonos. Las entradas no se envían ni se guardan en la URL, cookies o almacenamiento web. No hay fuentes externas, analítica, historiales, backend ni service worker. El alojamiento recibe las solicitudes normales de archivos estáticos; los cálculos permanecen en el navegador. Copiar e imprimir requieren una acción explícita.

## Estructura

```text
src/domain/dates.js            Fechas civiles y calendario
src/domain/corrected-age.js    Límites, validación y cálculo puro
src/ui/form.js                Eventos, foco y resultado vigente
src/ui/results.js             Presentación y explicación numérica
src/ui/export.js              Resumen de texto
src/styles.css                Tokens, diseño adaptable, movimiento e impresión
tests/unit/                   Vitest
tests/e2e/                    Playwright sobre el build en una subruta
tests/audit-accessibility.js   Auditorías axe aisladas
.github/workflows/deploy.yml   Calidad y publicación de dist/
```

## Publicar en GitHub Pages

Esta entrega no está publicada y no tiene una URL pública verificada. Para activarla en tu cuenta:

1. Crear un repositorio público vacío, por ejemplo `calculadora-edad-corregida`.
2. Subir el proyecto a la rama `main`, incluido `package-lock.json`. `.gitignore` excluye dependencias, build y resultados de pruebas.
3. En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**.
4. En **Actions → Calidad y GitHub Pages**, ejecutar el workflow o realizar un push a `main`.
5. Esperar a que termine `deploy`. Abrir y comprobar la dirección real mostrada en el entorno `github-pages` o en Settings → Pages.

El workflow instala mediante `npm ci`, comprueba formato, ejecuta pruebas unitarias, auditoría de dependencias y pruebas de navegador que compilan el build; sube exclusivamente `dist` y despliega con acciones oficiales. En pull requests ejecuta controles sin publicar. Solo el trabajo de despliegue recibe permisos de escritura de Pages e identidad OIDC. Vite usa `base: './'` para admitir la subruta del repositorio.

Configura protección de `main` para exigir los controles antes de integrar cambios. Para volver a una versión anterior, revierte el cambio en Git y ejecuta el workflow. La configuración remota y la comprobación del enlace público siguen pendientes.

Guía oficial: [workflows personalizados de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Referencias y limitaciones

Herramienta de apoyo para personal de salud. Interpreta el resultado según la evaluación clínica y el protocolo de tu establecimiento. Las pruebas técnicas no constituyen validación clínica, certificación ni cumplimiento de una norma MINSA. No incluye diagnóstico, tratamiento, vacunas ni programación CRED.

Referencias consultadas el 12/11/2026:

- [OMS — Preterm birth](https://www.who.int/news-room/fact-sheets/detail/preterm-birth): definición antes de 37 semanas completas.
- [AAP / HealthyChildren — Corrected Age For Preemies](https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx): corrección respecto de 40 semanas y seguimiento del desarrollo durante los primeros dos años.
- [Washington DCYF — Age Correction in Evaluation and Assessment](https://www.dcyf.wa.gov/sites/default/files/pdf/esit/AgeCorrect-PrematureGuide.pdf): revisión de junio de 2020; referencia para el límite operativo de 24 meses cronológicos.

Pendiente: revisión clínica local, lector de pantalla, dispositivos físicos y validación de usabilidad con 3–5 profesionales. Tareas: calcular un caso, cambiar evaluación, copiar y empezar otro; metas propuestas de al menos 90 % de tareas sin ayuda, mediana menor de 30 segundos y facilidad percibida de 4/5. No se han realizado sesiones con participantes. El objetivo WCAG 2.2 AA no equivale a una certificación de accesibilidad completa.
