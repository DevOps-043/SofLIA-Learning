# Auditoria de rendimiento movil - Dashboard y Panel de Talleres

Fecha: 2026-05-02  
Estado: auditoria inicial, sin cambios implementados  
Fuente de verdad: `prompt_maestro.md`

## 1. Resumen ejecutivo

La auditoria encontro optimizaciones moviles ya iniciadas en el dashboard de usuario, especialmente `useMobilePerformanceMode`, lazy loading parcial y reduccion inicial de cursos en modo movil. Sin embargo, los riesgos principales siguen concentrados en cuatro frentes:

- Listados grandes sin paginacion real ni virtualizacion.
- Filtros y derivaciones en cliente sobre arreglos completos.
- Animaciones e imagenes pesadas en rutas moviles.
- Componentes/modales grandes que mezclan UI, estado, datos y comportamiento.

Segun `prompt_maestro.md`, los focos mas importantes contradicen reglas de escalabilidad, separacion de responsabilidades, performance y deuda tecnica: no usar full table scans/listados masivos evitables, usar paginacion real en listados grandes, minimizar payloads y evitar componentes gigantes.

## 2. Checklist de seguimiento

Usar este checklist como tablero tecnico. Marcar una casilla solo cuando el cambio este implementado, validado y revisado en mobile.

### Criticos

- [ ] P0 - Implementar paginacion server-side para `business/users`.
- [ ] P0 - Evitar render completo de `filteredUsers`, `filteredInvitations`, `filteredInviteLinks` y `filteredJoinRequests`.
- [ ] P0 - Separar payload inicial de usuarios: listado, stats, invitaciones, links y solicitudes.

### Altos

- [ ] P1 - Memoizar filtros y valores unicos en `useBusinessUsersPageLogic`.
- [ ] P1 - Agregar debounce a busqueda/filtros de usuarios.
- [ ] P1 - Cambiar lazy import de `/admin/workshops` para no importar desde barrel `@/features/admin/components`.
- [ ] P1 - Reducir animaciones de `AdminWorkshopCard` en mobile/coarse pointer.
- [ ] P1 - Optimizar `dashboard-header.png` y `teams-header.png` a formatos responsive WebP/AVIF.
- [ ] P1 - Remover `unoptimized` de imagen hero en `BusinessPanelDashboard`, salvo justificacion medida.
- [ ] P1 - Migrar thumbnails de talleres e instructor avatars a `next/image`.
- [ ] P1 - Agregar paginacion/filtros server-side para `/api/admin/workshops`.
- [ ] P1 - Validar y cachear previews IA de `business-user/learning-preview`.

### Medios y bajos documentados

- [ ] P2 - Aislar timers de fecha/greeting para evitar re-render de pantallas completas.
- [ ] P2 - Limitar items iniciales en carruseles de `LearningPathView`.
- [ ] P2 - Dividir `AddWorkshopModal` y lazy-load tab media/upload.
- [ ] P2 - Reemplazar hex hardcoded por tokens de tema/Tailwind/CSS variables.
- [ ] P3 - Validar accesibilidad movil de vistas lista en `business-panel/users`.
- [ ] P3 - Ejecutar bundle analyzer por ruta auditada.

## 3. Alcance analizado

