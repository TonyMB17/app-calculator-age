# Plan de implementación

El README original es la especificación aprobada por el usuario y se conserva en docs/ESPECIFICACION.md. Aplicación estática, sin framework ni dependencias de ejecución. Método v1.0.0. No se agregan reglas clínicas.

1. Fechas civiles y cálculo puro. Aceptación: ejemplos y límites de la especificación, con hoy inyectado. Verificación: Vitest. Sin dependencias.
2. Formulario y resultados. Aceptación: validación específica, estados clínicos y retirada del resultado al editar. Verificación: Playwright. Depende de 1.
3. Copia, impresión y nuevo cálculo. Aceptación: resumen completo, alternativa de copia y ninguna acción con datos obsoletos. Verificación: Playwright. Depende de 2.
4. Acabado accesible y adaptable. Aceptación: 320 px, teclado, reducción de movimiento, revisión visual y auditoría automatizada. Depende de 2–3.
5. Publicación y documentación. Aceptación: build relativo, lockfile, workflow de Pages e instrucciones reproducibles. Verificación: build servido desde subruta y suites completas. Depende de 1–4.

Puntos de control: lógica aprobada por pruebas antes de UI; flujos completos antes de acabado; build final antes de entrega. Riesgos principales: fechas al fin de mes, límite del segundo aniversario, confundir resultados matemáticos fuera del intervalo y copias asíncronas obsoletas. Mitigación: pruebas específicas y un único resultado activo.

Pendientes externos: validación con 3–5 profesionales y revisión clínica local; configuración de Pages en una cuenta y comprobación del enlace real. No se declara cumplimiento WCAG integral ni validación clínica a partir de pruebas técnicas.
