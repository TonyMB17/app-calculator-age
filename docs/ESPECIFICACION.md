# Calculadora de edad corregida para niños prematuros

## 1. Instrucción para Codex

Implementa una aplicación web pública, estática y en español, dirigida al personal de salud que atiende a niños prematuros. Sigue este documento como especificación funcional y de experiencia de usuario. Entrega un proyecto funcional, probado y listo para publicar en GitHub Pages.

La prioridad es que el profesional pueda ingresar datos, revisar el resultado y comenzar otro cálculo con rapidez y confianza. El diseño debe ser elegante, claro y accesible; las animaciones deben facilitar la orientación sin retrasar el trabajo.

No te limites a generar una maqueta. Implementa los cálculos, validaciones, estados, impresión, pruebas y configuración de publicación. Resuelve decisiones técnicas menores de forma autónoma. No inventes reglas clínicas, avales institucionales ni enlaces de producción.

## 2. Objetivo y alcance

Permitir calcular edad cronológica, corrección por prematuridad, fecha equivalente a 40 semanas y edad corregida a una fecha de evaluación.

Primera versión:
- Acceso por enlace sin cuenta.
- Funcionamiento en celulares, tabletas y computadoras.
- Cálculo íntegramente en el navegador.
- Sin backend, base de datos ni registro de pacientes.
- Sin nombres, DNI, historia clínica o teléfonos.
- Sin recomendaciones de tratamiento, diagnóstico, calendario de vacunas ni programación automática de CRED.
- Sin panel administrativo, chatbot o funciones que distraigan del cálculo.

## 3. Tecnología y organización

Usar HTML semántico, CSS y JavaScript modular, con Vite para desarrollo y compilación. No usar un framework de interfaz salvo necesidad demostrada. Utilizar Vitest para probar la lógica de fechas y cálculo, y Playwright para los flujos esenciales. Elegir versiones estables compatibles al implementar y conservar el lockfile.

Estructura sugerida:

```text
index.html
src/
  main.js
  styles.css
  domain/
    dates.js
    corrected-age.js
  ui/
    form.js
    results.js
    export.js
public/
  favicon.svg
tests/
  unit/
  e2e/
.github/workflows/deploy.yml
package.json
README.md
```

Separar funciones puras de cálculo de los eventos y del DOM. No consultar servicios externos para calcular. Servir localmente todos los recursos necesarios y evitar fuentes o scripts desde CDN.

## 4. Flujo principal

1. Abrir la calculadora y encontrar el formulario sin pantallas de bienvenida.
2. Ingresar fecha de nacimiento.
3. Ingresar edad gestacional al nacer en dos campos: semanas completas y días adicionales.
4. Revisar fecha de evaluación, inicialmente hoy según America/Lima, y modificarla si corresponde.
5. Pulsar «Calcular edad corregida» o enviar con Enter.
6. Revisar un resultado inmediato, su explicación y los datos utilizados.
7. Copiar, imprimir o pulsar «Nuevo cálculo».

No calcular mientras los campos estén incompletos. Al modificar datos después de calcular, retirar el resultado activo y mostrar «Los datos cambiaron. Vuelve a calcular». Impedir copiar o imprimir un resultado desactualizado.

## 5. Entradas y validaciones

| Campo | Regla |
|---|---|
| Fecha de nacimiento | Obligatoria, fecha real, no futura respecto de hoy en Lima. |
| Semanas de gestación | Obligatorio, entero entre 20 y 42. Este rango es un límite operativo de la interfaz, no una afirmación de viabilidad. |
| Días adicionales | Obligatorio, entero entre 0 y 6. Mantener vacío inicialmente para evitar asumir un dato desconocido. |
| Fecha de evaluación | Obligatoria, fecha real, igual o posterior al nacimiento y no posterior a hoy. La versión inicial evalúa edades actuales o retrospectivas. |

Los rangos operativos deben estar centralizados y documentados. Si los datos están fuera del rango soportado, pedir verificar el registro y explicar que esta herramienta no calcula ese caso; no declarar que el dato es clínicamente imposible.

- Etiquetas siempre visibles; no depender de placeholders.
- Ayuda: «Ejemplo: 32 semanas y 4 días». No usar 32.4 como notación decimal.
- Si los días se desconocen, no convertirlos automáticamente en cero.
- Errores junto al campo, con texto específico y aria-describedby.
- Al enviar con errores, enfocar el primer campo inválido y anunciar el resumen.
- Conservar los valores para permitir corregirlos.
- No aceptar desbordamientos de fechas ni números fraccionarios.
- Presentar fechas en dd/mm/aaaa, con etiquetas inequívocas y selector nativo cuando sea adecuado.

