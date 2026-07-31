# Prompt maestro para rediseñar paneles de SofLIA

## Cómo utilizar este documento

Asigna a cada agente un panel distinto con una instrucción breve como esta:

> Necesito que rediseñes por completo el panel **[PANEL]**, siguiendo métricas de diseño basadas en profesionalismo, minimalismo y una calidad que se sienta premium. Usa como base `docs/PROMPT_REDISENO_PANELES.md`, `docs/prompt_maestro.md` y `docs/SOFIA_DESIGN_SYSTEM.md`.

Ejemplos:

> Necesito que rediseñes por completo el panel **Estructura**, siguiendo métricas de diseño basadas en profesionalismo, minimalismo y una calidad que se sienta premium. Usa como base `docs/PROMPT_REDISENO_PANELES.md`, `docs/prompt_maestro.md` y `docs/SOFIA_DESIGN_SYSTEM.md`.

> Necesito que rediseñes por completo el panel **Contenido**, siguiendo métricas de diseño basadas en profesionalismo, minimalismo y una calidad que se sienta premium. Usa como base `docs/PROMPT_REDISENO_PANELES.md`, `docs/prompt_maestro.md` y `docs/SOFIA_DESIGN_SYSTEM.md`.

> Necesito que rediseñes por completo el panel **Reportes y analítica**, siguiendo métricas de diseño basadas en profesionalismo, minimalismo y una calidad que se sienta premium. Usa como base `docs/PROMPT_REDISENO_PANELES.md`, `docs/prompt_maestro.md` y `docs/SOFIA_DESIGN_SYSTEM.md`.

El agente debe sustituir mentalmente `[PANEL]` por el panel que se le haya asignado y aplicar todas las instrucciones de este documento.

---

# Instrucciones para el agente

## 1. Misión

Rediseña por completo el panel **[PANEL]** de SofLIA.

El resultado debe integrarse al lenguaje visual vigente de la plataforma y transmitir:

- Profesionalismo.
- Minimalismo funcional.
- Calidad premium.
- Precisión visual.
- Claridad operativa.
- Tecnología con calidez editorial.
- Consistencia con los módulos de SofLIA ya modernizados.

No realices un simple cambio de colores, radios o tipografía. Reconsidera la experiencia completa:

- Arquitectura visual.
- Jerarquía.
- Composición.
- Densidad de información.
- Navegación.
- Toolbars.
- Listas, tablas y tarjetas.
- Formularios.
- Dropdowns y calendarios.
- Modales y paneles flotantes.
- Estados de carga, vacío, error y éxito.
- Interacciones.
- Responsive.
- Accesibilidad.
- Branding organizacional.
- Rendimiento.

Debes implementar y verificar el rediseño. No entregues solamente una propuesta, un análisis o un plan.

---

## 2. Fuentes de verdad obligatorias

Antes de modificar código, lee por completo:

1. `docs/SOFIA_DESIGN_SYSTEM.md`
2. `docs/prompt_maestro.md`
3. Este documento.

`docs/SOFIA_DESIGN_SYSTEM.md` tiene precedencia sobre estilos antiguos presentes en el código.

Si el panel actual contradice el sistema vigente, reemplaza el patrón anterior. No conserves componentes obsoletos solo porque ya existen.

También inspecciona, cuando sea útil, las áreas modernizadas de la aplicación:

- Página de inicio.
- Auth.
- Dashboard del usuario.
- Dashboard del administrador.
- Panel de usuarios.
- Estadísticas.
- Certificados.
- Libro y editor de apuntes.
- Experiencia de cursos.
- Paneles de SofLIA.
- Menú del usuario.
- Notificaciones.
- Modales administrativos.
- Pantallas unificadas de carga, error y estados vacíos.

Reutiliza el lenguaje visual y los componentes compartidos apropiados. No copies un componente si su función no corresponde al contexto del panel asignado.

---

## 3. Principios no negociables

### 3.1 Claridad antes que decoración

La tarea principal del panel debe comprenderse en menos de cinco segundos.

Elimina:

- Textos redundantes.
- Etiquetas decorativas sin utilidad.
- Tarjetas que no aportan jerarquía.
- Métricas duplicadas.
- Acciones repetidas.
- Encabezados excesivamente altos.
- Separaciones que desperdician espacio.
- Efectos que compiten con la información.

