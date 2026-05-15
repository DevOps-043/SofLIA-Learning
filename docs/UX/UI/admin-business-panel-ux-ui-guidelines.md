# Guia UX/UI canonica para paneles administrativos SofLIA

Ultima actualizacion: 2026-05-15

## Objetivo

Este documento define el lenguaje visual que deben seguir el panel Business y el panel de superadministrador. La referencia canonica es el panel Business actual, especialmente la vista de usuarios, sus tarjetas, filtros, modales, calendario y shell de navegacion. El panel de superadministrador debe migrar hacia estos patrones para que todo el sistema se sienta como una sola plataforma.

La paleta base viene de `docs/SOFIA_DESIGN_SYSTEM.md`; la implementacion moderna debe tomar los tokens centralizados de `useBusinessPanelTheme()` o una primitiva equivalente para admin, evitando colores locales dispersos.

## Fuentes canonicas

Usar estos archivos como referencia antes de crear variantes nuevas:

| Patron | Referencia |
| --- | --- |
| Tokens de tema | `apps/web/src/features/business-panel/hooks/useBusinessPanelTheme.ts` |
| Layout, header y sidebar | `apps/web/src/features/business-panel/components/BusinessPanelLayout.tsx`, `BusinessPanelHeader.tsx`, `BusinessPanelSidebar.tsx` |
| Hero y acciones de pagina | `apps/web/src/app/[orgSlug]/business-panel/users/components/UsersPageHeader.tsx` |
| KPIs | `apps/web/src/features/business-panel/components/shared/BusinessPanelStatCard.tsx` |
| Busqueda | `apps/web/src/features/business-panel/components/shared/BusinessPanelSearchInput.tsx` |
| Tabs, filtros y vista grid/lista | `apps/web/src/app/[orgSlug]/business-panel/users/components/UsersFilterBar.tsx` |
| Tarjeta de usuario | `apps/web/src/app/[orgSlug]/business-panel/users/components/UserCard.tsx` |
| Fila/lista de usuario | `apps/web/src/app/[orgSlug]/business-panel/users/components/UserListRow.tsx` |
| Select premium | `apps/web/src/features/business-panel/components/PremiumSelect.tsx` |
| Date picker/calendario | `apps/web/src/features/business-panel/components/PremiumDatePicker.tsx` |
| Modal grande de analitica | `apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx` |
| Modal de formulario | `apps/web/src/features/business-panel/components/BusinessAddUserModal.tsx`, `business-edit-user-modal/BusinessEditUserModal.tsx` |
| Modal split panel | `apps/web/src/features/business-panel/components/BusinessImportUsersModal.tsx` |
| Modal destructivo | `apps/web/src/features/business-panel/components/BusinessDeleteUserModal.tsx` |

## Principios visuales

1. El sistema debe sentirse B2B, limpio y tecnologico: superficies claras, jerarquia fuerte, poco ruido decorativo.
2. Los datos viven primero: KPIs arriba, filtros visibles, contenido accionable debajo.
3. El color primario no debe saturar toda la pantalla; se reserva para CTAs, activos, tabs seleccionados y focos.
4. Las superficies usan borde sutil, blur o sombra suave. No usar bloques planos heredados sin elevacion.
5. Todo componente nuevo debe soportar modo claro y oscuro desde tokens, no desde `isDark ? '#hex' : '#hex'` dentro del JSX.
6. El responsive debe ser mobile-first: filtros apilados, modales a pantalla completa y navegacion lateral como drawer bajo `lg`.

## Tokens de color

### Paleta base SofLIA

| Rol | Token de diseno | Hex | Uso |
| --- | --- | --- | --- |
| Primary / Azul profundo | `--color-primary` | `#0A2540` | Acciones primarias en modo claro, navegacion activa, texto de alta jerarquia |
| Accent / Aqua | `--color-accent` | `#00D4B3` | Modo oscuro, progreso, estados activos, IA, acentos de crecimiento |
| Fondo oscuro | `--color-bg-dark` | `#0F1419` | Fondo principal dark |
| Superficie oscura | `--color-gray-800` | `#1E2329` | Tarjetas, modales y bloques elevados dark |
| Texto secundario | `--color-gray-500` | `#6C757D` | Metadata, labels, iconos atenuados |
| Borde claro | `--color-gray-200` | `#E9ECEF` | Separadores y bordes light |
| Exito | `--color-success` | `#10B981` | Completado, activo, progreso positivo |
| Advertencia | `--color-warning` | `#F59E0B` | Invitado, pendiente, alerta no critica |
| Error | `--color-error` | `#EF4444` | Destructivo, suspendido, error critico |

### Tokens de UI por modo

| Token UI | Modo claro | Modo oscuro | Uso |
| --- | --- | --- | --- |
| `panelBg` | `#FFFFFF` | `#0b0e14` o `#0F1419` | Shell general, header, sidebar, modal root |
| `cardBg` | `#FFFFFF` | `rgba(30,35,41,0.6)` | Tarjetas, dropdowns secundarios, metric cards |
| `inputBg` | `#F8FAFC` | `rgba(255,255,255,0.03)` | Inputs, search bars, botones secundarios |
| `hoverBg` | `rgba(15,23,42,0.05)` | `rgba(255,255,255,0.08)` | Hover neutro, chips y filas |
| `borderColor` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | Bordes sutiles |
| `dividerColor` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.10)` | Separadores visibles |
| `textColor` | `#0F172A` | `#FFFFFF` | Texto principal |
| `subtextColor` | `#475569` | `#858E9B` | Subtitulos y descripcion |
| `mutedTextColor` | `rgba(15,23,42,0.5)` | `rgba(255,255,255,0.4)` | Labels, placeholders, metadata |
| `primaryColor` | Org primary o `#0A2540` | `#00D4B3` | CTA, activo, foco |
| `onPrimaryColor` | `#FFFFFF` | `#04130F` | Texto sobre `primaryColor` |

Regla: en Business usar `useBusinessPanelTheme()`. En superadmin crear o reutilizar un hook equivalente que exponga los mismos nombres: `cardBg`, `inputBg`, `panelBg`, `hoverBg`, `overlayBg`, `borderColor`, `dividerColor`, `textColor`, `subtextColor`, `mutedTextColor`, `primaryColor`, `accentColor`, `secondaryColor`, `onPrimaryColor`, `successColor`, `warningColor`, `dangerColor`.

## Layout administrativo

El shell administrativo debe seguir este esquema:

- Contenedor principal: `fixed inset-0 flex h-screen flex-col overflow-hidden`.
- Header: sticky arriba, altura `64px`, `backdrop-blur-xl`, borde inferior sutil.
- Sidebar desktop: dentro del flex row principal, ancho `280px`; colapsado `80px`.
- Sidebar mobile: drawer fijo con overlay `theme.overlayBg`, aparece bajo `lg`.
- Contenido: scroll solo en `main`, no en `body`.
- Padding del contenido: `p-4 sm:p-6 lg:p-8 xl:p-12`.
- Max width interno: `max-w-[1920px]`.
- Separacion vertical entre secciones: `space-y-6 sm:space-y-8`.

El contenido administrativo no debe tocar los bordes del viewport salvo en estados fullscreen intencionales como modales mobile.

## Hero de pagina

Usar un hero compacto para pantallas principales de administracion:

- Contenedor `rounded-3xl`, padding `p-8`, borde `1px`.
- Fondo `heroBackground` del tema, no gradientes locales.
- Texto en `inverseTextColor` e `inverseSubtextColor`.
- Eyebrow con icono Lucide y color `accentColor`.
- Acciones a la derecha en desktop y debajo en mobile.
- Botones secundarios sobre `inverseSurface` con `inverseBorderColor`.
- CTA principal con `primaryColor`, `onPrimaryColor` y sombra `0 8px 30px ${primaryColor}40`.

No usar heroes de marketing en paneles operativos. El hero debe resumir la vista y exponer acciones concretas.

## Botones

### Primario

Uso: accion principal de pagina, footer modal, crear, guardar, finalizar.

- Fondo: `primaryColor`.
- Texto/icono: `onPrimaryColor`.
- Radio: `12px` (`rounded-xl`) en botones normales; `16px` en botones de modal grandes.
- Padding: `px-6 py-2.5` en pagina, `px-8 py-3` en modal.
- Peso: `font-bold` o `font-black` para CTAs administrativos.
- Hover: escala ligera `1.01` a `1.02`, sombra suave.
- Disabled: `opacity-40`, `cursor-not-allowed`, sin scale.

### Secundario / neutral

Uso: cancelar, descargar plantilla, filtros no activos, acciones auxiliares.

- Fondo: `inputBg` o `inverseSurface` si vive sobre hero oscuro.
- Borde: `borderColor` o `inverseBorderColor`.
- Texto: `mutedTextColor`, `textColor` en hover.
- Radio: `12px`.
- Hover: `hoverBg`; no competir con primario.

### Icon button

Uso: cerrar, grid/list, navegacion calendario, sidebar.

- Tamano: `40px` o padding `p-2.5`/`p-3`.
- Radio: `12px` a `16px`.
- Fondo: `inputBg` cuando esta en header/modal; transparente en barras compactas.
- Estado activo: `${primaryColor}30` y color `primaryColor`.
- Tooltip o `title` cuando el icono no tenga texto visible.

### Destructivo

Uso: eliminar, suspender, revocar.

- Color semantico: `dangerColor` (`#EF4444`).
- Fondo: `${dangerColor}10` a `${dangerColor}12`.
- Borde: `${dangerColor}20` a `${dangerColor}30`.
- Texto: `dangerColor`.
- Confirmaciones destructivas deben abrir modal o estado de confirmacion; no usar `confirm()` nativo.

## Tarjetas

### KPI / Stat card

Patron canonico: `BusinessPanelStatCard`.

- Contenedor: `rounded-[16px]`, `min-h-[90px]`, `p-4`, borde `borderColor`.
- Fondo: `cardBg`, `backdropFilter: blur(20px)`.
- Sombra light: `0 4px 20px -10px rgba(0,0,0,0.05)`.
- Sombra dark: `0 10px 30px -10px rgba(0,0,0,0.4)`.
- Icono: capsula `48px`, radio `14px`, fondo `linear-gradient(135deg, ${iconColor}15, transparent)`, borde `${iconColor}25`.
- Label: `text-[10px] uppercase tracking-widest font-bold`, color `subtextColor`.
- Valor: `text-2xl font-extrabold leading-none`.
- Decoracion permitida: glow radial sutil en esquina y linea inferior de acento en hover.

No recrear KPIs con `bg-white dark:bg-*`; usar la primitiva o copiar exactamente sus tokens.

### Tarjeta de entidad

Uso: usuarios, invitaciones, enlaces, solicitudes, cursos o elementos gestionables.

- Contenedor: `rounded-3xl`, borde sutil, sombra suave, `overflow-hidden`.
- Hover: elevar `y: -6` o sombra ligera; no cambiar layout.
- Header visual: bloque superior de `h-32` con avatar centrado y glow sutil del acento.
- Avatar: `80px`, `rounded-2xl`, borde `2px`, fallback con inicial.
- Nombre: `text-lg font-bold`, truncado.
- Email/metadata: `text-[11px]`, opacidad `0.5`.
- Metadatos internos: filas `rounded-xl`, padding `px-3 py-2`, fondo `black/5` light o `white/5` dark.
- Acciones: secundarios en grid y CTA principal de ancho completo al final.

### Filas/listas

Uso: modo lista cuando hay densidad alta.

- Contenedor: `p-4 rounded-xl`, `cardBg`, borde sutil.
- Grid interno responsive: `grid-cols-1 sm:grid-cols-3 lg:grid-cols-5`.
- Acciones rápidas: ocultas hasta hover en desktop; visibles o accesibles en mobile.
- Badges de rol/estado: `px-2 py-0.5 rounded-full text-xs font-medium`.
- Evitar tablas rigidas en mobile; convertir a filas apiladas.

## Busqueda, tabs y filtros

### Tabs segmentados

- Contenedor: `p-1 rounded-xl`, `cardBg`, borde `borderColor`, overflow-x en mobile.
- Boton activo: fondo `primaryColor`, texto `onPrimaryColor`, `shadow-lg`.
- Boton inactivo: texto muted, hover a texto secundario.
- Badge de conteo: `rounded-full text-[10px]`, activo `bg-white/20`, inactivo `bg-black/5` o `bg-white/10`.

### Search bar

Patron canonico: `BusinessPanelSearchInput`.

- Wrapper relative.
- Input: `w-full pl-12 pr-12 py-3.5 rounded-2xl border`.
- Fondo: `cardBg`.
- Borde: `borderColor`.
- Texto: `textColor`.
- Placeholder/iconos: `mutedTextColor`.
- Icono search: izquierda `left-4`, `20px`.
- Boton limpiar: derecha `right-4`, icono `X`, solo si hay valor.