| Area | Archivo/Ruta | Proposito | Relevancia movil |
|---|---|---|---|
| Dashboard usuario org | `apps/web/src/app/[orgSlug]/business-user/dashboard/page.tsx` | Entrada del dashboard BusinessUser | Carga cliente, Joyride, shell principal |
| Dashboard usuario logica | `apps/web/src/app/[orgSlug]/business-user/dashboard/hooks/useBusinessUserDashboardPageLogic.ts` | Fetch, estado, navegacion, tour | Red/API, timers, re-render |
| Dashboard usuario shell | `apps/web/src/app/[orgSlug]/business-user/dashboard/page-components/BusinessUserDashboardShell.tsx` | Hero, cursos, learning paths | Layout, imagenes, lazy loading |
| Learning paths | `apps/web/src/app/[orgSlug]/business-user/dashboard/components/LearningPathView.tsx` | Carruseles y preview IA | Scroll movil, API on-demand, memoria |
| Panel usuarios | `apps/web/src/app/[orgSlug]/business-panel/users/page.tsx` | Gestion usuarios/invitaciones | Listas largas, filtros, modales |
| Hook usuarios | `apps/web/src/features/business-panel/hooks/useBusinessUsersPageLogic.ts` | Estado, filtros, acciones | CPU en busqueda, re-render |
| Fetch usuarios | `apps/web/src/features/business-panel/hooks/useBusinessUsers.ts` | Carga usuarios/invitaciones/enlaces | Payload inicial |
| API usuarios | `apps/web/src/app/api/[orgSlug]/business/users/route.ts` | Endpoint users | Sin paginacion/cache |
| Query usuarios | `apps/web/src/features/business-panel/services/business-users-server/query.service.ts` | Supabase org users/stats | Carga total |
| Dashboard business panel | `apps/web/src/features/business-panel/components/BusinessPanelDashboard.tsx` | Dashboard admin organizacion | Imagenes, motion, cards |
| Hook dashboard panel | `apps/web/src/features/business-panel/hooks/useBusinessPanelDashboardLogic.ts` | Stats/activity | API, assets, estilos |
| Panel talleres | `apps/web/src/features/admin/components/AdminWorkshopsPage.tsx` | Gestion talleres | Listado, modales |
| Hook talleres | `apps/web/src/features/admin/hooks/useAdminWorkshops.ts` | Fetch talleres/stats | Red/API |
| Query talleres | `apps/web/src/features/admin/services/admin-workshops/workshops-query.service.ts` | Query Supabase | Carga total, conteos |
| Cards talleres | `apps/web/src/features/admin/components/admin-workshops/AdminWorkshopCard.tsx` | Card visual taller | Animacion, imagen, colores |
| Thumbnail talleres | `apps/web/src/features/admin/components/admin-workshops/WorkshopThumbnail.tsx` | Imagen/fallback | Optimizacion imagen |
| Modal taller | `apps/web/src/features/admin/components/add-workshop-modal/AddWorkshopModal.tsx` | Crear taller | Bundle, UX movil, mantenibilidad |

## 4. Hallazgos priorizados

