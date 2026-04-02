# Verificacion de deuda tecnica - 2026-04-02

## Resumen ejecutivo

- `docs/refactor-program.md` ya no esta tan lejos del repo como en la auditoria anterior, pero solo si se mide con su mismo criterio de exclusiones.
- Bajo un barrido de `apps/web/src` sobre `ts/tsx/js/jsx`, excluyendo `tests/specs`, `d.ts`, `lib/supabase/types.ts`, `lib/lia-context/config/page-metadata.ts` y `lib/nanobana/templates.ts`, la foto real hoy es:
  - `0` archivos `>=800`
  - `0` archivos `>=700`
  - `72` archivos `>=500`
  - `285` archivos `>=300`
- Contra los numeros que hoy afirma `docs/refactor-program.md` (`0 / 0 / 78 / 283`), la desviacion estructural actual es pequena: `-6` archivos en `>=500` y `+2` en `>=300`.
- Si se mira el repo sin esas exclusiones manuales, la foto completa todavia tiene `2` archivos `>=800`, `2` `>=700`, `75` `>=500` y `288` `>=300`. Los dos gigantes son `apps/web/src/lib/supabase/types.ts` (`9054`) y `apps/web/src/lib/lia-context/config/page-metadata.ts` (`2867`).
- Conclusion fuerte: los conteos estructurales del programa son hoy "mayormente ciertos", pero el TDI `~8% operativo / ~12% contextual real` sigue siendo optimista. Mi lectura actual, ya con validacion operativa y deuda transversal, esta mas cerca de `~12-14%` operativo y `~18-22%` contextual real.

## Metodologia usada

- Lectura directa de `prompt_maestro.md`.
- Lectura y contraste de `docs/refactor-program.md`.
- Barrido repo-wide de `apps/web/src` con medicion real de lineas por archivo.
- Conteos transversales de `any`, `legacy`, `server-only` y hex hardcodeados.
- Revision puntual de hotspots de hooks, routes, prompts, auth/session, contenido y metadata.
- Verificacion operativa con:
  - `npm run build --workspace=apps/web`
  - `node_modules\\.bin\\tsc.cmd --noEmit --project apps/web/tsconfig.json --incremental false --pretty false`

Notas metodologicas:

- El conteo de `TODO` se recalculo con limite de palabra (`\\bTODO\\b|\\bFIXME\\b|\\bXXX\\b`) para evitar falsos positivos con palabras en espanol como `todo/todos`.
- No todo archivo grande es automaticamente spaghetti. Distingo entre:
  - archivo largo pero relativamente coherente
  - archivo largo o mediano que mezcla demasiadas responsabilidades
  - archivo grande por datos/configuracion manual y no por logica de ejecucion

## Prompt maestro: reglas usadas como criterio

Estas son las reglas del proyecto que use como base de juicio:

- `prompt_maestro.md:51` - no hardcodear magic numbers, magic strings ni configuracion que deba centralizarse
- `prompt_maestro.md:55` - no agregar complejidad accidental
- `prompt_maestro.md:56` - no dejar codigo muerto, duplicado o commented-out
- `prompt_maestro.md:67` - alta cohesion y bajo acoplamiento
- `prompt_maestro.md:68` - responsabilidad unica por modulo, clase, servicio o funcion
- `prompt_maestro.md:69` - interfaces claras y contratos explicitos
- `prompt_maestro.md:70` - flujo de datos comprensible
- `prompt_maestro.md:154` - no poner logica critica unicamente del lado cliente

## Que tan ciertos son hoy los numeros de `docs/refactor-program.md`

### 1. Conteo estructural del backlog

| Metrica | `refactor-program.md` | Medido hoy | Veredicto |
|---|---:|---:|---|
| Archivos `>=800` | 0 | 0 | Correcto bajo el criterio del programa |
| Archivos `>=700` | 0 | 0 | Correcto bajo el criterio del programa |
| Archivos `>=500` | 78 | 72 | Cercano, pero sobredimensionado por `6` |
| Archivos `>=300` | 283 | 285 | Cercano, pero subdimensionado por `2` |

Veredicto:

- La parte estructural del documento es hoy bastante mas confiable que antes.
- El desajuste ya no es dramatico; es pequeno.
- Aun asi, la exactitud depende de exclusiones manuales. En el repo real siguen existiendo blobs grandes de metadata/configuracion que el programa deja fuera del backlog.