### 3.2 Minimalismo funcional

Minimalismo no significa dejar la interfaz vacía. Significa:

- Mostrar lo necesario.
- Agrupar lo relacionado.
- Priorizar una acción principal.
- Mantener acciones secundarias disponibles sin generar ruido.
- Utilizar el espacio para mejorar comprensión y operación.

### 3.3 Calidad premium

La calidad premium se logra mediante:

- Alineación precisa.
- Ritmo espacial consistente.
- Tipografía correcta.
- Contraste verificado.
- Estados completos.
- Transiciones sutiles.
- Controles coherentes.
- Iconografía uniforme.
- Responsive diseñado conscientemente.
- Ausencia de errores visuales.

No se logra acumulando gradientes, brillos, blur, sombras o animaciones.

### 3.4 Coherencia adaptable

La identidad de la organización puede cambiar mediante branding, pero:

- La jerarquía debe permanecer estable.
- Los controles deben continuar siendo legibles.
- Los estados semánticos deben conservar significado.
- La experiencia no debe perder calidad en modo claro u oscuro.

---

## 4. Protección funcional

El rediseño debe preservar:

- Rutas.
- Autenticación.
- Autorización.
- Roles y permisos.
- Consultas.
- Mutaciones.
- Datos reales.
- Paginación.
- Filtros.
- Búsqueda.
- Ordenamiento.
- Exportaciones.
- Importaciones.
- Acciones individuales y masivas.
- Validaciones.
- Navegación.
- Estados de servidor.
- Manejo de errores.
- Branding.
- Modo claro y oscuro.
- Funciones responsive existentes que sean útiles.

No utilices datos simulados para sustituir información real.

No elimines una función porque sea difícil integrarla visualmente.

No cambies contratos de API, estructuras de datos o reglas de negocio únicamente para simplificar el rediseño.

Si encuentras una función rota dentro del panel asignado, diagnostícala y corrígela sin expandir innecesariamente el alcance.

---

## 5. Tipografía

Aplica la jerarquía tipográfica oficial:

### Display y títulos editoriales

- Familia: `Newsreader`.
- Títulos principales: peso 300.
- Títulos secundarios: peso 400.
- Tracking controlado según el sistema.

### Interfaz

- Familia: `Inter Tight`.
- Navegación, botones, inputs, tabs, menús y controles.
- Pesos 400, 500, 600 o 700 según jerarquía.

### Etiquetas y datos

- Familia: `IBM Plex Sans`.
- Etiquetas técnicas.
- Fechas.
- Números.
- Metadatos.
- Encabezados de tabla.
- Estados compactos.

Reglas:

- No uses Newsreader en botones.
- No mezcles tipografías sin una función jerárquica.
- Los títulos dentro de tarjetas y tablas deben mantener proporción operativa.
- Los botones nunca deben cortar su texto.
- Las etiquetas compactas pueden usar mayúsculas y tracking, pero deben seguir siendo legibles.
- Los bloques largos deben mantener una longitud de línea cómoda.

---

## 6. Colores y branding

### 6.1 Paleta base de referencia

- Primary: `#0A2540`.
- Primary hover: `#0D2F4D`.
- Accent: `#00D4B3`.
- Accent hover: `#00B89A`.
- Success: `#10B981`.
- Warning: `#F59E0B`.
- Error: `#EF4444`.
- Info: `#3B82F6`.
- Dark canvas: `#0F1419`.
- Deep canvas: `#0A0D12`.
- Light canvas: `#F8FAFC`.
- White: `#FFFFFF`.

Estos valores son referencias. Prefiere siempre tokens semánticos y variables organizacionales.

### 6.2 Variables organizacionales

El panel debe consumir correctamente:

```css
--org-primary-color
--org-secondary-color
--org-accent-color
--org-action-color
--org-on-primary-color
--org-on-action-color
--org-background-color
--org-card-background
--org-text-color
--org-text-secondary
--org-border-color
```

Cuando sea necesario, define alias locales:

```css
--experience-action: var(--org-action-color, var(--color-primary));
--experience-accent: var(--org-accent-color, var(--color-accent));
--experience-on-action: var(--org-on-action-color, var(--color-bg-light));
--experience-surface: var(--org-card-background, var(--color-bg-light));
--experience-text: var(--org-text-color, var(--color-contrast));
--experience-muted: var(--org-text-secondary, var(--color-muted));
--experience-border: var(
  --org-border-color,
  color-mix(in srgb, var(--experience-text) 10%, transparent)
);
```

Reglas:

- `brandingEnabled` debe ser la única condición que habilite colores personalizados.
- Los colores guardados no pueden filtrarse si el branding está desactivado.
- No leas colores directamente desde objetos de organización si ya existen resolutores compartidos.
- Utiliza `resolveOrganizationBrandColors`, `chooseReadableTextColor` y `adjustColorForContrast` cuando corresponda.
- No asumas texto blanco sobre cualquier color.
- Conserva colores semánticos de éxito, error y advertencia.
- Conserva logotipos y personalización organizacional.

### 6.3 Contraste

Cumple WCAG AA:

- Texto normal: mínimo 4.5:1.
- Texto grande: mínimo 3:1.
- Controles importantes: mínimo 3:1.

Prueba todas las combinaciones:

1. Tema claro predeterminado.
2. Tema oscuro predeterminado.
3. Branding personalizado claro.
4. Branding personalizado oscuro.

---

## 7. Layout y composición

- Usa una cuadrícula basada en múltiplos de 4px.
- Mantén el ancho y geometría de las páginas hermanas ya rediseñadas.
- Usa densidad productiva en dashboards, tablas y catálogos.
- Usa densidad operativa en formularios, editores y filtros.
- Agrupa contenido relacionado en superficies claras.
- Evita convertir cada dato en una tarjeta independiente.
- Mantén alineación vertical y horizontal precisa.
- Los encabezados deben ser compactos y útiles.
- Las acciones deben colocarse cerca de su contexto.
- Las toolbars deben reorganizarse en pantallas pequeñas, no comprimirse.

Márgenes de referencia:

- Desktop: `1.25rem–2rem`.
- Tablet: aproximadamente `1rem`.
- Mobile: aproximadamente `0.75rem`.
- Ancho máximo de dashboard: cercano a `92rem`, según el contexto.

---

## 8. Superficies, radios, bordes y sombras

### 8.1 Radios

- Inputs: `0.85rem–1rem`.
- Botones principales: aproximadamente `0.9rem`.
- Tarjetas pequeñas: `1rem–1.15rem`.
- Tarjetas principales: `1.25rem–1.6rem`.
- Modales: `1.35rem–1.75rem`.
- Hero o encabezado destacado: `1.5rem–2.5rem`.
- Chips y badges: `999px`.

No uses píldoras para cualquier acción. Resérvalas para:

- Chips.
- Badges.
- Estados.
- Controles segmentados.
- Acciones muy breves.

### 8.2 Bordes

- Grosor base: 1px.
- Contraste ligero y semántico.
- Estados activos influenciados por el acento.
- No uses marcos negros gruesos.
- No uses esquinas cuadradas en modales, dropdowns o botones principales.

### 8.3 Sombras

Utiliza niveles progresivos:

1. Controles: elevación mínima.
2. Navbar y tarjetas: elevación media.
3. Paneles flotantes: elevación superior.
4. Modales: elevación máxima.

No uses sombras negras, duras o excesivas.

### 8.4 Blur

- Navbar flotante: `1.25rem–1.4rem`.
- Dropdown o panel contextual: `1rem–1.5rem`.
- Modal: `1.5rem–1.6rem`.
- Backdrop: `0.65rem–0.9rem`.

Condiciones:

- Utiliza blur solo si existe contenido detrás.
- No acumules más de dos capas.
- Mantén una superficie opaca de respaldo.
- No apliques blur costoso a listas extensas.
- No crees fondos verdes rectangulares o halos sin función.

---

## 9. Iconografía

Utiliza Lucide React o la familia lineal consolidada en el proyecto.

- Stroke: `1.5–2`.
- Metadatos: `12–14px`.
- Controles: `16–18px`.
- Controles destacados: `18–20px`.
- Empty states: `22–28px`.
- Encabezados o modales informativos: `28–32px`.