| Prioridad | Severidad | Tipo de impacto | Archivo/Linea | Hallazgo | Evidencia | Impacto movil | Solucion recomendada |
|---|---|---|---|---|---|---|---|
| P0 | Critico | Uso de red/API, carga inicial | `app/api/[orgSlug]/business/users/route.ts:25`, `business-users-server/query.service.ts:18` | Gestion de usuarios carga todos los usuarios sin paginacion | `getOrganizationUsers()` no usa `.range()`, `.limit()` ni filtros por query; endpoint devuelve usuarios, stats, invitaciones, links y org juntos | En organizaciones grandes aumenta TTFB, memoria, JS y DOM inicial | Crear contrato paginado con `page`, `limit`, `search`, filtros y seleccion explicita de campos |
| P0 | Critico | Renderizado, memoria | `business-panel/users/page.tsx:324`, `:361`, `:400`, `:452`, `:531` | Render completo de listas | `.map()` directo sobre arreglos filtrados completos | DOM masivo, scroll con jank, GC frecuente en iPhone/Android | Paginacion visible, carga incremental o virtualizacion |
| P1 | Alto | Re-render, CPU | `useBusinessUsersPageLogic.ts:231-280` | Filtros y valores unicos se recalculan en cada render | `uniqueRegions`, `uniqueZones`, `uniqueTeams`, `filteredUsers`, `filteredInvitations`, `filteredInviteLinks`, `filteredJoinRequests` sin `useMemo` | Cada tecla en busqueda ejecuta filtros completos y puede generar input lag | `useMemo`, debounce y mover busqueda al servidor para volumen alto |
| P1 | Alto | Peso de bundle | `app/admin/workshops/page.tsx:7`, `features/admin/components/index.ts:1-31` | Lazy import de talleres usa barrel grande | `dynamic(() => import('@/features/admin/components').then(...))`; barrel exporta multiples paginas/widgets admin | Chunk de talleres puede arrastrar codigo no necesario | Import directo a `AdminWorkshopsPage` y validar con bundle analyzer |
| P1 | Alto | Renderizado, UX movil | `AdminWorkshopCard.tsx:45-245` | Exceso de `framer-motion` por card | Multiples `motion.div`, `motion.span`, `motion.button`, `whileHover`, springs y delays por indice | Scroll y compositing costosos en listas de talleres | Desactivar motion en mobile/coarse pointer, animar solo entrada o usar CSS |
| P1 | Alto | Imagenes, LCP | `BusinessPanelDashboard.tsx:64-72` | Hero pesado y `unoptimized` | `dashboard-header.png` pesa aprox. 610 KB y se usa con `priority unoptimized` | LCP movil y ancho de banda degradados | Convertir a WebP/AVIF, remover `unoptimized`, ajustar `sizes` |
| P1 | Alto | Imagenes, LCP | `BusinessUserDashboardShell.tsx:226-232` | Hero BusinessUser pesado con `priority` | `teams-header.png` pesa aprox. 626 KB | Compite con JS y APIs en carga inicial movil | Versiones responsive, evaluar `priority` con medicion LCP |
| P1 | Alto | Uso de red/API | `useAdminWorkshops.ts:25-40`, `workshops-query.service.ts:10-119` | Talleres carga listado completo y datos agregados para todos | `/api/admin/workshops` trae todos los cursos; luego query de modulos y enrollments para todos | TTFB y memoria crecen con catalogo | Paginacion/filtros server-side y stats agregadas/cacheadas |
| P1 | Alto | Imagenes, render | `WorkshopThumbnail.tsx:59-67`, `AdminWorkshopCard.tsx:134-146` | Uso de `<img>`/`motion.img` sin optimizacion Next | Thumbnails y avatar de instructor no usan `next/image`, `sizes`, ni optimizacion responsive | Descarga de imagenes grandes en cards moviles | Migrar a `next/image`, lazy loading y sizes |
| P1 | Alto | Latencia interactiva/API | `LearningPathView.tsx:516-540`, `app/api/[orgSlug]/business-user/learning-preview/route.ts:220-338` | Preview de aprendizaje puede invocar Gemini en interaccion | Endpoint carga learning paths, consulta DB y puede llamar a Gemini | Latencia perceptible y consumo de red al tocar/abrir previews | Cache por usuario/curso, timeout, fallback inmediato y disparo explicito |
| P2 | Medio | Re-render | `useBusinessUserDashboardPageLogic.ts:136-139`, `BusinessPanelDashboard.tsx:32-35` | Timers de minuto re-renderizan arboles grandes | `setInterval(() => setCurrentTime(new Date()), 60000)` en dashboards | Re-render periodico innecesario | Aislar reloj/greeting o calcular sin estado global |
| P2 | Medio | Responsive/layout | `LearningPathView.tsx:825`, `BusinessUserDashboardShell.tsx:542` | Carruseles y cards sin virtualizacion | `overflow-x-auto`, `learningPath.items.map`, `displayedCourses.map` | Mas DOM y scroll horizontal costoso cuando crecen rutas/cursos | Limitar items iniciales y usar "ver mas" por path |
| P2 | Medio | Mantenibilidad, bundle | `AddWorkshopModal.tsx:33-431` | Modal grande mezcla tabs, UI, validacion y upload | Archivo aprox. 24 KB con tabs y `ImageUploadCourse` | Chunk admin mas pesado y dificil de optimizar | Dividir tabs y lazy-load media/upload |
| P2 | Medio | Mantenibilidad, estilos | `AdminWorkshopCard.tsx`, `StatCard.tsx`, `QuickAction.tsx` | Hardcoded colors contra reglas del repo | Uso repetido de `#0A2540`, `#00D4B3`, `#1E2329`, `#FFFFFF` | Dificulta theming y consistencia responsive | Mover a tokens Tailwind/CSS variables/org colors |