### 2. Conteo completo sin exclusiones manuales

| Metrica | Medido hoy |
|---|---:|
| Archivos `>=800` | 2 |
| Archivos `>=700` | 2 |
| Archivos `>=500` | 75 |
| Archivos `>=300` | 288 |

Principales blobs fuera del criterio del programa:

| Archivo | Lineas | Lectura |
|---|---:|---|
| `apps/web/src/lib/supabase/types.ts` | 9054 | Generado; no deberia contar como hotspot de refactor funcional, pero si pesa en mantenimiento y compilacion |
| `apps/web/src/lib/lia-context/config/page-metadata.ts` | 2867 | No es generado; es una mega-registry manual de metadata y diagnostico, claramente propensa a drift |
| `apps/web/src/lib/nanobana/templates.ts` | 699 | Plantillas/datos grandes, razonable excluirlo del backlog estructural |

### 3. TDI operativo y TDI contextual real

Aqui es donde `docs/refactor-program.md` queda corto.

Lo que si respalda el documento:

- Ya no hay monolitos de `700-900` lineas dentro del criterio de backlog.
- Varias refactorizaciones historicas del documento si siguen presentes en el repo actual:
  - `apps/web/src/core/services/contentService.ts` hoy esta en `34` lineas
  - `apps/web/src/features/admin/components/VideoProviderSelector.tsx` hoy esta en `79` lineas
  - `apps/web/src/features/study-planner/prompts/study-planner.prompt.ts` hoy esta en `33` lineas
  - `apps/web/src/app/api/ai-chat/system-prompt.service.ts` hoy esta en `46` lineas

Lo que ya no respalda el documento:

- `npm run build --workspace=apps/web` pasa, pero Next reporta explicitamente `Skipping validation of types`.
- `tsc` global no esta "solo lento": hoy falla con una cascada de `TS6053` porque `apps/web/tsconfig.json` incluye `.next/types/**/*.ts` y el snapshot de `.next/types` esta desalineado con las rutas actuales.
- El repo sigue cargando deuda transversal alta:
  - `497` archivos `route.ts`
  - `1317` ocurrencias de `any`
  - `113` ocurrencias de `legacy`
  - `8165` hex hardcodeados
  - `125` marcadores `TODO/FIXME/XXX` reales

Mi juicio:

- Estructuralmente si hay base para decir que el repo ya bajo mucho frente al punto de partida.
- Operativamente no hay base seria para sostener `~8% operativo / ~12% contextual real`.
- Estimacion honesta actual:
  - `~12-14%` operativo
  - `~18-22%` contextual real

La razon principal es simple: el backlog de lineas bajo, pero la deuda sistemica todavia no.

## Cuanto spaghetti code queda realmente

Mi lectura actual es:

- El spaghetti ya no domina el repo como una masa de archivos de `800-1100` lineas.
- El problema actual esta mas concentrado en archivos de orquestacion, routes gordas, servicios puente legacy y componentes UI con demasiada mezcla de estado, vista, fetch, permisos y estilos.
- En otras palabras: menos "megabloques", pero todavia bastante "nudo de responsabilidades".

### Hotspots reales de aplicacion hoy

Top de archivos grandes de aplicacion, ya excluyendo generated/tests/templates:

| Archivo | Lineas | Lectura |
|---|---:|---|
| `apps/web/src/features/auth/actions/invitation.ts` | 672 | Tipado y mas ordenado que antes, pero demasiado ancho para un solo archivo |
| `apps/web/src/features/admin/components/AdminDashboard.tsx` | 660 | Componente de pagina grande, mezcla render, estado y decisiones de dominio |
| `apps/web/src/features/admin/components/AdminEditCompanyModal.tsx` | 647 | Modal grande, mezcla UI, validacion, flujos y estilos |
| `apps/web/src/lib/rrweb/session-recorder.ts` | 643 | Integracion tecnica compleja todavia concentrada |
| `apps/web/src/features/study-planner/components/hooks/useStudyPlannerCalendarLogic.ts` | 643 | Hook de orquestacion grande |
| `apps/web/src/features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` | 641 | Form complejo, demasiada responsabilidad para vista |
| `apps/web/src/features/business-panel/components/BusinessPanelDashboard.tsx` | 640 | Dashboard todavia pesado |
| `apps/web/src/features/business-panel/components/BusinessEditUserModal.tsx` | 633 | Modal denso en UI + reglas |
| `apps/web/src/features/admin/components/EditCommunityModal.tsx` | 625 | Modal grande con mezcla de concerns |
| `apps/web/src/features/business-panel/services/analytics/analytics-response.service.ts` | 624 | Servicio grande y acoplado a shape de respuesta |
| `apps/web/src/features/study-planner/types/user-context.types.ts` | 623 | Contrato excesivamente inflado; indica dominio sobredimensionado |
| `apps/web/src/features/study-planner/services/soflia-context.service.ts` | 621 | Orquestacion grande de contexto de planner |
| `apps/web/src/features/admin/components/CourseManagement/hooks/useCourseManagementLogic.ts` | 613 | Hook muy ancho |
| `apps/web/src/lib/auth/requireBusiness.ts` | 610 | Guardia de acceso con demasiadas variantes y carga transversal |
| `apps/web/src/features/admin/components/AddUserModal.tsx` | 609 | UI densa y ademas muy cargada de estilos inline |

