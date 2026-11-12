# Actualización v1.1.0 — 12/11/2026

Días opcionales (vacío equivale a cero adicionales, identificado en detalle y copia), selector agrupado de semanas, indicación sin corrección desde 37 semanas, logo USI y crédito del autor. La vista móvil principal usa revelado progresivo para mantener controles de 44 px e inputs de 16 px. Se comprueba el ajuste vertical en 320×568, 375×667 y 390×844; abrir detalles, errores o teclado puede requerir desplazamiento.

Pruebas de esta actualización: 42 pruebas unitarias y 42 comprobaciones E2E aprobadas en Chromium, Firefox y WebKit; auditorías axe inicial y con resultado sin infracciones. Se comprobaron días omitidos y transparencia de la copia. El detector visual advirtió una jerarquía tipográfica plana al analizar HTML sin resolver los estilos por capas; la inspección real confirma título de escritorio de 42 px, resultado móvil de 25 px e inputs de 16 px. Se ajustaron los bordes laterales informativos a 1 px. Se volvió a revisar un PDF A4 con días omitidos: resultado, supuesto, método y referencias completos en una página. Bundle final: 8,38 KiB gzip de JS y CSS; auditoría de dependencias sin vulnerabilidades conocidas. No se ha probado en teléfonos físicos.

La documentación que sigue corresponde a la entrega inicial; se conservan sus evidencias históricas. La regla anterior que exigía días fue reemplazada por instrucción explícita del usuario.

# Verificación técnica — 12/11/2026

Entrega local del método v1.0.0. Estas comprobaciones no constituyen validación clínica ni certificación de accesibilidad.

## Entorno y resultados

- Windows, Node.js 24.13.0, npm 11.12.0.
- Vite 8.3.8, Vitest 5.1.0, Playwright 1.65.0 y axe 4.14.0 (versiones fijadas por el lockfile).
- `npm ci` con scripts de dependencias bloqueados: instalación correcta.
- `npm test`: 40 pruebas unitarias aprobadas, sin casos omitidos.
- Suite de 38 pruebas de fechas/cálculo ejecutada también con `TZ=Pacific/Auckland` y `TZ=America/Los_Angeles`: mismos resultados.
- Playwright: 12 flujos por motor, 36 comprobaciones en Chromium 158, Firefox 159 y WebKit 27.2. Incluye dos auditorías axe por motor (estado inicial y resultado), en procesos independientes por un cierre reproducible de Firefox al inyectar axe dentro del worker.
- `npm run build`: correcto; presupuesto automático de JS + CSS gzip: 7,33 KiB de un máximo de 100 KiB.
- `npm run format:check`: correcto.
- `npm audit --audit-level=moderate`: ninguna vulnerabilidad conocida en el lockfile entregado. No es garantía frente a vulnerabilidades desconocidas.

## Cobertura funcional

Se verificaron los ejemplos del README original, precisión de días adicionales, días omitidos, gestación 36+6 y 37+0, cero exacto, evaluación antes de término, edad posmenstrual, ausencia de corrección con 39 semanas, bisiestos, cambio de año, fechas futuras/irreales, evaluación anterior al nacimiento, fracciones, rangos operativos y segundo aniversario (incluido 29 de febrero).

En navegador se comprobaron validación y foco, envío con Enter, recorrido con Tab (incluidos los segmentos del selector nativo), nuevo cálculo, retirada del resultado al editar, botones de copia e impresión deshabilitados para datos obsoletos, copia correcta, portapapeles fallido y rechazo asíncrono tras editar. Sin JavaScript el cálculo queda deshabilitado, se muestra una explicación y Enter no envía las entradas. Los controles carecen deliberadamente de atributos `name`, para que una eventual presentación nativa no pueda serializar los valores.

La app compilada se sirvió realmente bajo `/calculadora/`; las pruebas no dependen del servidor de desarrollo. Se comprobaron anchos de 320, 768, 1024 y 1440 píxeles sin desbordamiento horizontal, y 640 CSS px como aproximación al espacio disponible con zoom 200 % en una ventana de 1280 px. Esto no sustituye comprobar zoom real y dispositivos físicos.

Se verificó la ausencia de solicitudes externas durante el cálculo y de escrituras en cookies, localStorage y sessionStorage. El código de producción no incorpora telemetría ni persistencia. Las dependencias de prueba no se incluyen en el bundle.

## Revisión visual e impresión

Se inspeccionaron capturas del estado inicial, resultado en escritorio, resultado a 320 px y modo impresión. Las capturas se toman con las animaciones terminadas. La reducción de movimiento elimina las animaciones y el desplazamiento suave.

Se generó un PDF mediante la impresión real de Chromium inmediatamente después de calcular el caso 32+4 del 01/01/2026 al 26/03/2026. Se verificó su tamaño A4 con `pdfinfo`, se renderizó con Poppler y se inspeccionó visualmente: una página con resultado, datos, explicación y referencias, sin formulario ni botones. Esa comprobación detectó y permitió corregir un resultado invisible si la impresión coincidía con la animación de entrada. Existe una prueba de regresión que exige ausencia de animaciones en modo impresión. La paginación de otros estados puede variar con el navegador y los ajustes de impresión.

Las capturas y PDF de comprobación son archivos temporales en `test-results/`, excluidos de Git. No incluyen datos de pacientes reales.

## Revisión de código

- Lógica pura separada del DOM; límites operativos centralizados y hoy inyectable.
- Fechas UTC civiles validadas antes de convertirlas; meses sumados desde el día original.
- Plantillas construidas solo con valores numéricos validados y fechas formateadas internamente; errores y mensajes mediante `textContent`.
- Una sola referencia a resultado activo; la copia asíncrona verifica que siga siendo la vigente antes de mostrar feedback o texto alternativo.
- Sin dependencias de ejecución ni envío de entradas; instalación reproducible con scripts de terceros bloqueados.
- Workflow con controles antes de despliegue y permisos de Pages únicamente en el trabajo que publica.
- No se encontraron bloqueantes técnicos pendientes tras corregir los fallos descritos.

## Pendientes externos

- Crear/configurar el repositorio remoto, activar GitHub Pages y ejecutar el workflow en GitHub. Las acciones oficiales se consultaron al implementar, pero todavía no se ha ejecutado CI remoto ni comprobado un enlace público.
- Configurar la protección de `main` y los controles obligatorios en GitHub.
- Revisar interpretación y reglas ante el protocolo local con un responsable clínico.
- Validar con 3–5 profesionales; no se realizaron sesiones ni se atribuyen resultados a participantes.
- Revisión con lector de pantalla, zoom real del navegador, dispositivos físicos y diálogos nativos de impresión/portapapeles. Las pruebas automatizadas simulan éxito/fallo del portapapeles y la invocación de impresión, además de verificar el PDF real en Chromium.
- Una auditoría axe sin infracciones no demuestra por sí sola cumplimiento integral de WCAG 2.2 AA.