## 5. Plan de implementacion sugerido

### Fase 1: Criticos y altos de menor riesgo

- Cambiar import dinamico de `/admin/workshops` para importar directamente `AdminWorkshopsPage`.
- Memoizar filtros y valores unicos en `useBusinessUsersPageLogic`.
- Agregar debounce al search term en usuarios.
- Remover `unoptimized` del hero de `BusinessPanelDashboard` si la imagen puede pasar por Next Image.
- Migrar `WorkshopThumbnail` a `next/image`.
- Desactivar `whileHover`/springs en `AdminWorkshopCard` para mobile/coarse pointer.

### Fase 2: Contratos API y listados grandes

- Implementar paginacion server-side para `GET /api/[orgSlug]/business/users`.
- Separar o parametrizar recursos: users, stats, invitations, invite links, join requests.
- Implementar paginacion server-side para `GET /api/admin/workshops`.
- Mover filtros de usuarios/talleres a query params.
- Reducir campos devueltos a los necesarios para la vista inicial.

### Fase 3: Optimizacion visual y bundle

- Convertir `dashboard-header.png`, `teams-header.png` y card backgrounds a WebP/AVIF.
- Lazy-load modales pesados de talleres y tabs de media/upload.
- Revisar lazy loading de Joyride/video intro para que no afecte usuarios sin tour activo.
- Limitar carruseles de learning paths por cantidad inicial.

### Fase 4: Validacion y medicion

- Ejecutar Lighthouse mobile en rutas auditadas.
- Ejecutar `npm run analyze --workspace=apps/web`.
- Medir llamadas API y payloads en Network con throttling 4G.
- Perfilar busqueda de usuarios con React Profiler.
- Validar scroll de talleres en viewport 390x844 y 360x800.

## 6. Checklist tecnico de validacion

- [ ] Lighthouse movil antes/despues.
- [ ] LCP medido en dashboard usuario y dashboard business panel.
- [ ] INP medido al buscar usuarios y cambiar filtros.
- [ ] CLS revisado en heroes/cards/listas.
- [ ] Peso de bundle por ruta revisado.
- [ ] Payload de `/business/users` reducido o paginado.
- [ ] Payload de `/admin/workshops` reducido o paginado.
- [ ] Numero de llamadas API documentado al montar cada vista.
- [ ] React Profiler sin renders masivos en cada tecla de busqueda.
- [ ] Scroll de talleres fluido en mobile throttling.
- [ ] Imagenes servidas en formato responsive.
- [ ] Sin overflow horizontal no intencional.
- [ ] Tap targets revisados en cards, rows y modales.
- [ ] Reduced motion/coarse pointer respetado.

## 7. Notas de evidencia adicional

- `rg` no pudo ejecutarse por "Acceso denegado" en el entorno; la exploracion se hizo con PowerShell de solo lectura.
- No se modifico codigo durante la auditoria inicial.
- No se ejecutaron builds, tests ni Lighthouse; los puntos marcados como impacto real deben validarse con medicion despues de implementar.
- Assets observados:
  - `apps/web/public/images/dashboard-header.png`: aprox. 609 KB.
  - `apps/web/public/images/teams-header.png`: aprox. 626 KB.
  - `apps/web/public/images/dashboard-cards/*.png`: aprox. 262 KB a 609 KB por imagen.

## 8. Criterio para cerrar hallazgos

Un hallazgo puede marcarse como tratado cuando:

1. El cambio esta implementado.
2. Hay validacion funcional del flujo afectado.
3. Hay validacion movil basica en viewport pequeno.
4. Si era de red/bundle/render, existe medicion antes/despues o evidencia equivalente.
5. No se introdujo deuda contraria a `prompt_maestro.md`: sin componentes gigantes nuevos, sin payloads masivos nuevos, sin hardcodes innecesarios y sin logica de negocio mezclada en UI.