### Spaghetti severo por mezcla de responsabilidades

Estos son los casos que mas chocan con `prompt_maestro.md:67-70`:

| Archivo | Motivo |
|---|---|
| `apps/web/src/features/courses/hooks/useLearnPageLogic.ts` (`522`) | Un solo hook concentra routing, estado de UI, LIA chat, tour, notas, player, swipe, progreso, layout y navegacion de lecciones. Bajo de `808`, pero sigue siendo un nudo de orquestacion. |
| `apps/web/src/app/api/courses/[slug]/learn-data/route.ts` (`557`) | El endpoint unifica auth, curso, traduccion, queries paralelas, cache, shape de response y metricas. Es util como agregador, pero esta demasiado gordo para una route. |
| `apps/web/src/features/auth/actions/invitation.ts` (`672`) | No es caos total, pero sigue violando responsabilidad unica: invita, valida, consume, revoca, lista, reenvia y maneja bulk invites en un mismo archivo server action. |
| `apps/web/src/features/study-planner/services/soflia-context.service.ts` (`621`) | Mezcla user profile, organizacion, cursos, calendario, deadlines y contexto del flujo en un solo servicio. |
| `apps/web/src/features/admin/services/adminPrompts.service.ts` (`546`) | Hace CRUD, stats, slugging, sanitizacion de input, acceso Supabase y mapeo de categorias/autores en un mismo servicio. |

### Spaghetti medio, mas por densidad de UI que por caos de dominio

| Archivo | Lectura |
|---|---|
| `apps/web/src/features/admin/components/AdminDashboard.tsx` | Todavia pesado para pagina contenedora |
| `apps/web/src/features/admin/components/AdminEditCompanyModal.tsx` | Modal muy grande, fuerte mezcla de presentacion y flujo |
| `apps/web/src/features/business-panel/components/BusinessPanelDashboard.tsx` | Dashboard de alto acoplamiento visual y de datos |
| `apps/web/src/features/admin/components/AddUserModal.tsx` | Mucha variacion visual, mucha condicion inline, demasiados tokens crudos |
| `apps/web/src/features/admin/components/EditCommunityModal.tsx` | Mezcla vista, validacion, opciones y estilos |

## Estado actual de prompts monoliticos

### Ya mejorados de verdad

| Archivo | Lineas | Lectura |
|---|---:|---|
| `apps/web/src/features/study-planner/prompts/study-planner.prompt.ts` | 33 | Ya es wrapper fino |
| `apps/web/src/features/study-planner/prompts/study-planner.prompt.template.ts` | 122 | Mucho mas controlado que antes |
| `apps/web/src/app/api/ai-chat/system-prompt.service.ts` | 46 | Claramente resuelto |

### Aun problematicos

| Archivo | Lineas | Senal de deuda |
|---|---:|---|
| `apps/web/src/app/api/lia/chat/system-prompt.service.ts` | 526 | Prompt gigante concatenado, un `TODO`, un `any`, mucho string literal incrustado, glosario y UI context mezclados con reglas del sistema |
| `apps/web/src/features/study-planner/prompts/study-planner.prompt.rules.ts` | 359 | Ya no es un monolito de 800 lineas, pero sigue siendo un bloque reglamentario grande y fragil |
| `apps/web/src/features/admin/services/adminPrompts.service.ts` | 546 | No es "prompt de sistema", pero si un monolito funcional del dominio de prompts |