## 6. Reglas de cálculo

### 6.1 Definiciones

La prematuridad se define como nacimiento antes de 37 semanas completas. La referencia de 40 semanas se utiliza para calcular la corrección; no significa que todo nacimiento entre 37 y 39 semanas deba corregirse.

```text
EG_dias = semanas * 7 + dias
edad_cronologica_dias = fecha_evaluacion - fecha_nacimiento
si EG_dias < 259:
    correccion_dias = 280 - EG_dias
    fecha_equivalente_40s = fecha_nacimiento + correccion_dias
    edad_corregida_dias = edad_cronologica_dias - correccion_dias
```

Nombrar la fecha «Fecha equivalente a 40 semanas (estimada)». No presentarla como una fecha probable de parto obstétrica documentada.

### 6.2 Estados clínicos y de interfaz

| Condición | Comportamiento |
|---|---|
| EG menor de 37 semanas y edad corregida positiva | Mostrar edad corregida como resultado principal. |
| Edad corregida exactamente cero | «0 semanas y 0 días: alcanza hoy la fecha equivalente a 40 semanas». |
| Edad corregida negativa | «Aún no alcanza la fecha equivalente a 40 semanas», días que faltan y edad posmenstrual. No mostrar una edad negativa como resultado principal ni sustituirla por cero. |
| EG igual o mayor de 37 semanas | «No corresponde corrección por prematuridad». Mostrar edad cronológica y no aplicar la resta de 40 semanas. |
| Prematuro con 24 meses cronológicos o más | Mostrar aviso «Fuera del intervalo habitual de uso para seguimiento del desarrollo». Se puede conservar el cálculo matemático como resultado secundario, identificado como tal; no presentarlo como recomendación clínica. |

Edad posmenstrual en días = EG_dias + edad_cronologica_dias. Mostrarla principalmente antes de la fecha equivalente a 40 semanas, diferenciada de la edad corregida.

El umbral operativo de 24 meses se determina por el segundo aniversario del nacimiento, con ajuste al último día del mes para 29 de febrero. Es una regla explícita de esta versión y debe poder revisarse ante un protocolo local.

### 6.3 Fechas y precisión

- Trabajar con fechas civiles sin hora y días enteros; se puede usar un ordinal basado en UTC tras validar componentes.
- No restar fechas a medianoche local ni dividir diferencias afectadas por cambios horarios.
- Utilizar America/Lima únicamente para obtener la fecha inicial de hoy y validar fechas futuras, sin desplazar fechas introducidas por el usuario.
- Manejar años bisiestos, fin de mes y cambio de año.
- Resultado canónico: semanas completas y días restantes, además del total de días.
- Representación secundaria en años, meses y días calendario, calculada entre la fecha equivalente a 40 semanas y la evaluación. Para edad cronológica, usar nacimiento y evaluación.
- Definir diferencia calendario como máximo de meses completos desde la fecha inicial, sumados directamente desde su día original y limitados al último día del mes destino; después contar días restantes. Convertir meses completos en años y meses. Evitar sumas iterativas que acumulen desplazamientos de fin de mes.
- No usar meses de 28 o 30 días ni redondear semanas hacia arriba.
- Documentar esa convención de calendario en «Cómo se calcula»; ante divergencias con un sistema externo, el total exacto de días es la referencia técnica.

## 7. Resultado y transparencia

La tarjeta de resultado debe incluir:
- Edad corregida en semanas y días, con máxima jerarquía visual cuando aplique.
- Equivalencia calendario secundaria, sin competir con el resultado principal.
- Edad cronológica.
- Tiempo descontado por prematuridad.
- Fecha equivalente a 40 semanas, cuando corresponda.
- Resumen de fecha de nacimiento, gestación y fecha de evaluación utilizadas.
- Explicación desplegable «Cómo se calcula», con sustitución numérica de la fórmula.
- Acciones «Copiar resultado», «Imprimir» y «Nuevo cálculo».

Mostrar el mensaje breve: «Herramienta de apoyo para personal de salud. Interpreta el resultado según la evaluación clínica y el protocolo de tu establecimiento».

Incluir una sección discreta de referencias, alcance y versión del método. No afirmar cumplimiento MINSA, validación institucional o certificación sin evidencia. Si se incorpora posteriormente una norma peruana, registrar su versión y adaptar reglas mediante revisión clínica.

## 8. Usabilidad y satisfacción