### Filtros principales

- Layout: `flex flex-col sm:flex-row gap-3 sm:gap-4`.
- Search ocupa `flex-1`.
- Selects: ancho minimo `140px` a `160px`.
- Boton de filtros avanzados: `px-4 py-3.5 rounded-xl border-2`, icono `Filter`, contador si hay filtros activos.
- Toggle grid/list: grupo con borde, dos icon buttons, separador `dividerColor`.

### Filtros avanzados

- Aparecen en bloque `p-4 rounded-xl border`, fondo `cardBg`.
- Usar `AnimatePresence` con entrada `opacity` y `height`.
- Dropdowns compactos: `px-3 py-2.5 rounded-lg border`, icono contextual, max height `12rem`.
- Boton limpiar filtros: texto `dangerColor`, hover `${dangerColor}10`.

## Dropdowns y selects

Patron preferido: `PremiumSelect`.

- Trigger: `px-4 py-3.5 rounded-xl border-2`, fondo `inputBg`.
- Borde activo: `primaryColor`; inactivo: `borderColor`.
- Texto seleccionado: `textColor`; placeholder: `mutedTextColor`.
- Chevron: Lucide `ChevronDown`, rota `180deg` al abrir.
- Menu: `absolute top-full mt-2 rounded-xl border backdrop-blur-xl`, fondo `panelBg`, z-index alto.
- Opciones: `px-4 py-3`, `text-sm`, hover `hoverBg`.
- Seleccion: fondo `${primaryColor}20`, check icon en `primaryColor`.
- Cierre: al seleccionar, al click fuera y con `Escape`.

No usar `<select>` nativo para filtros visibles. Solo se permite temporalmente en formularios heredados; en redisenos se debe migrar a `PremiumSelect` o variante accesible equivalente.

## Formularios e inputs

- Inputs normales: `px-5 py-4 rounded-2xl border text-sm font-medium`.
- Fondo: `inputBg`.
- Borde: `borderColor`, foco `primaryColor`.
- Texto: `textColor`.
- Labels de seccion: `text-[10px] font-black uppercase tracking-widest`, color `mutedTextColor`.
- Inputs con icono: icono absolute `left-4`, input `pl-12`.
- Grids: `grid-cols-1 lg:grid-cols-2` para secciones mayores, `sm:grid-cols-2` para pares de campos.
- Errores: bloque `p-4 rounded-xl border flex gap-3`, fondo `${dangerColor}10`, borde `${dangerColor}20`, texto `dangerColor`.
- Role cards o opciones visuales: `p-5 rounded-[1.8rem] border`; activo con `primaryColor`, inactivo con `inputBg`, opacidad reducida y hover a `opacity-100`.

## Modales

### Modal grande de administracion

Uso: crear/editar usuario, analitica de usuario, formularios densos.

- Overlay: `fixed inset-0`, z-index `99999`.
- En desktop: panel centrado `max-w-5xl`, `sm:h-[85vh]`, `sm:max-h-[750px]`.
- En mobile: `h-[100dvh] w-full`, sin margenes, footer sticky.
- Radio desktop: `sm:rounded-[2.5rem]`.
- Fondo: `panelBg`.
- Borde: `borderColor`.
- Animacion: `opacity 0->1`, `scale 0.95->1`, `y 20->0`, spring suave.
- Header: avatar/icono destacado, titulo, subtitulo/badge, tabs si aplica, boton cerrar.
- Body: scroll interno con `overflow-y-auto`, padding `px-6 lg:px-12`.
- Footer: borde superior, accion secundaria a la izquierda del grupo y primaria a la derecha.

En modales de gestion lanzados sobre una pantalla densa se permite backdrop transparente si el modal ya tiene sombra fuerte y la pantalla de fondo queda legible. Para acciones de riesgo o modales sin contexto visual, usar `overlayBg` con blur.

### Split panel modal

Uso: importaciones, procesos guiados, wizards con preview.

- Contenedor: `max-w-4xl`, `max-h-[90vh]`, `rounded-2xl`, `shadow-2xl`.
- Layout desktop: `lg:flex-row`.
- Layout mobile: `flex-col`, preview arriba.
- Panel izquierdo: `lg:w-80`, padding `p-4 lg:p-8`, borde derecho en desktop, fondo `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`.
- Panel derecho: `flex-1`, header, contenido con scroll, footer.
- Icono principal: `96px`, `rounded-2xl`, fondo o borde con `primaryColor`/`accentColor`.
- Estadisticas o preview en tarjetas pequeñas con `cardBg`.

### Modal destructivo

Uso: eliminar usuario, revocar acceso, borrar contenido.

- Ancho: `max-w-md`.
- Backdrop: `theme.overlayBg` o `bg-black/60 backdrop-blur-xl`.
- Borde del modal: tono de error sutil.
- Header: icono `AlertTriangle` en superficie roja clara.
- Mensaje: explicar objeto afectado y consecuencia.
- Detalles: bloque separado con metadata.
- Footer: cancelar secundario y confirmar destructivo con icono.
- Nunca ocultar la consecuencia en texto pequeno.

## Calendarios y date picker

Patron canonico: `PremiumDatePicker`.

- Trigger: `rounded-xl border px-4 py-3`, fondo `inputBg`.
- Icono calendario: `primaryColor`.
- Abierto: borde `primaryColor`, ring `0 0 0 3px ${primaryColor}20`.
- Popup: `min-w-[320px] rounded-2xl border p-4 shadow-2xl`, fondo `panelBg`, borde `borderColor`.
- Header calendario: flechas en icon buttons `40px`, mes `text-lg font-bold`, ano en `subtextColor`.
- Grid: 7 columnas, dias `40px`, `rounded-xl`.
- Hoy: fondo `${primaryColor}20`, texto `primaryColor`, punto inferior.
- Seleccionado: fondo `primaryColor`, texto `onPrimaryColor`, sombra `${primaryColor}40`.
- Deshabilitado u otro mes: opacidad `0.3`.
- Footer: `Limpiar` neutral y `Hoy` con fondo `${accentColor}20`.

Para calendarios tipo heatmap o actividad, usar `hoverBg` para dias vacios y una escala derivada de `primaryColor`, `accentColor`, `successColor` y `warningColor`; siempre mostrar tooltip/title con fecha y valor.

## Estados, badges y feedback

- Activo/completado: `successColor`.
- Invitado/pendiente: `warningColor`.
- Suspendido/error/destructivo: `dangerColor`.
- Removido/deshabilitado: gris semantico.
- Badges: capsulas pequenas `rounded-full`, `text-xs` o `text-[10px]`, alto compacto.
- Loading: spinner con borde base `${primaryColor}20` y borde superior `primaryColor`.
- Empty state: contenedor centrado `rounded-3xl border p-12` a `p-20`, icono grande en `mutedTextColor`, titulo claro y descripcion breve.
- Toasts o banners: usar fondos semanticos al 10-12% y bordes al 20-26%.

## Responsive

### Mobile menor a `640px`

- Contenido con `p-4`.
- Hero: acciones debajo, botones wrap.
- Filtros: columna; search primero, selects debajo.
- Tabs: overflow horizontal con botones `shrink-0`.
- Cards: una columna.
- Listas: filas apiladas, esconder columnas no esenciales.
- Modales grandes: `100dvh`, sin radio superior/inferior si ocupan toda la pantalla, footer sticky.

### Tablet `640px` a `1024px`

- Stat cards: 2 a 3 columnas.
- Cards de usuarios: 2 columnas.
- Formularios: pares de campos con `sm:grid-cols-2`.
- Header mantiene acciones compactas.

### Desktop `1024px+`

- Sidebar visible.
- Stat cards: hasta 5 columnas en vistas de usuarios.
- Cards de usuarios: 3 a 4 columnas.
- Filtros en fila.
- Modales centrados con alto `85vh`.
- Split panels pasan a dos columnas.

### Reglas anti-overlap

- Todo texto largo debe usar `truncate`, `min-w-0` y contenedores con ancho definido.
- Los botones no deben cambiar el alto al hacer hover.
- Los grids deben tener breakpoints explicitos.
- Los footers de modal deben ser sticky o absolutos y reservar padding inferior en el contenido.

## Motion e interaccion

- Usar Framer Motion para entradas, modales, dropdowns y hover sutil.
- Duracion dropdown: `0.15s`.
- Modal: spring `damping: 25-30`, `stiffness: 300`.
- Cards: entrada por indice maxima `index * 0.05`.
- Hover: `scale` maximo `1.02`; cards pueden usar `y: -2` a `y: -6`.
- Respetar `useMotionSafe()` cuando exista para reducir animaciones pesadas en dispositivos sensibles.

## Accesibilidad

- Todo icon button debe tener `aria-label` o `title`.
- Dropdowns deben cerrar con click fuera y `Escape`.
- No depender solo del color para estados: combinar icono, texto y badge.
- Contraste minimo: 4.5:1 para texto normal.
- Inputs deben tener label visible o `aria-label` si el label visual no existe.
- Modales deben detener propagacion del click interno y cerrar desde overlay/boton.

## Contrato visual de implementacion

Esta seccion es la referencia operativa. Si una vista nueva o migrada del superadmin se ve diferente a esto, se considera desviacion visual.

### Unidad base y escala de spacing

Todo spacing debe seguir la escala Tailwind de 4px, con excepciones ya presentes en el Business Panel.

| Token Tailwind | px | Uso exacto |
| --- | ---: | --- |
| `gap-1` | 4 | Separacion minima entre icono de badge y texto corto |
| `gap-1.5` | 6 | Iconos muy pequenos con metadata |
| `gap-2` | 8 | Icono + label en botones compactos, badges, tabs |
| `gap-3` | 12 | Botones de toolbar, filtros, filas compactas |
| `gap-4` | 16 | Layout interno de tarjetas, grupos de filtros, KPI icon + texto |
| `gap-5` | 20 | Grids de cards antiguos; preferir `gap-4` en nuevas vistas densas |
| `gap-6` | 24 | Separacion entre bloques de header/hero/modal |
| `gap-8` | 32 | Separacion entre columnas de formulario desktop |
| `p-1` | 4 | Shell de tabs segmentados |
| `p-2` | 8 | Icon buttons pequenos |
| `p-2.5` | 10 | Tabs icon-only y botones compactos de header modal |
| `p-3` | 12 | Icon button grande, close button |
| `p-3.5` | 14 | Altura canonica de filtro/select/toggle view |
| `p-4` | 16 | Card compacta, filtro avanzado, mobile page padding |
| `p-5` | 20 | Footer de modal, role cards, panels compactos |
| `p-6` | 24 | Header de modal desktop, content sections |
| `p-8` | 32 | Hero desktop, split panel desktop |
| `px-4 py-2.5` | 16 x 10 | Boton secundario normal |
| `px-6 py-2.5` | 24 x 10 | Boton primario de pagina |
| `px-5 py-4` | 20 x 16 | Input/form field grande |
| `px-8 py-3` | 32 x 12 | CTA primario en modal |
| `px-10 py-4` | 40 x 16 | CTA grande en modal de analitica |

Reglas:

- No usar `p-7`, `gap-7`, `rounded-[17px]` o medidas no alineadas salvo que el componente canonico ya las use.
- Las secciones principales deben usar `space-y-6 sm:space-y-8`.
- Los bloques de formulario dentro de modales usan `space-y-6`.
- Las tarjetas de entidad usan `p-4` en contenido, no `p-6`, para mantener densidad Business.

### Escala de radios

| Radio | Tailwind | Uso |
| ---: | --- | --- |
| 8px | `rounded-lg` | Opciones internas de dropdown, icon buttons muy compactos |
| 10px | `rounded-[10px]` | Solo si hay que empatar con componentes heredados pequenos |
| 12px | `rounded-xl` | Botones, filtros, dropdown trigger, badges grandes, fields secundarios |
| 14px | `rounded-[14px]` | Capsulas de icono en KPI |
| 16px | `rounded-2xl` o `rounded-[16px]` | KPI cards, search input, footer buttons, popups |
| 24px | `rounded-3xl` | Entity cards, heroes, empty states |
| 28px | `rounded-[1.8rem]` | Role cards y metric cards internas de modal |
| 32px | `rounded-[2rem]` | Avatar grande de modal y empty icon container |
| 40px | `sm:rounded-[2.5rem]` | Modal grande desktop |

Reglas:

- KPI cards siempre `16px`.
- Tarjetas repetidas de entidades siempre `24px`.
- Modales grandes siempre `40px` en desktop y `0px`/pantalla completa en mobile.
- Dropdowns y date pickers siempre `12px` trigger y `16px` popup.
- No mezclar radios dentro del mismo componente salvo jerarquia clara: contenedor `24px`, controles internos `12px`, icon capsule `14px`.

### Bordes

| Elemento | Borde |
| --- | --- |
| Card principal | `1px solid borderColor` |
| KPI card | `1px solid borderColor` o `surfaceBorder` compartido |
| Input | `1px solid borderColor`; foco con `primaryColor` |
| Dropdown trigger | `2px solid borderColor`; activo con `primaryColor` |
| Toggle grid/list | `2px solid borderColor` |
| Modal grande | `1px solid borderColor` |
| Split panel divider | `1px solid borderColor` |
| Danger surfaces | `1px solid ${dangerColor}20` a `${dangerColor}30` |
| Icon capsule KPI | `1px solid ${iconColor}25` |
| Role card activo | `1px solid primaryColor` |

Evitar bordes fuertes en modo claro. Si el borde se ve como linea negra, esta mal. En modo claro el borde base debe rondar `rgba(0,0,0,0.06)`.

### Sombras

| Uso | Modo claro | Modo oscuro |
| --- | --- | --- |
| KPI card | `0 4px 20px -10px rgba(0,0,0,0.05)` | `0 10px 30px -10px rgba(0,0,0,0.4)` |
| Entity card | `0 10px 20px -10px rgba(0,0,0,0.05)` | `0 20px 40px -20px rgba(0,0,0,0.5)` |
| Modal grande | `0 32px 64px -16px rgba(0,0,0,0.5)` | `0 32px 64px -16px rgba(0,0,0,0.5)` |
| Dropdown/date popup | `0 25px 50px -12px rgba(0,0,0,0.5)` | `0 25px 50px -12px rgba(0,0,0,0.5)` |
| CTA pagina | `0 8px 30px ${primaryColor}40` | `0 8px 30px ${primaryColor}40` |
| CTA modal | `0 4px 15px ${primaryColor}40` o `shadow-lg` | `0 4px 15px ${primaryColor}40` |

No usar sombras dramaticas en tarjetas de dashboard salvo modal. El efecto premium viene de borde + blur + glow sutil, no de sombra pesada.

### Alpha y mezcla de color

Usar estas intensidades de alpha para que los estados se vean iguales.

| Sufijo | Opacidad aprox | Uso |
| --- | ---: | --- |
| `08` | 3% | Fondos casi invisibles de datos o charts |
| `10` | 6% | Danger/warning/success surface light |
| `12` | 7% | Alertas suaves, success/danger bg |
| `15` | 8% | Hero glows, icon backgrounds, primary tint light |
| `18` | 9% | Bordes de error muy suaves |
| `20` | 13% | Selected option bg, focus surfaces, today date |
| `25` | 15% | Role/status badge bg |
| `26` | 15% | Borde success import |
| `30` | 19% | Toggle activo, avatar fallback fuerte |
| `40` | 25% | Shadow/glow de accion |
| `50` | 31% | Bordes de iconos grandes |
| `60` | 38% | Glow de sidebar activo |

Ejemplos:

- Seleccion activa en dropdown: `${primaryColor}20`.
- Toggle grid activo: `${primaryColor}30`.
- CTA shadow: `${primaryColor}40`.
- Error banner: `${dangerColor}10` + `${dangerColor}20`.
- Success import: `${successColor}12` + `${successColor}26`.

### Tipografia

Usar Inter. No usar letter spacing negativo. Mantener `letter-spacing: 0` salvo labels uppercase, que usan tracking positivo.

| Elemento | Clase canonica | Peso | Uso |
| --- | --- | ---: | --- |
| Hero H1 | `text-3xl lg:text-4xl font-bold` | 700 | Titulo de pantalla principal |
| Hero subtitle | `text-lg max-w-xl` | 400 | Descripcion corta de la vista |
| Modal title | `text-2xl font-black tracking-tight` | 900 | Header de modales grandes |
| Modal title mobile | `text-xl sm:text-2xl font-black` | 900 | Header modal responsive |
| Section title | `text-xl font-bold` | 700 | Titulos de bloques dentro de dashboard |
| Card title | `text-lg font-bold tracking-tight` | 700 | Nombre de usuario/curso/card |
| Row title | `text-sm font-semibold` | 600 | Nombre en filas |
| Body | `text-sm` | 400-500 | Descripciones, fields, labels legibles |
| Body small | `text-xs` | 400-500 | Metadata, fechas, email |
| KPI label | `text-[10px] uppercase tracking-widest font-bold` | 700 | Labels de metricas |
| Modal label | `text-[10px] font-black uppercase tracking-widest` | 900 | Labels de seccion |
| Entity micro label | `text-[9px] font-black uppercase tracking-tight` | 900 | Metadata interna en cards |
| Button normal | `text-sm font-bold` | 700 | Botones de pagina |
| Button modal | `text-[9px]` o `text-[10px] font-black uppercase tracking-widest` | 900 | Footer modal |
| Badge | `text-xs font-medium` o `text-[10px] font-bold` | 500-700 | Estados/roles |

Reglas:

- Texto largo siempre con `truncate` y padre `min-w-0`.
- Labels de UI pequenos pueden usar `tracking-widest`; parrafos no.
- Botones dentro de cards usan uppercase solo cuando son acciones repetidas administrativas.
- En cards densas evitar `text-xl` salvo valor numerico principal.

### Iconografia

Usar Lucide en componentes nuevos. Hero admin compartido puede usar Heroicons si la primitiva ya lo hace.

| Tamano | Clase | Uso |
| ---: | --- | --- |
| 12px | `w-3 h-3` | Status mini badge, metadata |
| 14px | `w-3.5 h-3.5` | Crown, mail badge, modal metadata |
| 16px | `w-4 h-4` | Botones pequenos, filtros, acciones de fila |
| 20px | `w-5 h-5` | Search icon, view toggle, close icon, KPI icon |
| 24px | `w-6 h-6` | Hero eyebrow, alert icon mediano |
| 32px | `w-8 h-8` | Empty state pequeno, modal avatar fallback |
| 40px | `w-10 h-10` | Empty state / modal analytics icons |
| 48px | `w-12 h-12` | Icono central split modal |
| 64px | `w-16 h-16` | Empty state grande |

Reglas:

- Iconos de botones deben heredar el color del boton o usar token semantico.
- Iconos atenuados usan `opacity-40` a `opacity-70`, no gris hardcodeado.
- Icono activo en sidebar/tabs aumenta stroke visual con color `onPrimaryColor`.
- No dibujar SVG manual para iconos disponibles en Lucide.

### Z-index y capas

| Capa | Z-index | Uso |
| --- | ---: | --- |
| Contenido normal | 0-10 | Cards, sections |
| Dropdown local | 50 | Dropdowns dentro de filtros |
| Sidebar overlay mobile | 100 | Fondo al abrir sidebar |
| Sidebar mobile | 110 | Drawer lateral |
| Header sticky | 999 | Header del panel |
| User dropdown | 999 | Menu usuario |
| Premium select popup global | 9999 | Selects que deben flotar sobre cards |
| Modales grandes | 99999 | Cualquier modal administrativo |

Reglas:

- Modales siempre `zIndex: 99999`.
- Dropdown dentro de modal debe superar contenido del modal pero no salir por encima de otro modal.
- Evitar z-index arbitrarios como `999999` salvo incidente probado.

## Especificacion por componente

### Shell del panel

Estructura exacta:

```tsx
<div className="business-panel-layout fixed inset-0 z-0 flex h-screen max-w-full flex-col overflow-hidden">
  <Header />
  <div className="flex min-w-0 flex-1 overflow-hidden">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <main className="business-panel-content flex-1 overflow-x-clip overflow-y-auto p-4 transition-all duration-300 sm:p-6 lg:p-8 xl:p-12">
        <div className="mx-auto w-full min-w-0 max-w-[1920px]">
          {children}
        </div>
      </main>
    </div>
  </div>
</div>
```

Medidas obligatorias:

| Elemento | Desktop | Mobile |
| --- | --- | --- |
| Header alto | `64px` | `64px` |
| Sidebar abierto | `280px` | `100vw` max visual drawer |
| Sidebar colapsado | `80px` | No aplica |
| Main padding | `lg:p-8 xl:p-12` | `p-4 sm:p-6` |
| Content max width | `1920px` | `100%` |
| Scroll | Solo `main` | Solo `main` o modal activo |

Superficies:

- Header usa fondo semitransparente y `backdrop-blur-xl`.
- Sidebar usa `backdropFilter: blur(20px)`, borde derecho `borderColor`.
- Main no debe tener fondo propio si el layout ya aplica background de organizacion.

### Header administrativo

Composicion:

- Contenedor: `sticky top-0 z-[999] w-full border-b backdrop-blur-xl`.
- Inner: `mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12`.
- Row: `flex h-16 items-center justify-between gap-3`.
- Lado izquierdo: menu mobile, logo, nombre de organizacion si aplica.
- Lado derecho: notification bell, user dropdown.

Medidas:

| Elemento | Medida |
| --- | --- |
| Logo imagen | `h-10 sm:h-12`, `max-w-[140px] sm:max-w-[180px]` |
| Logo fallback | `h-10 w-10 sm:h-12 sm:w-12`, `rounded-lg` |
| Menu mobile button | `p-2 rounded-lg`, visible `lg:hidden` |
| Nombre org | `text-sm sm:text-base`, max `300px` a `360px` |
| Gap acciones | `gap-2 sm:gap-4` |

Estados:

- Header sin estilos de organizacion: light `rgba(255,255,255,0.85)`, dark `rgba(15,23,42,0.85)`.
- Hover de botones: cambiar opacidad o `hoverBg`, nunca cambiar tamano.
- En mobile el nombre puede ocultarse si no cabe.

### Sidebar administrativo

Composicion:

- Wrapper: `fixed inset-y-0 left-0 z-[110] h-full flex flex-col shadow-2xl overflow-hidden lg:relative lg:z-0 lg:shadow-none`.
- Width animado: abierto `280px`, colapsado `80px`.
- Overlay mobile: `fixed inset-0 backdrop-blur-sm z-[100]`, fondo `overlayBg`.
- Nav: `py-6 px-3`, item spacing `space-y-1.5`.

Item de navegacion:

| Estado | Fondo | Color | Opacidad | Sombra |
| --- | --- | --- | ---: | --- |
| Normal | `transparent` | `textColor` | `0.78` | none |
| Hover | `hoverBg` | `textColor` | `1` | none |
| Activo | `primaryColor` | `onPrimaryColor` | `1` | `0 4px 20px -5px ${primaryColor}60` |
| Activo colapsado | `primaryColor` + glow blur | `onPrimaryColor` | `1` | glow |

Medidas item:

- Padding: `px-3 py-3`.
- Radio: `rounded-xl`.
- Icono: `w-5 h-5`.
- Texto: `text-sm font-medium`.
- Gap abierto: `gap-3`.
- Colapsado: `justify-center`; tooltip con `title`.

### Hero de gestion

Debe usarse en vistas principales de admin y Business donde hay acciones de gestion.

Estructura:

- Outer: `relative overflow-hidden rounded-3xl p-8 group`.
- Fondo: `heroBackground`.
- Borde: `1px solid heroBorderColor`.
- Pattern permitido: malla radial de puntos con opacidad `0.10`.
- Decorative dots: maximo 2 puntos pequenos con `accentColor`; no usar orbs grandes.
- Content: `relative z-10`.

Layout:

| Breakpoint | Layout |
| --- | --- |
| `<1024px` | Columna, acciones abajo, `gap-6` |
| `>=1024px` | Row `lg:items-center lg:justify-between` |

Textos:

- Eyebrow: icono `w-6 h-6`, label `text-sm font-semibold tracking-wider uppercase`, color `accentColor`.
- H1: `text-3xl lg:text-4xl font-bold mb-2`.
- Subtitulo: `text-lg max-w-xl`.

Acciones:

- Grupo: `flex flex-wrap items-center justify-start gap-3 lg:justify-end`.
- Secundarias: `px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center gap-2`.
- Primaria: `px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2`.
- Icono primaria: `w-5 h-5`, `strokeWidth={3}`.

### KPI cards

Contrato exacto:

```tsx
className="group relative overflow-hidden rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px] p-4"
```

Layout interno:

- Root: `flex items-center`.
- Content row: `relative z-10 flex items-center w-full gap-4`.
- Icon capsule: `w-12 h-12 rounded-[14px] flex-shrink-0`.
- Text column: `flex flex-col justify-center overflow-hidden min-w-0`.

Medidas:

| Pieza | Medida |
| --- | --- |
| Card height | `min-h-[90px]` normal, `min-h-[78px]` compact |
| Card padding | `p-4` |
| Icon capsule | `48x48` normal, `40x40` compact |
| Icon inside | `20x20` normal, `16x16` compact |
| Label | `text-[10px]`, `tracking-widest`, `mb-1` |
| Value | `text-2xl`, compact `text-xl` |
| Glow | `absolute -right-8 -top-8 w-32 h-32 blur-[40px] opacity-20` |
| Bottom accent | `h-[2px]`, width hover `40%` normal, `32%` compact |

Hover:

- Card: `whileHover={{ y: -2 }}`.
- Icon capsule: `group-hover:scale-[1.05]`.
- Glow: opacity `0.20 -> 0.40`, scale `1 -> 1.10`.
- No cambiar padding, height ni font-size en hover.

### Tarjeta de usuario o entidad gestionable

Contrato exacto de UserCard:

- Root: `group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden`.
- Motion entry: `opacity 0`, `y 30`, delay `index * 0.05`, duration `0.5`.
- Hover: `y: -6`, duration `0.2`.

Header:

| Pieza | Medida |
| --- | --- |
| Hero card top | `h-32` |
| Glow | `absolute inset-0 opacity-20 scale-150 rotate-12 blur-[50px]` |
| Avatar | `w-20 h-20 rounded-2xl` |
| Avatar border | `2px`, light `rgba(0,0,0,0.05)`, dark `rgba(255,255,255,0.1)` |
| Status badge | `absolute -bottom-1 -right-1 p-1 rounded-full border-2` |
| Status icon | `w-3 h-3` |
| Owner crown | `absolute -top-3 -left-3 p-1.5 rounded-xl` |

Content:

| Pieza | Clase |
| --- | --- |
| Padding | `p-4 pt-0` |
| Name wrapper | `text-center mb-4` |
| Name | `font-bold text-lg tracking-tight truncate mb-0.5` |
| Email | `text-[11px] truncate opacity-50 font-medium` |
| Meta list | `flex flex-col gap-2 mb-4` |
| Meta row | `flex items-center justify-between px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5` |
| Meta label | `text-[9px] font-black uppercase tracking-tight opacity-40` |
| Meta value | `text-[10px] font-bold` |

Acciones:

- Secondary grid: `grid grid-cols-2 gap-2`.
- Secondary button: `px-3 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider border`.
- Manage CTA: `px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.1em]`.
- Manage CTA icon: `w-4 h-4`.
- Manage CTA uses `accentColor`; in dark text can be `#000000`, in light `#FFFFFF`.

Reglas para otras entidades:

- Mantener header visual de `h-32` si hay avatar/logo/thumbnail.
- Si la entidad no tiene avatar, usar icono dentro de `80x80 rounded-2xl`.
- Si hay imagen real, `object-cover` y no recortar informacion critica.
- El CTA primario siempre al final con `mt-auto`.

### Fila de lista

Contrato:

- Root: `flex items-center gap-4 p-4 rounded-xl border transition-all group`.
- Fondo: `cardBg`.
- Border: `borderColor`; hover puede aumentar visibilidad.
- Avatar: `40x40 rounded-lg`.
- Grid interno: `grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4`.

Columnas canonicas para usuarios:

1. Nombre/email: `col-span-1 sm:col-span-1 lg:col-span-2`.
2. Jerarquia/ubicacion: visible `lg:flex`.
3. Rol/estado: flex badges.
4. Ultimo acceso: visible `sm:block`, alineado derecha.
5. Acciones rapidas: grupo al final.

Acciones:

- Desktop: `opacity-0 group-hover:opacity-100`.
- Mobile/tablet: si las acciones quedan ocultas por falta de hover, exponer menu o boton visible.
- Action button: `p-1.5 rounded-lg`, icon `w-4 h-4`.

### Search input

Contrato:

```tsx
<div className="relative group flex-1">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 group-focus-within:opacity-80" />
  <input className="w-full pl-12 pr-12 py-3.5 rounded-2xl border focus:outline-none transition-all duration-300" />
</div>
```

Medidas:

| Propiedad | Valor |
| --- | --- |
| Height visual | `50px` aprox |
| Padding left | `48px` |
| Padding right | `48px` |
| Icon left | `16px` |
| Clear right | `16px` |
| Radius | `16px` |
| Border | `1px solid borderColor` |

Estados:

- Default: fondo `cardBg`, borde `borderColor`.
- Focus: mantener layout; si se agrega foco, usar `boxShadow: 0 0 0 3px ${primaryColor}20`.
- Placeholder: `mutedTextColor`, no usar `text-gray-400` directo.
- Clear: icono `X w-4 h-4`, `p-1 rounded-full`.

### Tabs segmentados

Contrato:

- Wrapper: `flex items-center p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full`.
- Wrapper style: `backgroundColor: cardBg`, `border: 1px solid borderColor`.
- Button: `px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0`.

Medidas:

| Pieza | Mobile | Desktop |
| --- | --- | --- |
| Button padding X | `12px` | `24px` |
| Button padding Y | `8px` | `8px` |
| Button radius | `8px` | `8px` |
| Count margin | `ml-1.5` | `ml-2` |
| Count padding | `px-1.5 py-0.5` | `px-2 py-0.5` |
| Count text | `10px` | `10px` |

Estados:

- Activo: `backgroundColor: primaryColor`, `color: onPrimaryColor`, `shadow-lg`.
- Inactivo light: `text-gray-400 hover:text-gray-600` o token equivalente.
- Inactivo dark: `text-white/40 hover:text-white/60`.
- Count activo: `bg-white/20`.
- Count inactivo: light `bg-black/5`, dark `bg-white/10`.

### Filtros principales

Composicion horizontal desktop:

```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <Search className="flex-1" />
  <Select minWidth="140px" />
  <Select minWidth="140px" />
  <AdvancedFiltersButton />
  <ViewToggle />
</div>
```

Medidas:

| Elemento | Valor |
| --- | --- |
| Select min width | `140px` usuarios, `160px` selects genericos |
| Select padding | `px-4 py-3.5` |
| Advanced button | `px-4 py-3.5` |
| View toggle button | `p-3.5` |
| View toggle icon | `w-5 h-5` |
| Divider toggle | `w-px h-6` |

Estados:

- Select con filtro distinto a `all`: borde `primaryColor` o `accentColor`.
- Advanced filters abierto: bg `${primaryColor}20`, border `primaryColor`.
- Counter advanced: bg `primaryColor`, text `onPrimaryColor`, `text-xs font-bold`.
- View activo: bg `${primaryColor}30`, icon color `primaryColor`, stroke `2.5`.

### Filtros avanzados

Contrato:

- Wrapper animado: `flex flex-wrap gap-3 items-center p-4 rounded-xl border`.
- Fondo: `cardBg`.
- Border: `borderColor`.
- Dropdown compacto min width: `150px`.
- Trigger: `px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm`.
- Iconos: `w-4 h-4 opacity-60`.
- Menu: `absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto`.
- Option: `px-3 py-2 text-left text-sm`.
- Results count: `ml-auto text-sm opacity-60`.

Animacion:

- Entrada: `opacity: 0 -> 1`, `height: 0 -> auto`.
- Salida: `opacity: 1 -> 0`, `height: auto -> 0`.

### PremiumSelect

Contrato:

- Root: `relative min-w-[160px]`.
- Trigger: `w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all duration-300 group`.
- Left group: `flex items-center gap-3 flex-1 min-w-0`.
- Label: `text-sm font-medium truncate`.
- Chevron: `w-4 h-4`, rotate `0/180`, duration `0.2`.
- Popup: `absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden backdrop-blur-xl`.
- Popup z-index: `9999`.
- Options wrapper: `py-2 max-h-64 overflow-y-auto`.
- Option: `w-full px-4 py-3 text-left text-sm flex items-center gap-3`.
- Check: `w-4 h-4`, color `primaryColor`.

Estados:

| Estado | Trigger bg | Trigger border | Label | Popup |
| --- | --- | --- | --- | --- |
| Empty | `inputBg` | `borderColor` | `mutedTextColor` | Closed |
| Selected | `inputBg` | `primaryColor` | `textColor` | Closed |
| Open | `inputBg` | `primaryColor` si selected; si no `borderColor` | `textColor` | `panelBg` |
| Option hover | n/a | n/a | `textColor` | option bg `hoverBg` |
| Option selected | n/a | n/a | `textColor` | option bg `${primaryColor}20` |

Accesibilidad recomendada:

- Trigger con `aria-haspopup="listbox"` y `aria-expanded`.
- Popup con role `listbox`.
- Options con role `option` y `aria-selected`.

### PremiumDatePicker

Trigger:

- Root: `relative`.
- Button: `flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all`.
- Disabled: `cursor-not-allowed opacity-50`.
- Calendar icon: `h-5 w-5 flex-shrink-0`, color `primaryColor`.
- Label: `flex-1`, color `textColor` si value, `mutedTextColor` si placeholder.
- Clear icon: wrapper `rounded-lg p-1`, icon `h-4 w-4`.

Popup:

- Position: `absolute left-0 top-full z-50 mt-2`.
- Width: `min-w-[320px]`.
- Shape: `rounded-2xl border p-4 shadow-2xl`.
- Bg: `panelBg`.
- Border: `borderColor`.
- Shadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px ${primaryColor}20`.

Calendar header:

- Month nav row: `mb-4 flex items-center justify-between`.
- Prev/next button: `h-10 w-10 rounded-xl`.
- Month label: `text-lg font-bold`.
- Year: `ml-2 font-medium`, color `subtextColor`.

Week/day grid:

| Pieza | Valor |
| --- | --- |
| Week labels | `grid grid-cols-7 gap-1`, `h-8`, `text-xs font-medium` |
| Days grid | `grid grid-cols-7 gap-1` |
| Day cell | `h-10 w-10 rounded-xl text-sm font-medium` |
| Sunday label | `dangerColor` |
| Other labels | `mutedTextColor` |

Day states:

| Estado | Fondo | Color | Sombra | Opacidad |
| --- | --- | --- | --- | ---: |
| Normal | transparent | `textColor` | none | 1 |
| Hover | `hoverBg` | `textColor` | none | 1 |
| Today | `${primaryColor}20` | `primaryColor` | none | 1 |
| Selected | `primaryColor` | `onPrimaryColor` | `0 4px 15px ${primaryColor}40` | 1 |
| Other month | transparent | `textColor` | none | 0.3 |
| Disabled | transparent | `textColor` | none | 0.3 |

Footer:

- Wrapper: `mt-4 flex items-center justify-between border-t pt-4`.
- Clear: `rounded-xl px-4 py-2 text-sm font-medium`, color `subtextColor`.
- Today: `rounded-xl px-4 py-2 text-sm font-medium`, bg `${accentColor}20`, color `accentColor`.

### Formularios en modal

Grid:

- Root form: `flex-1 flex flex-col overflow-hidden`.
- Scroll body: `flex-1 overflow-y-auto pt-6 pb-12 px-6 lg:px-12 space-y-8`.
- Main grid: `grid grid-cols-1 lg:grid-cols-2 gap-8`.
- Field pair: `grid grid-cols-1 gap-4 sm:grid-cols-2`.

Field:

| Elemento | Clase |
| --- | --- |
| Input | `w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium` |
| Text input with icon | `w-full pl-12 pr-5 py-4 rounded-2xl border` |
| Select temporal | Igual que input, pero migrar a `PremiumSelect` |
| Bio/simple wide input | `rounded-[1.8rem]` permitido |
| Label section | `text-[10px] font-black uppercase tracking-widest px-1 block` |

Focus:

- Borde `primaryColor`.
- Ring opcional `0 0 0 3px ${primaryColor}20`.
- No cambiar alto del campo.

### Role cards / option cards

Uso: elegir rol, permisos, plan, estado visual.

Medidas:

- Grid: `grid grid-cols-1 sm:grid-cols-3 gap-3`.
- Card: `p-5 rounded-[1.8rem] text-left transition-all border`.
- Icon: `w-5 h-5 shrink-0`.
- Title: `text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest truncate`.
- Description: `text-[10px] opacity-60 leading-tight hidden sm:block truncate`.

Estados:

| Estado | Fondo | Borde | Opacidad | Transform |
| --- | --- | --- | ---: | --- |
| Inactivo | `inputBg` | `borderColor` | 0.60 | none |
| Hover inactivo | `inputBg` | `borderColor` | 1 | none |
| Activo | `primaryColor` | `primaryColor` | 1 | `scale(1.02)` |
| Disabled | `inputBg` | `borderColor` | 0.35 | none |

### Modal grande de formulario

Header:

- Wrapper: `relative shrink-0 border-b px-4 pb-4 pt-6 sm:px-6 lg:px-12`.
- Header row: `flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8`.
- Avatar wrapper: `relative shrink-0`.
- Avatar: `w-16 h-16 rounded-[1.5rem] border-4 shadow-2xl overflow-hidden`.
- Title: `text-2xl font-black tracking-tight mb-1`.
- Badge/subtitle: `px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2`.
- Close: `p-3 rounded-2xl border`.

Body:

- Scroll area must not hide behind footer.
- On mobile use `pb-8` or `pb-12`; if footer absolute, add `pb-24`.
- Scrollbar: `scrollbarWidth: thin`, `scrollbarColor: ${borderColor} transparent`.

Footer:

- Wrapper: `sticky bottom-0 flex shrink-0 flex-col gap-4 border-t bg-inherit p-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5`.
- Left label: hidden mobile, `hidden sm:flex items-center gap-2 opacity-30 select-none`.
- Button group: `flex w-full items-center gap-3 sm:w-auto`.
- Secondary: `flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border`.
- Primary: `flex-[2] sm:flex-none px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3`.

### Modal de analitica/estadisticas

Medidas:

- Container: `w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[750px]`.
- Desktop radius: `sm:rounded-[2.5rem]`.
- Header padding: `pt-6 sm:pt-8 pb-4 sm:pb-6 px-6 lg:px-12`.
- Body padding: `pt-6 pb-24 sm:pb-32 px-6 lg:px-12`.
- Footer: absolute bottom, `p-5 px-8`.

Header tabs:

- Tab button: `p-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`.
- Active tab: bg `primaryColor`, color `onPrimaryColor`, `shadow-xl`.
- Inactive tab: bg `inputBg`, color `textColor`, `opacity-30 grayscale`; hover `opacity-100 grayscale-0`.
- Label text hidden on very small screens with `hidden xs:inline`.

Metric cards internas:

- Card: `rounded-[1.8rem] p-5 lg:p-6 border shadow-xl`.
- Icon capsule: `w-12 h-12 rounded-2xl`.
- Label: `text-[10px] font-black uppercase tracking-[0.2em] opacity-40`.
- Value: `text-4xl font-black tracking-tight`.

### Split panel import/wizard

Desktop layout:

```tsx
<div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">
  <aside className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0" />
  <section className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden" />