Juicio:

- El problema de prompts ya no esta en `study-planner.prompt.ts`.
- El principal prompt monolitico actual es `apps/web/src/app/api/lia/chat/system-prompt.service.ts`.
- Ese archivo sigue violando `prompt_maestro.md:51`, `:55`, `:67`, `:68` y `:70`:
  - demasiados magic strings
  - demasiada complejidad accidental
  - bajo desacople
  - reglas, glosario, alcance, links y contexto de UI mezclados

## Logica muerta, semi-muerta o muy propensa a drift

### Casos claros

| Archivo o zona | Lectura |
|---|---|
| `apps/web/apps/web` y `apps/web/apps/web/apps/web` | Residuo claro dentro del workspace. No aporta al sistema productivo y si agrega ruido de mantenimiento. |
| `apps/web/tsconfig.json` -> `include: [".next/types/**/*.ts"]` | Artefactos de build contaminando el grafo de compilacion. Hoy esto rompe `tsc` con cientos de `TS6053`. No es codigo muerto, pero si deuda transversal de configuracion. |
| `apps/web/src/lib/lia-context/config/page-metadata.ts` (`2867`) | Registry manual enorme. No parece muerto, pero si altamente propenso a obsolescencia y duplicacion de conocimiento. |
| `apps/web/src/lib/lia/page-metadata.ts` (`436`) | Segunda fuente de metadata de paginas. Solapa intencion con la registry grande del contexto LIA. Hay senal de duplicacion conceptual. |

### Casos que ya no deberian seguir apareciendo como deuda principal

| Archivo | Estado actual |
|---|---|
| `apps/web/src/core/services/contentService.ts` | Ya no es hotspot. Quedo en `34` lineas y el documento acierta al no tratarlo como blob vivo. |
| `apps/web/src/features/admin/components/VideoProviderSelector.tsx` | Ya no es un monolito relevante. Hoy esta en `79` lineas. |

### TODOs reales

Conteo estricto actual: `125` marcadores `TODO/FIXME/XXX`.

Top actual:

| Archivo | Marcadores |
|---|---:|
| `apps/web/src/features/admin/components/AdminPendingCoursesPage.tsx` | 4 |
| `apps/web/src/features/courses/config/course-learn-tour.ts` | 4 |
| `apps/web/src/app/api/business/courses/[id]/purchase/route.ts` | 4 |
| `apps/web/src/app/downloads/components/DownloadsPageFeatures.tsx` | 3 |
| `apps/web/src/app/api/[orgSlug]/business/courses/[id]/purchase/route.ts` | 3 |
| `apps/web/src/app/api/lia/onboarding-chat/route.ts` | 3 |
| `apps/web/src/app/api/courses/[slug]/purchase/route.ts` | 3 |

Lectura:

- La deuda por `TODO` existe, pero ya no es el principal indicador del problema.
- El nucleo de la deuda real esta mas en acoplamiento, config, tipos y estilos que en comments pendientes.

## Hardcodes, magic values y hex inline

`prompt_maestro.md:51` se sigue incumpliendo de forma amplia.

Conteo actual de hex hardcodeados en `apps/web/src`: `8165`.

No todos pesan igual:

- `apps/web/src/app/globals.css` (`188`) es razonablemente una capa de estilos globales.
- `apps/web/src/features/admin/components/CourseManagement/courseManagementTheme.ts` (`138`) es un archivo de tema, o sea un lugar mas aceptable para centralizar color.

El problema real esta en componentes de producto que siguen cargando color inline:

| Archivo | Ocurrencias de hex | Lectura |
|---|---:|---|
| `apps/web/src/features/business-panel/components/BusinessSubscriptionPlans.tsx` | 192 | Muy cargado de tokens inline dentro del render |
| `apps/web/src/features/admin/components/AddUserModal.tsx` | 159 | Mucho hardcode visual dentro del componente |
| `apps/web/src/features/admin/components/AdminReportesPage.tsx` | 153 | Vista con colorimetria incrustada |
| `apps/web/src/features/admin/components/AdminUsersPage.tsx` | 136 | UI dependiente de hex crudo |
| `apps/web/src/features/admin/components/MaterialModal.tsx` | 133 | Estilo duro sin tokenizar |
| `apps/web/src/features/admin/components/EditWorkshopModal.tsx` | 117 | Mismo patron |
| `apps/web/src/features/admin/components/ViewReporteModal.tsx` | 116 | Mismo patron |
| `apps/web/src/features/admin/components/AddWorkshopModal.tsx` | 109 | Mismo patron |
| `apps/web/src/features/admin/components/ActivityModal.tsx` | 104 | Mismo patron |
| `apps/web/src/app/account-settings/page.tsx` | 100 | Demasiado color literal en pagina |