Reglas:

- No mezcles familias visuales.
- No uses emojis como iconos.
- No uses iconos 3D en controles operativos.
- No agregues iconos puramente decorativos.
- Conserva una caja de icono cercana a `2.2rem`, con radio aproximado de `0.72rem`.

---

## 10. Botones

Jerarquía:

1. Primario: acción dominante.
2. Secundario: alternativa relevante.
3. Ghost: navegación o baja prioridad.
4. Destructivo: acción irreversible.
5. Icon button: acción compacta y reconocible.

Reglas:

- Solo una acción primaria dominante por contexto.
- Usa el acento para crear, guardar, avanzar, activar o iniciar.
- Calcula siempre el color legible del texto.
- No uses texto blanco sobre un verde brillante sin verificar contraste.
- Las acciones destructivas deben ser rojas y estar aisladas.
- Nunca confirmes una eliminación con un botón verde.
- Área táctil mínima: `44 × 44px`.
- Hover sutil: cambio controlado de superficie, sombra y `translateY(-1px)`.
- No aumentes agresivamente el brillo.
- El texto nunca debe cortarse.

Implementa:

- Default.
- Hover.
- Active.
- Focus-visible.
- Disabled.
- Loading.
- Success o error cuando aplique.

---

## 11. Inputs, dropdowns y calendarios

### Inputs

- Label persistente.
- Altura consistente.
- Radio `0.85rem–1rem`.
- Helper text únicamente cuando sea necesario.
- Mensaje de error cerca del campo.
- Focus ring visible.
- El placeholder no sustituye al label.

### Dropdowns

No uses `select` nativo visible.

Usa:

- Trigger accesible.
- Popover personalizado.
- Radio `0.9rem–1rem`.
- Superficie coherente.
- Sombra y blur controlados.
- Opción activa claramente identificable.
- Navegación por teclado.
- Escape para cerrar.
- ARIA apropiada.

### Calendarios

- No muestres calendarios nativos cuadrados del navegador.
- Utiliza el componente premium compartido o crea uno siguiendo el sistema.
- Mes, días, navegación y selección deben mantener jerarquía.
- Estados hover, seleccionado, actual, fuera de rango y deshabilitado.
- Los selectores de hora deben integrarse visualmente al calendario.
- En móvil, usa popover adaptado o bottom sheet.

---

## 12. Tarjetas, listas y tablas

- Las tarjetas hermanas deben tener igual altura.
- Utiliza `align-items: stretch` y `height: 100%` cuando corresponda.
- Los títulos largos deben envolver o truncarse con una estrategia consistente.
- No dejes espacios blancos accidentales al lado de imágenes.
- Mantén proporciones de portadas y previews.
- No recortes información visual importante.
- Las acciones deben ser previsibles y estar alineadas.

Para tablas:

- Encabezados legibles.
- Filas con densidad productiva.
- Hover discreto.
- Estados y acciones claramente separados.
- En móvil, transforma la tabla en una vista legible; no fuerces una tabla de escritorio.

Para listas extensas:

- Pagina o virtualiza si la infraestructura existe.
- Evita blur y sombras pesadas por elemento.
- Mantén skeletons con dimensiones estables.

---

## 13. Modales y paneles flotantes

Todos los modales del panel deben seguir el patrón unificado.

### Backdrop

```css
background:
  radial-gradient(
    circle at 50% 20%,
    color-mix(in srgb, var(--experience-accent) 10%, transparent),
    transparent 42%
  ),
  rgb(3 12 22 / 0.58);

backdrop-filter: blur(0.9rem) saturate(115%);
```

### Superficie

- Radio `1.35rem–1.75rem`.
- Borde sutil influenciado por el acento.
- Sombra de nivel modal.
- Blur aproximado de `1.5rem`.
- Header, body y footer claramente diferenciados.
- Scroll interno.
- Footer sticky solo cuando el contenido sea largo.
- Nunca debe crecer fuera del viewport.

Anchuras:

- Modal estándar: `28–36rem`.
- Configuración o editor: hasta `54rem`.
- Documento o analítica: hasta `66rem` o el límite seguro del viewport.

Accesibilidad:

- `role="dialog"`.
- `aria-modal="true"`.
- Focus trap.
- Escape cierra.
- El foco regresa al disparador.
- El fondo queda inerte.
- En móvil, los formularios complejos se convierten en pantalla completa o bottom sheet.

Las confirmaciones destructivas deben:

- Explicar la consecuencia.
- Identificar el objetivo.
- Aislar el botón destructivo.
- Evitar colores de éxito en la confirmación.

---

## 14. Estados de experiencia

Diseña explícitamente:

- Carga inicial.
- Carga contenida.
- Skeleton.
- Estado vacío.
- Sin resultados.
- Error recuperable.
- Error crítico.
- Sin permisos.
- Éxito.
- Disabled.
- Confirmación.
- Contenido largo.
- Datos incompletos.

Reutiliza `PremiumLoadingScreen` o el patrón unificado equivalente.

No inventes una nueva pantalla de carga si ya existe un componente compartido.

No muestres únicamente un spinner sobre un fondo vacío cuando puedas conservar el contexto mediante skeletons.

---

## 15. Navegación

- Conserva el navbar organizacional vigente.
- Conserva identidad y logo de la organización.
- Evita headers sólidos que oculten el contenido durante el scroll.
- Si el navbar es flotante o sticky, el contenido debe desplazarse de forma natural por debajo.
- No permitas que el header tape títulos, botones o paneles.
- Los menús del usuario y notificaciones deben utilizar backdrop con blur suficiente.
- Mantén z-index documentado y evita competir con modales o dropdowns.
- La navegación lateral debe respetar el patrón del panel administrativo ya rediseñado.

---

## 16. Animaciones

- Duración habitual: `140–300ms`.
- Prioriza `transform` y `opacity`.
- Usa entrada sutil, no teatral.
- Hover con profundidad ligera.
- Expansiones y acordeones sin saltos.
- Respeta `prefers-reduced-motion`.
- Evita animaciones decorativas continuas en paneles densos.
- No instales otra librería si las dependencias actuales son suficientes.

---

## 17. Responsive

Implementa mobile-first.

Breakpoints de referencia:

- Mobile S: menos de `400px`.
- Mobile: menos de `640px`.
- Tablet: `640–1023px`.
- Desktop: `1024–1439px`.
- Wide: `1440px` o más.

Comprueba:

- 320px.
- 375px.
- 390px.
- 768px.
- 1024px.
- 1440px.
- 1920px.

Reglas:

- Sin scroll horizontal accidental.
- Sin texto cortado.
- Sin botones truncados.
- Sin controles fuera del viewport.
- Las toolbars se reorganizan.
- Las tablas cambian de presentación.
- Los filtros secundarios pueden pasar a drawer o bottom sheet.
- Los modales complejos usan pantalla completa en móvil.
- Respeta `env(safe-area-inset-*)`.
- Usa `svh` o `dvh` cuando corresponda.
- No ocultes funciones esenciales.

---

## 18. Accesibilidad

- Contraste WCAG AA.
- Navegación completa por teclado.
- Focus-visible claro.
- Labels asociados.
- ARIA en icon buttons, dropdowns, tabs y modales.
- No comuniques un estado solo mediante color.
- Targets táctiles mínimos de 44px.
- Respeta reducción de movimiento.
- Mantén orden de tabulación lógico.
- Anuncia estados de carga o guardado cuando sea necesario.
- Tooltips no deben contener acciones esenciales inaccesibles.

---

## 19. Rendimiento

- Evita layout shifts.
- Reserva dimensiones para imágenes y skeletons.
- Optimiza imágenes y previews.
- Carga de forma diferida contenido secundario.
- No dupliques solicitudes por efectos visuales.
- Evita cascadas de consultas.
- Conserva caché y paginación.
- Usa `transform` y `opacity` en animaciones.
- No apliques blur a grandes cantidades de nodos.
- Virtualiza listas extensas si existe infraestructura.
- No agregues dependencias sin una necesidad real.

---

## 20. Implementación técnica

- Utiliza CSS Modules o el patrón de estilos vigente.
- Nombra clases por función, no por apariencia.
- Mantén media queries junto al componente.
- Evita `!important`.
- No uses colores inline.
- Declara alias semánticos en el nivel del módulo.
- Reutiliza componentes compartidos cuando exista lógica accesible, branding o estados complejos.
- Extrae un componente compartido si será consumido por tres o más vistas.
- No realices refactors masivos ajenos al panel.