</div>
```

Left panel:

- Background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`.
- Icon: `w-24 h-24 rounded-2xl`.
- Badge animated: `absolute -top-2 -right-2 w-8 h-8 rounded-full`.
- Title: `text-xl font-bold mb-2 text-center`.
- Subtitle: `text-sm text-center mb-8`.
- Preview cards: `p-3 rounded-xl`, small labels `text-sm`, values `font-bold`.

Right panel:

- Header: `p-4 lg:p-6 border-b`.
- Content: `flex-1 p-4 lg:p-6 overflow-y-auto`.
- Footer: `p-4 lg:p-6 border-t flex items-center justify-end gap-3`.

Dropzone:

- Wrapper: `rounded-xl cursor-pointer transition-all duration-200 p-8`.
- Border: `2px dashed borderColor`; dragging `primaryColor`.
- Bg: default `inputBg`; dragging `${primaryColor}10`.
- Icon holder: `w-14 h-14 mx-auto rounded-xl`.

### Modal destructivo compacto

Aunque `BusinessDeleteUserModal` aun tiene algunas clases heredadas, el patron final debe ser:

- Wrapper: `fixed inset-0 flex items-center justify-center p-4`, z-index modal.
- Backdrop: `overlayBg backdrop-blur-xl`.
- Panel: `w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden`.
- Panel bg: `panelBg` o `cardBg`; no mezclar `slate` local si ya existe token admin.
- Border: `${dangerColor}30`.
- Header: `p-6 border-b`, fondo `${dangerColor}08` o `inputBg`.
- Alert icon container: `w-12 h-12 rounded-xl`, bg `${dangerColor}10`, border `${dangerColor}20`.
- Content: `p-6 space-y-5`.
- Warning block: `p-5 rounded-xl border`, bg `${dangerColor}10`, border `${dangerColor}20`.
- Details block: `p-5 rounded-xl border`, bg `inputBg`, border `borderColor`.
- Footer: `flex items-center justify-end gap-3 pt-4 border-t`.

Copy:

- Titulo claro: "Eliminar usuario", "Revocar invitacion", "Suspender acceso".
- Mensaje debe mencionar el nombre/recurso.
- Consecuencia en una segunda linea visible.
- Boton destructivo con icono `Trash2`, `Lock`, `XCircle` segun accion.

### Pagination

Contrato:

- Wrapper: `flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-3`.
- Fondo: `cardBg`.
- Border: `borderColor`.
- Summary: `text-sm`, color `subtextColor`.
- Button group: `flex items-center gap-2`.
- Previous: `rounded-xl border px-4 py-2 text-sm font-semibold`, bg `inputBg`, border `borderColor`, color `textColor`.
- Next: `rounded-xl px-4 py-2 text-sm font-semibold`, bg `primaryColor`, color `onPrimaryColor`.
- Disabled: `disabled:cursor-not-allowed disabled:opacity-50`.

### Empty states

Contrato:

- Wrapper: `flex flex-col items-center justify-center p-20 text-center rounded-3xl border`.
- Fondo: `cardBg`.
- Border: `borderColor`.
- Icon wrapper: `mb-4`, color `mutedTextColor`.
- Icon: `w-16 h-16` para estados grandes.
- Title: `text-xl font-bold`.
- Description: `text-sm max-w-xs mx-auto mt-2`.

Mobile:

- Padding puede bajar a `p-12`.
- Icono `w-12 h-12` si el espacio es reducido.

### Loading y skeletons

Page loading:

- Root: `p-6 min-h-screen animate-pulse`.
- Hero skeleton: `h-48 rounded-3xl bg-gray-200 dark:bg-gray-800/50 mb-8`.
- KPI skeleton grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4`.
- KPI skeleton: `h-32 rounded-2xl`.
- Filter skeleton: `h-12 rounded-xl`.
- Card skeleton: `h-48 rounded-2xl`.

Spinner:

- Modal/loading spinner: `w-12 h-12 border-[3px] rounded-full animate-spin`.
- Border base: `${primaryColor}20`.
- Border top: `primaryColor`.

### Charts, heatmaps y analitica

General:

- Chart shell debe ser `rounded-2xl` o `rounded-3xl`, `border`, fondo `cardBg`.
- Header de chart con titulo `text-base font-bold` o `text-lg font-bold`.
- Subtitulo `text-sm`, color `subtextColor`.
- Evitar charts sin contenedor o con fondos distintos al panel.

Heatmap:

- Celda base: cuadrada, radio `4px` a `6px`.
- Gap: `3px` a `4px`.
- Empty cell: `hoverBg`.
- Nivel bajo: `${primaryColor}20`.
- Nivel medio: `${primaryColor}40` o `accentColor` alpha.
- Nivel alto: `accentColor` o `successColor`.
- Tooltip/title debe incluir fecha y valor.

Tablas de riesgo:

- Header compacto uppercase `text-[10px] tracking-widest`.
- Rows con `border-t` o separador `dividerColor`.
- Status semantico con badge, no solo texto coloreado.

## Matriz de estados visuales

### Interactive controls

| Estado | Fondo | Borde | Texto | Icono | Motion |
| --- | --- | --- | --- | --- | --- |
| Default | `inputBg`/`cardBg` | `borderColor` | `textColor` | `mutedTextColor` | none |
| Hover | `hoverBg` | `borderColor` o `dividerColor` | `textColor` | `textColor` | scale max `1.01` |
| Active selected | `${primaryColor}20` o `primaryColor` | `primaryColor` | `primaryColor` o `onPrimaryColor` | `primaryColor` o `onPrimaryColor` | shadow suave |
| Focus | igual default | `primaryColor` | `textColor` | `primaryColor` | ring `${primaryColor}20` |
| Disabled | `inputBg` | `borderColor` | `mutedTextColor` | `mutedTextColor` | opacity `0.4-0.5` |
| Loading | `primaryColor` | `primaryColor` | `onPrimaryColor` | spinner | no hover |
| Error | `${dangerColor}10` | `${dangerColor}20` | `dangerColor` | `dangerColor` | no scale |

### Semantic states

| Estado producto | Color | Fondo | Borde | Icono recomendado |
| --- | --- | --- | --- | --- |
| Activo | `successColor` | `${successColor}20` | `${successColor}25` | `CheckCircle` |
| Completado | `successColor` | `${successColor}20` | `${successColor}25` | `CheckCircle` |
| Invitado | `warningColor` | `${warningColor}20` | `${warningColor}25` | `Mail` |
| Pendiente | `warningColor` | `${warningColor}15` | `${warningColor}25` | `Clock` |
| Suspendido | `dangerColor` | `${dangerColor}20` | `${dangerColor}25` | `XCircle` |
| Removido | `#6B7280` | `rgba(107,114,128,0.16)` | `rgba(107,114,128,0.24)` | `AlertCircle` |
| Admin | modo claro `brandColor`, dark `#60A5FA` | token `roleColors.admin.bg` | transparente | `Shield` |
| Owner | `#A855F7` | `rgba(168,85,247,0.12)` | `rgba(168,85,247,0.24)` | `Crown` |
| Member | `actionColor` | `actionSurface` | transparente | `Users` |

## Variantes permitidas por contexto

### Vista densa administrativa

Usar cuando hay muchos registros, filtros y acciones.

- Hero opcional si la vista ya es conocida; si hay acciones principales, mantener hero.
- KPIs arriba, max 5.
- Filtros siempre visibles.
- Default view puede ser cards o list; si hay mas de 20 registros, ofrecer ambos.
- Cards con densidad moderada, no layouts editoriales.

### Vista de detalle

Usar para estadisticas de usuario, curso o empresa.

- Modal o pagina con header fuerte.
- Tabs/chips compactos en header.
- Metric cards internas de `rounded-[1.8rem]`.
- Footer fijo si es modal.
- Charts dentro de shells.

### Vista de configuracion

Usar para formularios largos.

- Secciones en columnas desktop, una columna mobile.
- Labels uppercase micro.
- Inputs grandes `px-5 py-4`.
- Guardar en footer sticky o header action, no ambos.
- Cambios peligrosos en bloque separado con danger styling.

### Vista de importacion o wizard

Usar split panel.

- Preview/instrucciones a la izquierda.
- Accion o proceso a la derecha.
- En mobile preview arriba.
- Footer siempre visible.

## Responsive detallado por componente

### Header

| Breakpoint | Comportamiento |
| --- | --- |
| `<640px` | Logo max `140px`, nombre oculto si no cabe, acciones `gap-2` |
| `640-1023px` | Logo `h-12`, nombre visible con max `300px`, menu mobile visible |
| `>=1024px` | Menu mobile oculto, sidebar visible, nombre max `360px` |

### Sidebar

| Breakpoint | Comportamiento |
| --- | --- |
| `<1024px` | Drawer con overlay, `x: -100% -> 0`, close visible |
| `>=1024px` | Relative en layout, sin overlay, colapsable a `80px` |

### Hero

| Breakpoint | Padding | H1 | Acciones |
| --- | --- | --- | --- |
| `<640px` | `p-6` o `p-8` si cabe | `text-3xl` max | wrap debajo |
| `640-1023px` | `p-8` | `text-3xl` | wrap debajo |
| `>=1024px` | `p-8` | `text-4xl` | derecha |

### KPI grid

| Contexto | Grid |
| --- | --- |
| Users page | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` |
| Admin dashboard | `grid-cols-2 md:grid-cols-3` si son compactas |
| Analytics overview | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |

### Entity grid

| Breakpoint | Grid |
| --- | --- |
| `<768px` | `grid-cols-1` |
| `768-1023px` | `md:grid-cols-2` |
| `1024-1279px` | `lg:grid-cols-3` |
| `>=1280px` | `xl:grid-cols-4` para usuarios; `xl:grid-cols-3` para cards mas anchas |

### Filters

| Breakpoint | Layout |
| --- | --- |
| `<640px` | `flex-col`; search full; selects full width; view toggle right or full |
| `640-1023px` | `sm:flex-row` con wrap si no cabe |
| `>=1024px` | Una linea; search `flex-1`, filtros con min width |

### Modal grande

| Breakpoint | Dimensiones |
| --- | --- |
| `<640px` | `h-[100dvh] w-full`, `p-0`, sin rounded |
| `640-1023px` | `h-[85vh] max-h-[750px] max-w-5xl`, rounded `2.5rem` |
| `>=1024px` | Igual tablet, padding overlay `p-4` |

### Split modal

| Breakpoint | Layout |
| --- | --- |
| `<1024px` | `flex-col`, preview arriba, panel completo scroll |
| `>=1024px` | `flex-row`, preview `320px`, content flex |

## Criterios de QA visual

Antes de considerar terminada una migracion, revisar esta lista:

### Tema claro

- Fondo principal se ve blanco/neutro, no gris oscuro.
- Tarjetas son blancas con borde muy sutil.
- Texto principal es `#0F172A` o equivalente, no negro puro salvo excepcion.
- Primario se ve azul profundo u organizacion, no aqua salvo configuracion.
- Hover no vuelve las tarjetas grises pesadas.
- Inputs se distinguen por borde/fondo sin parecer deshabilitados.