- Formulario de una sola vista, sin asistente de pasos ni campos innecesarios.
- Escritorio: formulario a la izquierda y resultado a la derecha. Móvil: formulario y resultado en una columna.
- Estado inicial de resultados con explicación breve, sin cifras ficticias.
- Botón principal visible y de tamaño cómodo. Enter calcula; Tab recorre un orden natural.
- Después de calcular en móvil, llevar suavemente al encabezado del resultado y permitir su anuncio accesible; no mover el foco durante la escritura.
- «Nuevo cálculo» limpia nacimiento y gestación, restablece evaluación a hoy y enfoca nacimiento. No usar diálogos de confirmación.
- Copiar un resumen en texto con entradas, resultados, fecha de evaluación y versión del método. Ante fallo del portapapeles, ofrecer texto seleccionable.
- Impresión limpia en A4 con datos, método y referencias, sin botones ni fondos decorativos; permitir guardar PDF desde el navegador.
- Evitar modales para ayuda, menús complejos y mensajes que desaparezcan antes de poder leerlos.
- No incluir encuestas ni analítica en producción en esta versión.

Validación con usuarios, como actividad pendiente si no se dispone de participantes: pedir a 3–5 profesionales que calculen un caso, cambien la evaluación, copien el resultado y empiecen otro. Metas propuestas: al menos 90% de tareas completadas sin ayuda, mediana menor de 30 segundos para el cálculo tras leer el caso y facilidad percibida de al menos 4/5. Reportar resultados reales, no inventarlos. Estas metas no equivalen a validación clínica.

## 9. Diseño elegante

Dirección visual: herramienta clínica moderna, sobria y cálida. Fondo claro, superficies blancas, azul petróleo o verde azulado como acento y tipografía sans serif legible del sistema. Centralizar colores, espaciados, radios y sombras en variables CSS.

- Encabezado compacto con nombre y subtítulo «Apoyo al seguimiento del niño prematuro».
- Tipografía base de al menos 16 px, números tabulares y resultados grandes.
- Contenedor de aproximadamente 1100 px; espaciado consistente, tarjetas de bordes suaves y sombras discretas.
- Iconos SVG pequeños acompañados de texto; no usar emojis como iconografía principal.
- Evitar ilustraciones grandes, fotos decorativas, gráficos sin función y fondos que resten contraste.
- Usar tonos neutrales para estados informativos; no representar prematuridad como un error.
- No utilizar logotipos de MINSA o de la Red de Salud sin que se proporcionen y autoricen.
- Priorizar un tema claro pulido; modo oscuro fuera del alcance inicial.

### Animaciones

- Entrada inicial muy breve con opacidad y desplazamiento máximo de 8 px, sin demorar el uso.
- Transiciones de botones y foco de 120–180 ms.
- Aparición del resultado de 180–250 ms, con dimensiones estables para evitar saltos.
- Feedback discreto y accesible al copiar.
- Animar preferentemente opacity y transform.
- Respetar prefers-reduced-motion: eliminar desplazamientos y desplazamiento suave.
- No usar conteos animados, números que cambian progresivamente, confeti, parpadeos, animaciones en bucle ni loaders artificiales. Las cifras clínicas deben aparecer completas inmediatamente.

## 10. Accesibilidad y calidad

Objetivo WCAG 2.2 AA, verificando al menos:
- Contraste de texto normal de 4.5:1 y de componentes interactivos de 3:1.
- Controles táctiles preferentemente de 44 × 44 px o mayores.
- Navegación completa con teclado y foco visible, sin trampas.
- Labels, fieldset/legend para gestación, landmarks y jerarquía de encabezados.
- Resultado anunciado mediante una región de estado sin anuncios repetitivos.
- Errores identificados por texto, además del color.
- Zoom de 200% y ancho de 320 px sin desplazamiento horizontal.
- Respeto de reducción de movimiento.
- Texto principal y acciones legibles en impresión.

Probar en Chromium y, cuando estén disponibles, Firefox y WebKit. No declarar compatibilidad o accesibilidad comprobada si no se ejecutó la revisión.

## 11. Privacidad y rendimiento

- No enviar entradas a servidores, registros de analítica ni parámetros de URL.
- No persistir datos en localStorage, sessionStorage o cookies.
- No generar historiales de cálculos.
- Copia e impresión únicamente a petición del usuario.
- No usar terceros para tipografía, seguimiento o cálculo.
- Evitar dependencias de runtime innecesarias; meta de JS y CSS iniciales combinados menor de 100 KB comprimidos.
- No agregar service worker en esta versión; evitar problemas de actualización de reglas clínicas en caché.

