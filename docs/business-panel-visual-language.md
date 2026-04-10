# Business Panel Visual Language

## Objetivo

Establecer un lenguaje visual único para el business panel y evitar que cada panel implemente su propia variante de tarjetas, barras de búsqueda o modales. La referencia canónica ya existe en el sistema y debe copiarse, no reinterpretarse.

## Fuentes canónicas

### Tarjetas de estadísticas

- `apps/web/src/app/[orgSlug]/business-panel/users/components/StatCard.tsx`
- `apps/web/src/features/business-panel/components/dashboard/StatCard.tsx`

Patrón:

- Superficie `glass` con `border` sutil y `backdrop-blur`.
- Radio `16px`.
- Icono dentro de cápsula propia, con degradado suave y borde del mismo tono semántico.
- Etiqueta en uppercase, tracking amplio y opacidad reducida.
- Valor principal pesado, compacto y con glow radial decorativo en la esquina.
- Línea de acento inferior en hover.

Regla:

- No volver a crear tarjetas métricas con `bg-white`, `dark:bg-*`, o combinaciones locales de `isDark ? ... : ...`.
- Consumir la primitiva compartida `BusinessPanelStatCard`.

### Search bars y barras de filtros

- `apps/web/src/app/[orgSlug]/business-panel/users/components/UsersFilterBar.tsx`

Patrón:

- Search input ancho, redondeado, con icono a la izquierda.
- Fondo de tarjeta, no input plano.
- Segmentación visual clara: tabs, búsqueda, filtros, toggle de vista.
- Los dropdowns viven sobre la misma familia de superficie y borde.

Regla:

- La búsqueda principal debe usar el mismo shell visual que usuarios.
- No usar placeholders o shells heredados del layout viejo de analytics.
- Consumir `BusinessPanelSearchInput` cuando no exista una variante más específica.

### Modales

- `apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx`
- `apps/web/src/features/business-panel/components/BusinessDeleteUserModal.tsx`

Patrón:

- Overlay controlado por tokens.
- Contenedor redondeado, alto, con header fuerte y bloques internos sobre la misma familia de superficies.
- Avatar o ícono destacado en la cabecera.
- Tabs o chips compactos dentro del header.
- Footer con CTA primario y acción secundaria consistente.

Regla:

- Evitar modales con shell claro/oscuro separado y hardcodes como `bg-white dark:bg-[#0f172a]`.
- Tomar `useBusinessPanelTheme` como única fuente de color.

## Tokens obligatorios

Todos los componentes del business panel deben consumir `useBusinessPanelTheme()`:

- `cardBg`
- `inputBg`
- `panelBg`
- `hoverBg`
- `overlayBg`
- `borderColor`
- `dividerColor`
- `textColor`
- `subtextColor`
- `mutedTextColor`
- `primaryColor`
- `accentColor`
- `secondaryColor`

## Anti-patrones prohibidos

- `isDark ? '#hex' : '#hex'` dentro de componentes de UI.
- `bg-white dark:bg-*` para tarjetas del business panel.
- `text-[#0A2540]`, `bg-[#0A2540]`, `text-white`, `border-white/10` como defaults locales.
- Props de lógica que solo existen para transportar colores a componentes.
- Repetir el mismo JSX de stat cards o search bars en paneles distintos.

## Adopción prioritaria

1. `BusinessAnalytics` y su subárbol.
2. `CourseAnalyticsTab`.
3. `BusinessPanelHeader`.
4. Modales y tablas heredadas que todavía dependan de `useThemeStore` o hex fijos.

## Criterio de aceptación

- Analytics debe verse como una extensión natural de `users` y `dashboard`.
- Las tarjetas métricas, search bars y modales deben compartir la misma gramática visual.
- Los nuevos componentes deben salir de primitivas compartidas, no de copias adicionales.
- Los hex hardcodeados solo se aceptan para colores semánticos invariantes o para visualización de datos cuando el token aún no existe.