### Tema oscuro

- Fondo principal es profundo (`#0F1419`/`#0b0e14`), no azul saturado.
- Tarjetas usan superficie `#1E2329` con alpha o token.
- Accion principal usa aqua `#00D4B3`.
- Texto principal blanco; secundarios no bajan de legibilidad.
- Bordes son visibles pero no brillantes.
- Glow decorativo no tapa contenido.

### Responsive

- En `375px` no hay scroll horizontal.
- Tabs se desplazan horizontalmente sin romper layout.
- Los filtros bajan a columna y no se aplastan.
- Modales ocupan `100dvh` y footer permanece accesible.
- Inputs y botones no cortan palabras.
- Sidebar mobile cubre contenido con overlay y cierra al tocar fuera.

### Modales

- En laptop 13 pulgadas el modal no se corta.
- Header, body y footer tienen zonas claras.
- El body scrollea internamente.
- El boton primario se ve como accion principal.
- El close button esta visible y no flota fuera del contenedor.
- Los badges del header no empujan el titulo fuera de pantalla.

### Listas y cards

- Cards tienen altura estable aunque nombre/email sean largos.
- Filas tienen `min-w-0` y truncado correcto.
- Acciones no aparecen encima de texto.
- Estados usan color + icono + label.
- Avatares fallback usan inicial y token de acento.

## Recetas de migracion desde superadmin viejo

### Reemplazar card vieja por KPI canonica

Antes:

```tsx
<div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
  <p>Total usuarios</p>
  <h3>120</h3>
</div>
```

Despues:

```tsx
<PanelStatCard
  delay={index}
  icon={UsersIcon}
  iconColor={themeColors.primary}
  theme={panelTheme}
  title={t('dashboard.totalUsers')}
  value={stats.totalUsers}
/>
```

### Reemplazar search bar local

Antes:

```tsx
<input className="bg-white border rounded-lg px-3 py-2" />
```

Despues:

```tsx
<BusinessPanelSearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder={t('users.placeholders.search')}
  className="flex-1"
/>
```

Si no se puede importar Business directo por dependencia, crear `PanelSearchInput` en `core/components/panel` con la misma estructura visual y props de tema.

### Reemplazar select nativo de filtro

Antes:

```tsx
<select className="rounded-lg border px-3 py-2">
  <option>Todos</option>
</select>
```

Despues:

```tsx
<PremiumSelect
  value={filterStatus}
  onValueChange={setFilterStatus}
  options={statusOptions}
  placeholder={t('filters.status')}
/>
```

### Reemplazar modal viejo

Antes:

```tsx
<div className="fixed inset-0 bg-black/50">
  <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
    ...
  </div>
</div>
```

Despues:

```tsx
<div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate" style={{ zIndex: 99999 }}>
  <motion.div className="absolute inset-0" style={{ backgroundColor: theme.overlayBg }} />
  <motion.div className="relative w-full max-w-5xl h-[100dvh] sm:h-[85vh] sm:max-h-[750px] overflow-hidden sm:rounded-[2.5rem]">
    <div className="flex h-full flex-col overflow-hidden border" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
      ...
    </div>
  </motion.div>
</div>
```

## Biblioteca de capturas canonicas

El documento debe estar acompanado por una biblioteca visual. Las capturas no reemplazan la especificacion, pero sirven como prueba rapida de que el diseno final se ve igual al Business Panel.

### Carpeta y nombres

Guardar las capturas canonicas en:

```text
docs/UX/UI/reference-screenshots/
```

Formato de nombre:

```text
[area]-[componente]-[estado]-[tema]-[viewport].png
```

Ejemplos:

```text
business-users-page-default-light-1440.png
business-users-page-default-dark-1440.png
business-users-filters-dropdown-open-light-1440.png
business-users-stats-modal-overview-light-1366.png
business-users-add-modal-mobile-dark-375.png
business-users-date-picker-open-light-768.png
```

Reglas:

- No usar nombres genericos como `screenshot.png`.
- Cada captura debe indicar componente, estado, tema y ancho.
- Las capturas canonicas deben venir del Business Panel, no del superadmin.
- Cuando el superadmin se migre, generar capturas equivalentes con prefijo `admin-` para comparacion.
- Si una captura se actualiza por cambio intencional de diseno, actualizar tambien este documento.

### Viewports obligatorios

| Nombre | Ancho x alto | Uso |
| --- | ---: | --- |
| Mobile small | `375 x 812` | iPhone/Android estrecho, prueba de filtros y modales fullscreen |
| Mobile wide | `430 x 932` | Telefonos modernos grandes |
| Tablet portrait | `768 x 1024` | Formularios, split modals en columna |
| Laptop compact | `1366 x 768` | Prueba critica para modales de `85vh` |
| Desktop standard | `1440 x 900` | Referencia principal de admin |
| Desktop wide | `1920 x 1080` | Max width, grids, distribucion horizontal |

### Capturas minimas por componente

| Componente | Estado | Tema | Viewports | Archivo esperado |
| --- | --- | --- | --- | --- |
| Layout Business users | Default | Light/Dark | 1440, 375 | `business-users-page-default-*` |
| Header | Logo + user dropdown cerrado | Light/Dark | 1440, 375 | `business-header-default-*` |
| Sidebar | Abierto, colapsado, mobile drawer | Light/Dark | 1440, 375 | `business-sidebar-*` |
| Hero de gestion | Con acciones | Light/Dark | 1440, 375 | `business-users-hero-*` |
| KPI cards | 5 cards | Light/Dark | 1440, 375 | `business-users-kpis-*` |
| Tabs segmentados | Activo users | Light/Dark | 1440, 375 | `business-users-tabs-*` |
| Search bar | Empty, con texto, clear visible | Light/Dark | 1440 | `business-search-*` |
| Filtros principales | Dropdown rol abierto | Light/Dark | 1440, 375 | `business-users-role-dropdown-open-*` |
| Filtros avanzados | Panel abierto con filtros | Light/Dark | 1440, 375 | `business-users-advanced-filters-open-*` |
| Toggle grid/list | Grid activo y list activo | Light/Dark | 1440 | `business-users-view-toggle-*` |
| User card | Normal, hover, suspendido | Light/Dark | 1440, 375 | `business-user-card-*` |
| User list row | Normal y hover | Light/Dark | 1440, 375 | `business-user-row-*` |
| Modal stats | Overview tab | Light/Dark | 1366, 375 | `business-user-stats-modal-overview-*` |
| Modal stats | Courses tab | Light/Dark | 1366 | `business-user-stats-modal-courses-*` |
| Modal add user | Empty form | Light/Dark | 1366, 375 | `business-add-user-modal-*` |
| Modal edit user | Filled form | Light/Dark | 1366, 375 | `business-edit-user-modal-*` |
| Split import modal | Empty, file selected, result | Light/Dark | 1366, 375 | `business-import-users-modal-*` |
| Delete modal | Confirmation | Light/Dark | 1366, 375 | `business-delete-user-modal-*` |
| PremiumSelect | Open, selected, empty | Light/Dark | 1440 | `business-premium-select-*` |
| PremiumDatePicker | Open, selected date, today | Light/Dark | 1440, 375 | `business-date-picker-*` |
| Empty state | Sin usuarios/resultados | Light/Dark | 1440, 375 | `business-empty-state-*` |
| Pagination | First page, middle, disabled | Light/Dark | 1440, 375 | `business-pagination-*` |

### Capturas comparativas para superadmin

Cada pantalla migrada del superadmin debe tener par visual:

```text
business-users-kpis-light-1440.png
admin-users-kpis-light-1440.png
```

La comparacion se aprueba si:

- Mismo radio aparente.
- Misma altura de componente.
- Misma jerarquia de texto.
- Mismo tamano de icono.
- Mismo spacing interno.
- Mismo patron de color por tema.
- Misma respuesta responsive.

No se exige que el contenido sea el mismo, pero la estructura visual si.

### Anotaciones de captura

Si una captura necesita notas, crear un `.md` al lado:

```text
business-users-card-light-1440.md
```

Contenido recomendado:

```md
# business-users-card-light-1440

- Ruta: /board-ready/business-panel/users
- Tema: light
- Viewport: 1440 x 900
- Estado: grid, user card normal
- Puntos criticos:
  - Card radius 24px
  - Avatar 80px
  - Header visual h-32
  - CTA manage full width
```

## Mapa de migracion del superadmin

Esta tabla define que patron debe usar cada pantalla del superadmin. Si una pantalla no aparece aqui, debe elegir la variante mas cercana y actualizar el mapa.

| Ruta | Estado actual esperado | Patron canonico | Componentes a usar | Prioridad |
| --- | --- | --- | --- | --- |
| `/admin` | Dashboard principal | Business dashboard shell + hero + KPI cards + quick actions | `AdminLayout`, `AdminHeader`, `AdminSidebar`, `PanelDashboardHero`, `PanelStatCard`, `PanelQuickAction` | P0 |
| `/admin/users` | Gestion de usuarios globales | Business users page | `BusinessPanelSearchInput`, `PremiumSelect`, tabs segmentados, entity cards/list rows, modal grande formulario, modal destructivo | P0 |
| `/admin/companies` | Gestion de empresas | Vista densa administrativa + entity cards/list rows | Hero gestion, KPI cards, filter bar, cards de empresa, split modal para imports, modal formulario | P0 |
| `/admin/companies/[id]` | Detalle/edicion empresa | Vista de detalle/configuracion | Header fuerte, tabs compactos, formularios por seccion, sticky footer, cards metricas | P0 |
| `/admin/courses` | Gestion de cursos | Vista densa con cards/lista | Hero, KPIs, search, filtros, entity cards con thumbnail, row list, modal formulario | P0 |
| `/admin/courses/[id]` | Detalle curso | Vista de detalle | Header, tabs, modules/lessons as cards/list rows, modales grandes, drag/reorder consistente | P0 |
| `/admin/learning-paths` | Rutas de aprendizaje | Vista densa + ordenamiento | Hero, search/filtros, cards de ruta, list rows, reorder controls, modal grande | P1 |
| `/admin/learning-paths/[id]` | Detalle ruta | Vista de detalle | Header, tab/chips, cards de cursos, sortable rows, sticky actions | P1 |
| `/admin/skills` | Skills catalog | Vista densa | KPI cards, search, filters, entity cards, modal formulario, upload card | P1 |
| `/admin/workshops` | Talleres | Vista densa | Hero, KPI cards, filters, entity cards con imagen, modal grande, danger modal | P1 |
| `/admin/news` | Noticias | Vista editorial operativa | Hero, search/filtros, cards con imagen real, row list, modal edit con split sections | P1 |
| `/admin/reels` | Videos cortos | Vista media grid | Hero, filters, media cards, view modal, edit modal, upload states | P1 |
| `/admin/prompts` | Catalogo prompts | Vista densa sin imagen | Tabs/filtros, cards/list rows, badges, modal formulario | P2 |
| `/admin/reportes` | Reportes/moderacion | Tabla densa + detail modal | Data table, bulk actions, row actions, modal detalle/destructivo | P1 |
| `/admin/statistics` | Estadisticas | Analytics overview | KPI cards, chart shells, date filters, `PremiumDatePicker`, heatmaps | P1 |
| `/admin/user-stats` | Estadisticas usuario B2B | Modal/pagina de analitica | `BusinessUserStatsModal` visual pattern, tabs, metric cards, chart shells | P0 |
| `/admin/lia-analytics` | Analitica SofLIA | Analytics overview | KPI cards, chart shells, filters, heatmap rules, conversations table | P1 |
| `/admin/transcoding` | Jobs video | Data table + job cards | KPI cards, filters, status badges, progress bars, table rows | P2 |
| `/admin/moderation-ai` | Moderacion IA | Queue/table workflow | Data table, status panels, row actions, destructive confirmations | P2 |

Prioridad:

- P0: bloquear nuevas implementaciones hasta que siga el patron.
- P1: migrar antes de agregar features grandes.
- P2: migrar cuando se toque la pantalla o haya deuda visual evidente.

### Orden recomendado de migracion