Cada control interactivo debe contemplar:

- Default.
- Hover.
- Active.
- Focus.
- Disabled.
- Loading.
- Error.
- Modo oscuro.
- Branding personalizado.
- Mobile.

---

## 21. Trabajo paralelo y protección del repositorio

Otros agentes pueden modificar el mismo repositorio.

Antes de editar:

1. Ejecuta `git status`.
2. Localiza archivos con `rg` y `rg --files`.
3. Identifica cambios ajenos.
4. Define el límite exacto del panel.

Durante el trabajo:

- Conserva todos los cambios existentes.
- No reviertas archivos de otros agentes.
- No reformatees módulos ajenos.
- No edites otros paneles.
- No modifiques tokens globales, providers, navbar compartido, sidebar compartida o tipografía global sin autorización.
- Si necesitas un cambio compartido, documenta la solicitud para el agente integrador.
- Evita renombrados masivos.
- No instales dependencias sin justificación.
- No hagas commit, push o PR salvo instrucción explícita.

---

## 22. Proceso obligatorio

### Fase 1: auditoría

- Localiza todas las rutas del panel.
- Identifica componentes, estilos, hooks, queries y modales.
- Enumera funciones y estados.
- Identifica componentes compartidos.
- Revisa problemas actuales de jerarquía, contraste, responsive y rendimiento.
- Determina qué debe conservarse y qué debe reemplazarse.

### Fase 2: planificación breve

Registra:

- Archivos que modificarás.
- Componentes que reutilizarás.
- Componentes que crearás.
- Funcionalidad que debes preservar.
- Riesgos de colisión.

Después implementa sin detenerte en el plan.

### Fase 3: implementación

- Rediseña el panel completo.
- No dejes secciones con la apariencia anterior.
- Conserva funcionalidad.
- Añade estados faltantes.
- Integra branding.
- Corrige contraste.
- Corrige responsive.
- Corrige accesibilidad.
- Evita deuda técnica nueva.

### Fase 4: verificación

Ejecuta según corresponda:

- Typecheck.
- Lint.
- Pruebas específicas.
- Build.
- Pruebas de las rutas afectadas.

Realiza QA visual en:

- Claro.
- Oscuro.
- Branding predeterminado.
- Branding personalizado.
- Desktop.
- Tablet.
- Mobile.
- Datos largos.
- Datos vacíos.
- Loading.
- Error.
- Dropdown abierto.
- Calendario abierto.
- Modal abierto.
- Menú flotante abierto.
- Navegación por teclado.
- Reducción de movimiento.

---

## 23. Definición de terminado

El panel está terminado únicamente cuando:

- La tarea principal se entiende en menos de cinco segundos.
- No quedan secciones con el diseño anterior.
- No existen esquinas cuadradas injustificadas.
- No hay selects o calendarios nativos visibles.
- No hay botones o textos cortados.
- No hay contrastes deficientes.
- No hay halos verdes rectangulares.
- No hay marcos negros gruesos.
- No hay scroll horizontal accidental.
- Las tarjetas hermanas tienen geometría consistente.
- No hay textos, etiquetas o tarjetas redundantes.
- Las funciones previas continúan disponibles.
- Los estados de carga, vacío y error están diseñados.
- Los modales, dropdowns y menús funcionan con teclado.
- El responsive fue diseñado, no solamente comprimido.
- El branding organizacional conserva legibilidad.
- Se ejecutaron verificaciones técnicas.
- Los cambios están limitados al panel asignado.

---

## 24. Entrega final

Al terminar, informa:

1. Resultado implementado.
2. Archivos modificados.
3. Componentes creados.
4. Componentes reutilizados.
5. Funcionalidad preservada.
6. Estados diseñados.
7. Verificaciones ejecutadas y resultados.
8. Breakpoints comprobados.
9. Temas y branding comprobados.
10. Riesgos o pendientes reales.
11. Cambios compartidos que debe resolver el agente integrador.

No respondas únicamente “terminado”, “listo” o “rediseñado”.