## 12. Casos mínimos de prueba

| Caso | Entradas | Resultado esperado |
|---|---|---|
| Ejemplo básico | Nace 01/01/2026; EG 32+0; evaluación 26/03/2026 | Cronológica 84 días; corrección 56; corregida 28 días = 4 semanas. |
| Precisión en días | Mismas fechas; EG 32+4 | Corrección 52; corregida 32 días = 4 semanas y 4 días. |
| Antes de 40 semanas | Nace 01/01/2026; EG 32+0; evaluación 29/01/2026 | Faltan 28 días; edad posmenstrual 36+0; no mostrar cero ni edad negativa como principal. |
| Fecha equivalente | Nace 01/01/2026; EG 32+0; evaluación 26/02/2026 | Corregida cero. |
| Límite prematuro | Nace 01/01/2026; EG 36+6; evaluación 29/01/2026 | Corrección 22; corregida 6 días. |
| No prematuro | EG 37+0 y 39+0 | Sin corrección por prematuridad. |
| Bisiesto | Nace 28/02/2024; evaluación 01/03/2024 | Cronológica 2 días. |
| Mes calendario | Diferencia 31/01/2026 a 28/02/2026 | 1 mes calendario; 28 días exactos. |
| Dos años | Nace 01/01/2024; evaluación 01/01/2026; EG prematura | Aviso de intervalo habitual de uso. |
| Fecha inválida | 31/02/2026 o evaluación anterior al nacimiento | Bloquear con mensaje específico. |
| Gestación inválida | Días 7, semanas fraccionarias o valores fuera de rango | Bloquear sin normalizar silenciosamente. |
| Datos cambiados | Calcular y modificar un campo | Resultado invalidado; copia e impresión deshabilitadas. |

Agregar pruebas de cambio de año, 29 de febrero, días omitidos, misma fecha de nacimiento/evaluación y fechas futuras. Inyectar «hoy» en las pruebas para que sean deterministas y comprobar resultados equivalentes bajo distintas zonas horarias. Probar recorridos con teclado, nuevo cálculo, copia fallida, impresión y reducción de movimiento.

## 13. Publicación en GitHub Pages

Preparar un workflow que en pushes a main y ejecución manual:
1. Instale con npm ci.
2. Ejecute pruebas unitarias.
3. Genere dist mediante npm run build.
4. Suba dist como artefacto de Pages y despliegue usando las acciones oficiales vigentes de GitHub.

Configurar permisos mínimos de Pages, entorno github-pages y concurrencia. Usar base relativa de Vite (`./`) o una base explícita coherente con el repositorio para que los recursos funcionen bajo /nombre-repositorio/.

Documentar cómo crear el repositorio público, subir el proyecto, seleccionar GitHub Actions en Settings → Pages y obtener la URL real. Si no hay acceso a la cuenta, entregar todo preparado y explicar el único paso pendiente. No afirmar que se publicó sin verificar el enlace real. El nombre de repositorio sugerido es calculadora-edad-corregida.

## 14. Entregables y criterios de aceptación

Entregar:
- Código completo y organizado.
- Scripts npm para desarrollo, build, preview y pruebas.
- Lockfile y workflow de GitHub Pages.
- README final con instalación, reglas, convenciones de fechas, referencias, publicación y limitaciones.
- Resumen de pruebas realmente ejecutadas y pendientes.

Se considera lista cuando calcula correctamente todos los casos, impide resultados desactualizados, funciona a 320 px y en escritorio, permite trabajar con teclado, respeta reducción de movimiento, imprime claramente y funciona al servirse desde una subruta de GitHub Pages. No atribuir aprobación clínica a las pruebas técnicas.

## 15. Referencias del método

Referencias consultadas el 12/11/2026:
- OMS — Preterm birth: definición antes de 37 semanas completas. https://www.who.int/news-room/fact-sheets/detail/preterm-birth
- American Academy of Pediatrics / HealthyChildren — Corrected Age For Preemies: resta del tiempo faltante para 40 semanas y uso en seguimiento del desarrollo durante los primeros dos años. https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx
- Washington DCYF — Age Correction in Evaluation and Assessment of Prematurely Born Infants: referencia explícita para el límite operativo de 24 meses cronológicos. https://www.dcyf.wa.gov/sites/default/files/pdf/esit/AgeCorrect-PrematureGuide.pdf

La implementación debe mantener separados el cálculo matemático, sus convenciones de presentación y su interpretación clínica. Esta especificación no sustituye una norma local de atención.