1. Crear/estabilizar tema admin compatible con `useBusinessPanelTheme`.
2. Migrar shell: layout, header, sidebar, content padding.
3. Migrar primitivas compartidas: KPI, search, filters, select, modal.
4. Migrar `/admin/users` y `/admin/companies`, porque son las pantallas mas visibles.
5. Migrar modales de alta/edicion/destructivos.
6. Migrar tablas y bulk actions.
7. Migrar analytics/charts.
8. Generar capturas comparativas.

## APIs recomendadas de componentes compartidos

Estas APIs deben vivir preferentemente en `apps/web/src/core/components/panel` para que admin y Business compartan lenguaje sin que `core` dependa de features.

### PanelThemeAdapter

```ts
export interface PanelThemeAdapter {
  isDark: boolean
  primaryColor: string
  onPrimaryColor: string
  accentColor: string
  secondaryColor: string
  textColor: string
  subtextColor: string
  mutedTextColor: string
  panelBg: string
  cardBg: string
  inputBg: string
  hoverBg: string
  overlayBg: string
  borderColor: string
  dividerColor: string
  successColor: string
  warningColor: string
  dangerColor: string
}
```

Reglas:

- Business puede mapear esto desde `useBusinessPanelTheme()`.
- Admin debe tener un hook equivalente, por ejemplo `useAdminPanelTheme()`.
- Los componentes compartidos reciben `theme` por props o consumen un provider comun.

### PanelButton

```ts
interface PanelButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'modal'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

Implementacion visual:

| Size | Padding | Font | Radius | Icon |
| --- | --- | --- | --- | --- |
| `sm` | `px-3 py-2` | `text-xs font-bold` | `rounded-xl` | `w-4 h-4` |
| `md` | `px-4 py-2.5` | `text-sm font-bold` | `rounded-xl` | `w-4 h-4` |
| `lg` | `px-6 py-2.5` | `text-sm font-bold` | `rounded-xl` | `w-5 h-5` |
| `modal` | `px-8 py-3` | `text-[9px] font-black uppercase tracking-widest` | `rounded-xl` | `w-4 h-4` |

### PanelIconButton

```ts
interface PanelIconButtonProps {
  icon: LucideIcon
  label: string
  active?: boolean
  variant?: 'neutral' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}
```

Visual:

- `sm`: `p-1.5`, icon `w-4 h-4`, radius `8px`.
- `md`: `p-2.5`, icon `w-5 h-5`, radius `12px`.
- `lg`: `p-3`, icon `w-5 h-5`, radius `16px`.
- Always include `aria-label={label}` and `title={label}` unless visible text exists.

### PanelSearchInput

```ts
interface PanelSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  rightSlot?: React.ReactNode
  autoFocus?: boolean
}
```

Debe ser visualmente igual a `BusinessPanelSearchInput`.

### PanelSegmentedTabs

```ts
interface PanelSegmentedTabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: Array<{
    value: T
    label: string
    count?: number
    icon?: LucideIcon
  }>
  size?: 'sm' | 'md'
}
```

Reglas:

- Container `p-1 rounded-xl border`.
- Overflow horizontal en mobile.
- Count badge obligatorio si el tab representa colecciones.

### PanelFilterBar

```ts
interface PanelFilterBarProps {
  search: {
    value: string
    onChange: (value: string) => void
    placeholder: string
  }
  filters: PanelFilterConfig[]
  advancedFilters?: PanelFilterConfig[]
  activeFiltersCount: number
  onClearFilters: () => void
  viewMode?: 'cards' | 'list' | 'table'
  onViewModeChange?: (mode: 'cards' | 'list' | 'table') => void
}
```

`PanelFilterConfig`:

```ts
interface PanelFilterConfig {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string; icon?: LucideIcon }>
  allValue?: string
  icon?: LucideIcon
  accent?: 'primary' | 'accent' | 'success' | 'warning'
}
```

### PanelSelect

Misma API que `PremiumSelect`, pero en `core`:

```ts
interface PanelSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>
  placeholder?: string
  icon?: React.ReactNode
  emptyMessage?: string
  className?: string
}
```

### PanelDatePicker

Misma API que `PremiumDatePicker`:

```ts
interface PanelDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}
```

### PanelModal

```ts
interface PanelModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: LucideIcon
  avatarUrl?: string
  metadata?: React.ReactNode
  tabs?: Array<{ id: string; label: string; icon: LucideIcon }>
  activeTab?: string
  onTabChange?: (id: string) => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  footer?: React.ReactNode
  children: React.ReactNode
}
```

Sizes:

| Size | Width | Height |
| --- | --- | --- |
| `sm` | `max-w-md` | auto, max `90vh` |
| `md` | `max-w-2xl` | auto, max `90vh` |
| `lg` | `max-w-4xl` | `85vh`, max `750px` |
| `xl` | `max-w-5xl` | `85vh`, max `750px` |
| `fullscreen` | `w-full h-[100dvh]` | full |

### PanelSplitModal

```ts
interface PanelSplitModalProps {
  isOpen: boolean
  onClose: () => void
  preview: React.ReactNode
  title: string
  subtitle?: string
  footer: React.ReactNode
  children: React.ReactNode
  maxWidth?: '4xl' | '5xl'
}
```

Preview panel:

- Width desktop `320px`.
- Full width top panel mobile.
- Gradient background from primary/accent alpha.

### PanelEntityCard

```ts
interface PanelEntityCardProps {
  title: string
  subtitle?: string
  imageUrl?: string
  fallbackLabel?: string
  status?: PanelStatusBadge
  badges?: PanelStatusBadge[]
  metaRows?: Array<{ label: string; value: React.ReactNode; icon?: LucideIcon }>
  secondaryActions?: Array<PanelAction>
  primaryAction: PanelAction
  index?: number
}
```

`PanelAction`:

```ts
interface PanelAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
}
```

### PanelDataTable

```ts
interface PanelDataTableProps<T> {
  rows: T[]
  columns: Array<PanelDataColumn<T>>
  getRowId: (row: T) => string
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  sort?: { key: string; direction: 'asc' | 'desc' }
  onSortChange?: (sort: { key: string; direction: 'asc' | 'desc' }) => void
  rowActions?: Array<PanelRowAction<T>>
  bulkActions?: PanelBulkAction[]
  emptyState?: React.ReactNode
  loading?: boolean
}
```

## Tablas y acciones masivas

El Business Panel favorece cards/list rows, pero el superadmin necesita tablas para volumen. Las tablas deben seguir el mismo lenguaje visual.

### Table shell

- Wrapper: `rounded-2xl border overflow-hidden`.
- Background: `cardBg`.
- Border: `borderColor`.
- Header toolbar opcional arriba: `p-4 border-b`.
- Table scroll wrapper: `overflow-x-auto`.
- Min width desktop: `min-w-[760px]` si hay muchas columnas.
- No poner tabla pegada al borde del viewport.

### Header de tabla

| Elemento | Clase |
| --- | --- |
| `thead` | Fondo `inputBg` o `hoverBg` |
| `th` | `px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest` |
| Texto header | `mutedTextColor` |
| Sort icon | `w-3.5 h-3.5 opacity-50` |
| Active sort | color `primaryColor`, opacity `1` |

Header behavior:

- Header sticky solo si la tabla tiene altura fija.
- Sorting se indica con icono y `aria-sort`.
- No usar uppercase grande; debe ser micro label.

### Rows

| Elemento | Clase |
| --- | --- |
| `tr` | `transition-colors` |
| `td` | `px-4 py-3 text-sm` |
| Separador | `border-t borderColor` |
| Hover | `hoverBg` |
| Selected | `${primaryColor}10` |
| Disabled row | `opacity-50` |

Alturas:

- Row compacta: `48px` a `52px`.
- Row normal: `56px` a `64px`.
- Row con avatar: `64px`.

### Celda de identidad

Usar el mismo patron que `UserListRow`:

- Avatar `40x40 rounded-lg`.
- Titulo `text-sm font-semibold truncate`.
- Subtitulo/email `text-xs opacity-50 truncate`.
- Wrapper `flex items-center gap-3 min-w-0`.

### Columnas

Reglas:

- Primera columna de identidad puede tener `min-w-[240px]`.
- Columnas de estado `min-w-[120px]`.
- Columnas de fecha `min-w-[110px]`.
- Acciones `w-[96px]` a `w-[140px]`, alineadas derecha.
- Numeros alineados derecha si son comparables.
- Texto largo truncado con title o tooltip.

### Checkbox de seleccion

Visual:

- Size `16px`.
- Radius `4px`.
- Border `borderColor`.
- Checked bg `primaryColor`.
- Check icon blanco/onPrimary.
- Focus ring `${primaryColor}20`.

Behavior:

- Header checkbox selecciona todos los rows visibles.
- Estado indeterminate cuando hay seleccion parcial.
- Seleccion no debe romper hover.

### Bulk action toolbar

Cuando hay seleccion:

- Toolbar aparece arriba de la tabla o reemplaza filtros secundarios.
- Wrapper: `flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-3`.
- Background: `${primaryColor}10` o `cardBg`.
- Border: `${primaryColor}20`.
- Texto: `text-sm font-semibold`, color `textColor`.
- Count: badge con bg `primaryColor`, text `onPrimaryColor`.
- Acciones: icon buttons o botones `sm/md`.

Bulk actions permitidas:

| Accion | Variant | Icono |
| --- | --- | --- |
| Activar | success | `CheckCircle` |
| Suspender | danger | `Lock` |
| Eliminar | danger | `Trash2` |
| Exportar | secondary | `Download` |
| Asignar | primary | `PlusCircle` |
| Cambiar rol | secondary | `Shield` |

Reglas:

- Acciones destructivas masivas siempre requieren modal destructivo.
- No ejecutar bulk action con solo toast de confirmacion.
- Mostrar cantidad de elementos afectados en modal.

### Row actions

- Desktop: acciones visibles al hover o siempre visibles si tabla es de moderacion.
- Mobile: menu contextual con `MoreHorizontal`.
- Boton: `p-1.5 rounded-lg`, icon `w-4 h-4`.
- Accion primaria puede usar `primaryColor`.
- Destructiva siempre `dangerColor`.

### Responsive de tablas

Opciones aceptadas:

1. En mobile convertir tabla a list rows/cards.
2. Mantener scroll horizontal solo si la tabla es tecnica y la informacion requiere comparacion.
3. Usar columnas prioritarias y ocultar metadata no esencial.

Regla para superadmin: si una tabla gestiona usuarios, empresas, cursos, noticias o prompts, en mobile debe convertirse a card/list row. El scroll horizontal se reserva para jobs tecnicos, logs o analitica tabular.

### Loading rows

- Mostrar 5 a 8 skeleton rows.
- Cada row skeleton: `h-14`, border top, shimmer/pulse.
- Avatar skeleton: `w-10 h-10 rounded-lg`.
- Text skeleton: `h-3 rounded`, width variable.
- No mostrar spinner grande dentro de tabla salvo carga inicial global.

### Empty table

- Usar empty state centrado dentro del shell.
- Padding `p-12` desktop, `p-8` mobile.
- Icono `w-12 h-12`.
- Incluir accion primaria si aplica.

## Toasts, tooltips, popovers y menus contextuales

### Toasts

Ubicacion:

- Desktop: esquina superior derecha, offset `24px` bajo header si header fijo.
- Mobile: bottom safe area o top con ancho `calc(100% - 32px)`.

Medidas:

| Propiedad | Valor |
| --- | --- |
| Width desktop | `360px` a `420px` |
| Width mobile | `calc(100vw - 32px)` |
| Padding | `p-4` |
| Radius | `rounded-2xl` |
| Border | `1px solid` semantico |
| Shadow | `0 20px 40px -20px rgba(0,0,0,0.45)` |
| Icon | `w-5 h-5` |
| Title | `text-sm font-bold` |
| Message | `text-sm` |

Estados:

| Tipo | Fondo | Borde | Icono/color |
| --- | --- | --- | --- |
| Success | `${successColor}12` | `${successColor}26` | `successColor`, `CheckCircle` |
| Error | `${dangerColor}12` | `${dangerColor}26` | `dangerColor`, `AlertCircle` |
| Warning | `${warningColor}12` | `${warningColor}26` | `warningColor`, `AlertTriangle` |
| Info | `${primaryColor}12` | `${primaryColor}26` | `primaryColor`, `Info` |

Behavior:

- Auto close 4 a 6 segundos para success/info.
- Error no critico 6 a 8 segundos.
- Error critico debe tener close manual y accion si aplica.
- No mostrar mas de 3 toasts apilados.

### Tooltips

Uso:

- Icon buttons sin texto.
- Textos truncados.
- Acciones potencialmente ambiguas.

Visual:

- Background: `panelBg` en dark/light, no negro puro.
- Border: `borderColor`.
- Text: `textColor`.
- Font: `text-xs font-medium`.
- Padding: `px-2.5 py-1.5`.
- Radius: `rounded-lg`.
- Shadow: dropdown shadow suave.
- Max width: `240px`.
- Z-index: `9999`.

Behavior:

- Delay show: 300ms.
- Delay hide: 100ms.
- En touch devices no depender de tooltip para informacion critica.
- Tooltip no debe tapar el boton que lo activa.

### Popovers

Uso:

- Informacion auxiliar.
- Pequenos filtros contextuales.
- Confirmacion inline no destructiva.

Visual:

- Width default `280px` a `360px`.
- Padding `p-4`.
- Radius `rounded-2xl`.
- Background `panelBg`.
- Border `borderColor`.
- Shadow `0 25px 50px -12px rgba(0,0,0,0.5)`.
- Header `text-sm font-bold`.
- Body `text-sm`, color `subtextColor`.

Behavior:

- Cierra con click fuera y Escape.
- No usar popover para formularios largos; usar modal.
- No usar popover para destruccion irreversible; usar modal destructivo.

### Menus contextuales

Uso:

- Row actions mobile.
- More menu en cards/tablas.
- User dropdown especializado.

Visual:

- Trigger: icon button `MoreHorizontal`, `p-1.5` o `p-2`.
- Menu width: `w-48` a `w-56`.
- Menu bg: `panelBg`.
- Border: `borderColor`.
- Radius: `rounded-xl`.
- Padding menu: `py-1.5`.
- Item: `w-full flex items-center gap-3 px-4 py-2.5 text-sm`.
- Icon: `w-4 h-4 opacity-70`.
- Divider: `my-1 border-t`, color `dividerColor`.

States:

- Item hover: `hoverBg`, text `textColor`.
- Destructive item: color `dangerColor`, hover `${dangerColor}10`.
- Disabled item: opacity `0.45`, no hover.

## Validacion de formularios

### Field states

| Estado | Borde | Fondo | Texto helper | Icono |
| --- | --- | --- | --- | --- |
| Default | `borderColor` | `inputBg` | `mutedTextColor` | opcional muted |
| Focus | `primaryColor` | `inputBg` | `mutedTextColor` | `primaryColor` si icono |
| Filled | `borderColor` | `inputBg` | `mutedTextColor` | normal |
| Error | `dangerColor` | `${dangerColor}08` | `dangerColor` | `AlertCircle` |
| Success | `successColor` | `${successColor}08` | `successColor` | `CheckCircle` |
| Disabled | `borderColor` | `inputBg` | `mutedTextColor` | muted |
| Readonly | `dividerColor` | `hoverBg` | `mutedTextColor` | muted |

### Error por campo

Estructura:

```tsx
<div className="space-y-2">
  <label className="text-[10px] font-black uppercase tracking-widest px-1">
    Nombre
  </label>
  <div className="relative">
    <input className="w-full px-5 py-4 rounded-2xl border text-sm font-medium" />
  </div>
  <p className="flex items-center gap-1.5 px-1 text-xs font-medium">
    <AlertCircle className="h-3.5 w-3.5" />
    Este campo es obligatorio.
  </p>