Ejemplo concreto:

- `apps/web/src/features/business-panel/components/BusinessSubscriptionPlans.tsx` tiene `192` hex y mezcla tokens como `#10B981`, `#0A2540`, `#00D4B3`, `#6C757D`, `#E9ECEF` directamente en `className`.

Juicio:

- La centralizacion de color avanzo en algunas zonas.
- Pero el admin/business UI sigue muy lejos de un sistema de tokens consistente.

## Deuda legacy transversal

Conteo actual de ocurrencias `legacy`: `113`.

Centro de gravedad:

| Archivo | Ocurrencias | Lectura |
|---|---:|---|
| `apps/web/src/features/auth/services/session.service.ts` | 30 | El sistema de sesion sigue siendo un puente entre mundo nuevo y mundo legacy |
| `apps/web/src/features/auth/services/session-legacy.service.ts` | 21 | La compatibilidad sigue viva y visible |
| `apps/web/src/features/auth/services/auth-session.service.ts` | 13 | Otro seam de transicion |
| `apps/web/src/features/auth/actions/login.ts` | 6 | El flujo aun referencia compatibilidad |

Interpretacion:

- La fuga `server-only` grande ya no esta activa: el build pasa y no reproduje el leak anterior.
- Pero la deuda legacy principal sigue en auth/session.
- Esa deuda pesa mas que varios hotspots de lineas, porque atraviesa rutas, cookies, refresh tokens y compatibilidad antigua.

## Type debt, contratos flojos y estado operativo real

### `any`

Conteo actual de `any`: `1317`.

Principales focos:

| Archivo | Ocurrencias de `any` |
|---|---:|
| `apps/web/src/features/instructor/components/InstructorCourseManagement/InstructorStatsTab.tsx` | 57 |
| `apps/web/src/lib/analytics/lia-logger.ts` | 41 |
| `apps/web/src/app/api/courses/[slug]/learn-data/route.ts` | 25 |
| `apps/web/src/features/business-panel/services/report-data/outcome-reports.service.ts` | 24 |
| `apps/web/src/features/notifications/services/auto-notifications.service.ts` | 22 |
| `apps/web/src/features/courses/services/course.service.ts` | 20 |
| `apps/web/src/lib/courseDiff.ts` | 20 |

### Routes gordas

Cantidad total de `route.ts` en `apps/web/src/app/api`: `497`.

Top actual:

| Archivo | Lineas |
|---|---:|
| `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts` | 590 |
| `apps/web/src/app/api/courses/[slug]/learn-data/route.ts` | 557 |
| `apps/web/src/app/api/study-planner/events/[id]/route.ts` | 550 |
| `apps/web/src/app/api/communities/[slug]/posts/route.ts` | 546 |
| `apps/web/src/app/api/ai-directory/generate-nanobana/route.ts` | 544 |
| `apps/web/src/app/api/study-planner/calendar/sync-sessions/route.ts` | 543 |
| `apps/web/src/app/api/study-planner/events/route.ts` | 528 |
| `apps/web/src/app/api/lia/chat/route.ts` | 508 |
| `apps/web/src/app/api/ai-chat/route.ts` | 501 |
| `apps/web/src/app/api/study-planner/generate-plan/route.ts` | 489 |

Lectura:

- Hay demasiada logica de aplicacion asentada todavia en controllers de route.
- Esto contradice directamente el espiritu de `prompt_maestro.md:68-70`.

### Build y type-check

Estado real hoy:

- `npm run build --workspace=apps/web`: pasa
- Pero Next imprime `Skipping validation of types`
- El build ademas sigue mostrando varios `DYNAMIC_SERVER_USAGE` por rutas que usan `cookies`
- `tsc` global falla con `TS6053` porque `apps/web/tsconfig.json` incluye `.next/types/**/*.ts` y el snapshot actual de `.next/types` esta roto/desalineado

Dato importante:

- En `apps/web/.next/types` existen `577` archivos, pero aun asi `tsc` exige muchos paths que no estan presentes.
- Eso significa que el type-check global actual no es una senal fiable de salud del codigo; hoy esta contaminado por artefactos de build.

## Archivos que incumplen mas claramente `prompt_maestro.md`

### Contra `alta cohesion / bajo acoplamiento / responsabilidad unica`

- `apps/web/src/features/courses/hooks/useLearnPageLogic.ts`
- `apps/web/src/features/auth/actions/invitation.ts`
- `apps/web/src/features/study-planner/services/soflia-context.service.ts`
- `apps/web/src/features/admin/services/adminPrompts.service.ts`
- `apps/web/src/app/api/courses/[slug]/learn-data/route.ts`
- `apps/web/src/app/api/study-planner/events/route.ts`
- `apps/web/src/app/api/study-planner/events/[id]/route.ts`

### Contra `no hardcodes / no magic values`

- `apps/web/src/features/business-panel/components/BusinessSubscriptionPlans.tsx`
- `apps/web/src/features/admin/components/AddUserModal.tsx`
- `apps/web/src/features/admin/components/AdminReportesPage.tsx`
- `apps/web/src/features/admin/components/AdminUsersPage.tsx`
- `apps/web/src/features/admin/components/MaterialModal.tsx`

### Contra `no complejidad accidental`

- `apps/web/src/app/api/lia/chat/system-prompt.service.ts`
- `apps/web/src/lib/lia-context/config/page-metadata.ts`
- `apps/web/src/lib/lia/page-metadata.ts`
- `apps/web/src/features/auth/services/session.service.ts`
- `apps/web/src/app/api/courses/[slug]/learn-data/route.ts`

### Contra `no pongas logica critica unicamente del lado cliente`

No veo hoy una fuga tan critica como la anterior de `server-only`, pero si hay hooks y componentes cliente que siguen cargando demasiada orquestacion:

- `apps/web/src/features/courses/hooks/useLearnPageLogic.ts`
- `apps/web/src/features/admin/components/*` y `apps/web/src/features/business-panel/components/*` en varias pantallas grandes

El problema aqui es menos de seguridad inmediata y mas de fragilidad de mantenimiento.

## Conclusiones

### Lo que si es cierto del `refactor-program`

- El backlog estructural bajo de verdad.
- Varias refactorizaciones historicas del documento siguen presentes y verificables.
- Ya no es correcto describir el repo como dominado por blobs de `800-1100` lineas dentro del criterio principal.

### Lo que ya no es cierto, o queda corto

- El TDI `~8% operativo / ~12% contextual real` no esta respaldado por el estado operativo del workspace.
- El type-check global no esta sano.
- La deuda de auth/session, routes gordas, metadata manual, prompts grandes y hardcodes visuales sigue siendo demasiado alta para un TDI real tan bajo.

### Mi veredicto final

- `docs/refactor-program.md` es hoy una narrativa estructural razonablemente util.
- Ya no es un reflejo suficiente del estado tecnico integral del sistema.
- El repo mejoro mucho en "tamano de blobs", pero sigue cargando deuda sistemica seria en:
  - auth/session legacy
  - routes de Next demasiado gordas
  - hooks de orquestacion cliente
  - prompts grandes del dominio LIA
  - metadata manual duplicada
  - hardcodes visuales masivos
  - type-check contaminado por `.next/types`

## Prioridades sugeridas si esto se convierte en backlog real

1. Corregir `apps/web/tsconfig.json` y el manejo de `.next/types` para que `tsc` vuelva a ser una senal util.
2. Partir `useLearnPageLogic.ts`, `invitation.ts`, `soflia-context.service.ts` y `adminPrompts.service.ts`.
3. Reducir `app/api/lia/chat/system-prompt.service.ts` a piezas declarativas y templates pequenos.
4. Eliminar o regenerar desde una fuente unica `lib/lia-context/config/page-metadata.ts` y `lib/lia/page-metadata.ts`.
5. Tokenizar visualmente `business-panel` y `admin` empezando por `BusinessSubscriptionPlans.tsx`, `AddUserModal.tsx`, `AdminUsersPage.tsx` y `AdminReportesPage.tsx`.
6. Seguir cerrando el seam `legacy` de auth/session hasta que `session.service.ts` deje de ser un puente doble.