</div>
```

Medidas:

- Gap label/input/error: `space-y-2`.
- Helper text: `text-xs`.
- Error icon: `h-3.5 w-3.5`.
- Error text color: `dangerColor`.
- Input border: `dangerColor`.
- Input bg: `${dangerColor}08`.

### Helper text

- Ubicacion debajo del input.
- Font `text-xs`.
- Color `mutedTextColor`.
- Maximo 2 lineas, si es mas largo convertir a info block.
- No usar helper text para errores; usar error state.

### Required marker

Permitido:

- Asterisco visual con color `dangerColor`.
- Texto `(opcional)` en `mutedTextColor` para campos no requeridos si el formulario tiene mezcla compleja.

No permitido:

- Placeholder como unica indicacion de requerido.
- Cambiar label a rojo antes de que exista error.

### Validacion asincrona

Uso: email unico, slug, username, token, URL.

Estados:

- Checking: spinner `w-4 h-4` dentro del input a la derecha.
- Success: check icon `successColor`.
- Error: alert icon `dangerColor`.
- Debounce minimo: 300ms.
- No bloquear escritura durante checking.

### Form-level error

Usar cuando falla una accion completa:

- Wrapper: `p-4 rounded-xl border flex items-center gap-3`.
- Background: `${dangerColor}10`.
- Border: `${dangerColor}20`.
- Icon: `AlertCircle w-5 h-5`.
- Text: `text-[10px] font-black uppercase flex-1` en modales densos, `text-sm` en forms generales.
- Incluir accion secundaria si el error es recuperable.

### Unsaved changes

Si un modal/formulario tiene cambios sin guardar:

- Al cerrar, mostrar confirmacion inline o modal compacto.
- No usar `confirm()`.
- Footer puede mostrar texto `Cambios sin guardar` con icono `Info` en `warningColor`.
- Boton primario mantiene `Guardar`; secundario `Descartar`.

### Disabled y readonly

Disabled:

- `disabled:cursor-not-allowed disabled:opacity-50`.
- No tooltip obligatorio salvo que el motivo no sea obvio.

Readonly:

- Mantener legibilidad, no bajar opacidad demasiado.
- Fondo `hoverBg`, borde `dividerColor`.
- Si se puede copiar, usar icon button `Copy`.

## QA visual por resolucion

Cada PR de migracion visual debe probar estas combinaciones:

| Viewport | Tema | Paginas/componentes |
| --- | --- | --- |
| `375 x 812` | Light | Layout, filters, cards, modal grande, split modal |
| `375 x 812` | Dark | Layout, filters, cards, modal grande, split modal |
| `430 x 932` | Light/Dark | Header, sidebar drawer, action wraps |
| `768 x 1024` | Light/Dark | Form grids, split modal column, cards 2-column |
| `1366 x 768` | Light/Dark | Modales `85vh`, dropdown clipping, footer visible |
| `1440 x 900` | Light/Dark | Default desktop canonical |
| `1920 x 1080` | Light/Dark | Max width, grid density, hero width |

### Checklist por resolucion

Mobile `375`:

- No hay scroll horizontal.
- Sidebar drawer abre/cierra correctamente.
- Header no corta logo ni acciones.
- Tabs son scrollables.
- Filtros ocupan ancho completo.
- Modales usan `100dvh`.
- Footer modal visible sin tapar campos.
- Cards mantienen avatar y CTA sin overlap.

Tablet `768`:

- Formularios usan 2 columnas solo donde hay espacio.
- Split modal sigue en columna si `lg` no aplica.
- Cards pueden usar 2 columnas sin texto cortado.
- Dropdowns no salen del viewport.

Laptop `1366 x 768`:

- Modal grande no supera altura.
- Header y footer modal visibles.
- Body modal scrollea.
- Dropdowns dentro del modal no quedan detras del footer.
- Hero no ocupa demasiado vertical.

Desktop `1440`:

- Layout coincide con Business Panel.
- KPI cards alineadas y misma altura.
- Search/filtros en una linea.
- Cards/list rows con spacing correcto.

Wide `1920`:

- Contenido respeta `max-w-[1920px]`.
- No hay estiramiento exagerado de cards.
- Grids mantienen densidad profesional.

## Gate de PR visual

No aprobar un PR de UI administrativa si ocurre cualquiera de estos puntos:

### Colores y tema

- Hay hex hardcodeado para fondo, texto o borde de UI.
- Hay `isDark ? '#...' : '#...'` dentro de un componente visual.
- Se usa `bg-white dark:bg-*` como patron principal en nuevas piezas.
- Modo oscuro usa azul/purpura como accion primaria en lugar de aqua, salvo grafica semantica.
- El color primario aparece como fondo masivo fuera de hero/sidebar/CTA.

### Layout

- El body de la pagina scrollea en vez del `main`.
- El contenido no respeta padding `p-4 sm:p-6 lg:p-8 xl:p-12`.
- La vista no respeta max width `1920px`.
- Sidebar mobile no tiene overlay.
- Header tapa contenido o pierde z-index.

### Componentes

- KPI card no usa radio `16px`.
- Entity card no usa radio `24px`.
- Botones primarios no tienen icono cuando son acciones administrativas.
- Search input no tiene icono a la izquierda.
- Dropdown usa `<select>` nativo en filtros redisenados.
- Date picker usa input nativo cuando existe `PremiumDatePicker`.
- Modal grande no usa `85vh` desktop o `100dvh` mobile.
- Modal no tiene scroll interno.
- Footer modal tapa contenido.

### Responsive

- Hay scroll horizontal en `375px` sin justificacion tecnica.
- Tabs no son scrollables en mobile.
- Tabla de entidades no se convierte a cards/list rows en mobile.
- Botones cortan texto o se salen del contenedor.
- Dropdown o popover se sale del viewport y no se puede usar.

### Accesibilidad e i18n

- Icon button sin `aria-label` o `title`.
- Texto visible hardcodeado sin `t()`.
- Estado indicado solo por color.
- Contraste insuficiente en texto secundario.
- Modal no cierra con boton visible.
- Accion destructiva sin confirmacion.
- Se usa `confirm()`, `alert()` o prompt nativo.

### Mantenibilidad

- Se copia JSX completo de KPI/search/select/modal en vez de reutilizar primitiva.
- Un componente visual nuevo supera 300 lineas sin dividir.
- Estilos de color se pasan por props sueltas en lugar de tema.
- Se mezcla fetch/mutacion pesada con componente visual.

## Registro de decisiones visuales

Cuando un equipo necesite desviarse de esta guia, debe agregar una decision corta en:

```text
docs/decisions/
```

Formato:

```md
# ADR-XXX-desviacion-visual-[componente]

## Contexto

Que componente o pantalla no puede seguir el patron.

## Decision

Que se cambia y por que.

## Limites

Donde aplica y donde no.

## Reversion

Como volver al patron canonico.
```

Sin ADR, la desviacion se considera deuda visual y debe corregirse.

## Definicion de "exactamente igual"

Un componente se considera alineado al Business Panel si cumple todo lo siguiente:

1. Usa los mismos tokens de color o un adapter con los mismos nombres.
2. Usa el mismo radio para su categoria.
3. Usa el mismo padding vertical y horizontal.
4. Usa el mismo tamano de iconos.
5. Usa la misma jerarquia tipografica.
6. Usa los mismos estados hover/active/disabled.
7. Usa la misma estructura responsive.
8. No agrega decoracion no existente en Business Panel.
9. No usa hex hardcodeado para superficies/textos/bordes.
10. Se ve correcto en claro y oscuro sin branches locales nuevos.

## Reglas de implementacion

1. Antes de crear un componente visual nuevo, buscar una primitiva existente en Business Panel.
2. Si el componente sera compartido entre Business y superadmin, moverlo a `core/components/panel` o crear una primitiva con props de tema.
3. Consumir tokens del tema; no calcular colores localmente.
4. Usar Lucide icons para acciones, filtros, estados y navegacion.
5. Mantener textos visibles traducidos con `t()`.
6. No usar `confirm()`, `alert()` ni selects nativos en UI redisenada.
7. Mantener los componentes grandes separados: shell visual, hooks de logica, subcomponentes y tipos.

## Antipatrones prohibidos

- `bg-white dark:bg-slate-*` como base de tarjetas administrativas nuevas.
- Hex hardcodeado para superficies, textos o bordes dentro de componentes.
- Gradientes decorativos de una sola familia cromatica en toda la pantalla.
- Modales sin scroll interno que se cortan en laptops de 13 pulgadas.
- Tablas que desbordan horizontalmente en mobile sin alternativa.
- Botones con texto sin icono cuando representan herramientas o acciones repetidas.
- Copiar JSX de KPIs, search bars o dropdowns en lugar de reutilizar primitivas.

## Checklist para migrar el superadmin

- Crear un hook de tema admin compatible con `useBusinessPanelTheme`.
- Reemplazar KPI cards por `PanelStatCard` o `BusinessPanelStatCard` adaptado.
- Reemplazar search bars por `BusinessPanelSearchInput`.
- Migrar filtros a `PremiumSelect` y tabs segmentados.
- Unificar modales de alta/edicion con el modal grande de administracion.
- Usar split panel para imports, wizards y procesos con preview.
- Usar modal destructivo compacto para borrados y revocaciones.
- Revisar mobile: filtros apilados, cards a una columna, modales `100dvh`, sidebar drawer.
- Eliminar hardcodes de color salvo semanticos invariantes y graficas.
- Validar claro/oscuro en cada vista antes de cerrar el cambio.
