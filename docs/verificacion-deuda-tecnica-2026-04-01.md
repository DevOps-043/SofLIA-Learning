# Verificacion Deuda Tecnica 2026-04-01

> Corte del worktree: 2026-04-01
> Referencias: `prompt_maestro.md`, `docs/refactor-program.md`
> Alcance: monorepo actual en disco, con foco principal en `apps/web/src`

## Veredicto Ejecutivo

La direccion general de `docs/refactor-program.md` es correcta: el repo ya no esta en el escenario de marzo con monolitos de miles de lineas por todos lados, y varios splits importantes si se reflejan en el worktree actual. Pero los **numeros finos del snapshot vigente ya no son confiables**.

Hallazgo principal:

- El documento acierta en que ya no hay archivos `>=900` lineas en el backlog medido.
- El documento **sobrestima** el numero de archivos grandes actuales.
- El documento **ya no refleja bien** varios hotspots reales.
- El documento **se queda corto** en deuda transversal no capturada por line-count: build roto, type-check que no termina, frontera cliente/servidor rota, dualidad `legacy` en auth, mocks persistentes, prompts monoliticos y drift fuerte del design system.

Conclusion operativa:

- `~18% operativo / ~22% real` es **optimista** para el estado actual.
- Una lectura mas honesta, alineada con `prompt_maestro.md`, hoy se parece mas a:
  - **TDI operativo del backlog visible:** `~24% - ~28%`
  - **TDI contextual real del sistema:** `~30% - ~38%`

Eso no significa que el repo este "tan mal como antes"; significa que el documento actual subestima deuda transversal que no desaparece por bajar lineas en ciertos componentes.

## Metodologia

### Criterio de medicion usado

Se midio `apps/web/src/**/*.ts` y `apps/web/src/**/*.tsx` con `git ls-files`, excluyendo:

- `__tests__/`
- `*.test.*`
- `*.spec.*`
- `apps/web/src/lib/supabase/types.ts`
- `apps/web/src/lib/lia-context/config/page-metadata.ts`
- `apps/web/src/lib/nanobana/templates.ts`

Ese criterio replica la intencion del snapshot del programa de refactor.

### Validaciones adicionales ejecutadas

- `npm.cmd run build --workspace=apps/web`
  - **Resultado:** falla
- `npm.cmd run type-check --workspace=apps/web`
  - **Resultado:** no termina ni en 5 minutos

## Medicion Real Del Worktree

### Foto estructural actual de `apps/web/src`

| Umbral | `refactor-program.md` | Medicion actual | Delta |
|---|---:|---:|---:|
| `>=900` | 0 | 0 | 0 |
| `>=800` | 3 | 0 | -3 |
| `>=700` | 27 | 7 | -20 |
| `>=500` | 114 | 87 | -27 |
| `>=300` | 356 | 275 | -81 |

Esto significa que el documento **si captura una mejora real respecto a los monolitos historicos**, pero el snapshot numerico de 2026-04-01 **esta desfasado** frente al repo actual.

### Hotspots reales actuales

Top 15 medidos hoy bajo el criterio anterior:

| Archivo | Lineas |
|---|---:|
| `apps/web/src/app/conocer-lia/page.tsx` | 771 |
| `apps/web/src/features/admin/components/AddCommunityModal.tsx` | 742 |
| `apps/web/src/features/admin/components/VideoProviderSelector.tsx` | 735 |
| `apps/web/src/core/services/contentService.ts` | 730 |
| `apps/web/src/features/admin/components/AdminWorkshopsPage.tsx` | 713 |
| `apps/web/src/app/downloads/page.tsx` | 711 |
| `apps/web/src/features/courses/hooks/useLearnPageLogic.ts` | 707 |
| `apps/web/src/features/admin/components/AdminCreateCompanyModal.tsx` | 697 |
| `apps/web/src/features/business-panel/components/BrandingTab.tsx` | 696 |
| `apps/web/src/core/components/LiaSidePanel/hooks/useLiaSidePanelLogic.ts` | 694 |
| `apps/web/src/features/communities/components/PostAttachment/PostAttachment.tsx` | 688 |
| `apps/web/src/features/admin/components/EditUserModal.tsx` | 687 |
| `apps/web/src/core/components/ContextualVoiceGuide/hooks/useContextualVoiceGuideLogic.ts` | 673 |
| `apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx` | 672 |
| `apps/web/src/features/admin/components/LessonModal.tsx` | 669 |

### Drift claro del backlog documentado

Archivos que el documento sigue marcando, pero con lineas hoy menores que las reportadas:

| Archivo | Documento | Actual | Delta |
|---|---:|---:|---:|
| `useLearnPageLogic.ts` | 808 | 707 | -101 |
| `app/conocer-lia/page.tsx` | 807 | 771 | -36 |
| `VideoProviderSelector.tsx` | 797 | 735 | -62 |
| `useLiaSidePanelLogic.ts` | 790 | 694 en el ranking simple, 384 en el hook real actual leido | backlog desalineado |
| `business-user/dashboard/page.tsx` | 786 | 723 | -63 |
| `useContextualVoiceGuideLogic.ts` | 785 | 673 | -112 |
| `app/courses/[slug]/learn/page.tsx` | 778 | 723 | -55 |
| `AddCommunityModal.tsx` | 774 | 742 | -32 |
| `app/downloads/page.tsx` | 774 | 711 | -63 |
| `AdminWorkshopsPage.tsx` | 755 | 713 | -42 |
| `BrandingTab.tsx` | 740 | 696 | -44 |
| `contentService.ts` | 730 | 730 | 0 |

Observacion importante:

- `useLiaSidePanelLogic.ts` ya no tiene el peso que el documento le atribuye como hotspot P1. El hook que esta en disco y se leyo hoy mide bastante menos y solo tiene dos importadores.
- Hay hotspots nuevos que **no aparecen** en el programa: `AdminCreateCompanyModal.tsx`, `PostAttachment.tsx`, `EditUserModal.tsx`, formularios de auth organizacional, `rrweb/session-recorder.ts`, `businessUsers.server.service.ts`.

## Donde Sigue Habiendo Codigo Spaghetti

## 1. Hooks y paginas orquestadoras

### `apps/web/src/features/courses/hooks/useLearnPageLogic.ts`

Sigue siendo el ejemplo mas claro de hook orquestador con demasiadas responsabilidades:

- 707 lineas
- 8 `useState`
- 11 `useEffect`
- 4 `useCallback`
- 3 `useMemo`
- 4 `fetch()`
- acceso directo a DOM (`document.querySelector`) y `window`
- usa `any` en el contrato de `sendLiaMessage`

Evidencia concreta:

- `courseContext?: any` y `workshopContext?: any` en lineas 56-57
- `document.querySelector(...)` en lineas 102 y 149
- listeners y lecturas de viewport con `window` en lineas 298-326

Diagnostico:

- Mezcla UI state, navegacion, comportamiento mobile, reproduccion de video, LIA, notas, analytics de comportamiento y coordinacion de subhooks.
- Viola `prompt_maestro.md` en separacion de responsabilidades y control de efectos secundarios.

### `apps/web/src/app/[orgSlug]/business-user/dashboard/page.tsx`

Aunque ya no es un monstruo de 786 lineas, sigue mezclando:

- fetch de organizacion
- fetch del dashboard
- theming multi-tenant
- tour/onboarding
- saludos por hora
- transformacion de estilos
- lazy loading de widgets

No es "spaghetti extremo", pero sigue siendo **page-controller** en vez de page-wrapper.

### `apps/web/src/app/courses/[slug]/learn/page.tsx`

Bajo bastante, pero aun:

- extrae un contrato gigante desde `useLearnPageLogic`
- sigue cargando demasiada orquestacion en un solo return tree
- mantiene colores inline y varias responsabilidades de modal/rating/tour/layout

Aqui la deuda ya no es brutal, pero el split quedo a medio camino.

## 2. UI pesada con logica incrustada

### `apps/web/src/features/admin/components/VideoProviderSelector.tsx`

Sigue mezclando:

- seleccion de proveedor
- deteccion de duracion
- upload a backend
- preview del video
- manejo de errores
- estado drag-and-drop
- manejo de `document.createElement('video')`

Evidencia:

- 735 lineas
- 5 `useState`
- 3 `fetch()`
- `createClient()` cliente
- uso directo de `document`

Esto contradice la regla de no meter logica de negocio/infra en el componente de UI.

### `apps/web/src/features/admin/components/AddCommunityModal.tsx`

Problemas:

- 742 lineas
- `onSave: (communityData: any) => Promise<void>`
- subcomponentes visuales y logica de formulario viven en el mismo archivo
- palette completa hardcodeada dentro del componente

### `apps/web/src/features/admin/components/AdminCreateCompanyModal.tsx`

Problemas:

- 697 lineas
- upload, tabs, validaciones, slugify, branding y previsualizacion en un solo modulo
- uso de `alert()` y `console.error()`
- demasiada configuracion hardcodeada de colores, planes y defaults

## 3. Servicios y rutas gordas

### Fat routes activas en Next

Hoy existen **497** `route.ts` en `apps/web/src/app/api`. Eso no es deuda por si mismo, pero varias siguen gordas:

| Ruta | Lineas |
|---|---:|
| `study-planner/calendar/events/route.ts` | 593 |
| `courses/[slug]/lessons/[lessonId]/progress/route.ts` | 590 |
| `courses/[slug]/learn-data/route.ts` | 557 |
| `study-planner/events/[id]/route.ts` | 550 |
| `communities/[slug]/posts/route.ts` | 546 |
| `ai-directory/generate-nanobana/route.ts` | 544 |
| `study-planner/calendar/sync-sessions/route.ts` | 543 |
| `study-planner/events/route.ts` | 528 |
| `lia/chat/route.ts` | 508 |
| `ai-chat/route.ts` | 501 |

Ejemplos claros:

- `apps/web/src/app/api/study-planner/calendar/events/route.ts`
  - crea cliente admin con service role
  - valida auth
  - refresca tokens
  - sincroniza eventos borrados
  - consulta integraciones
  - filtra eventos huerfanos
  - retorna multiples razones de error
  - ademas usa `any`

- `apps/web/src/app/api/courses/[slug]/learn-data/route.ts`
  - centraliza 8 cargas en un endpoint
  - la optimizacion es valida, pero la route hoy tambien actua como query orchestrator, mapper, traductor de contenido y empaquetador de contrato
  - usa `any` en helpers internos

- `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts`
  - autentica
  - busca o crea enrollment
  - valida orden de lecciones
  - valida quizzes requeridos
  - calcula progreso
  - toca certificados
  - persiste estado

Esto sigue violando el principio del prompt maestro de no incrustar demasiada logica de negocio en handlers.

### `apps/web/src/core/services/contentService.ts`

Este archivo no es "spaghetti algoritimico", pero si es deuda estructural:

- 730 lineas
- el archivo se presenta como servicio
- en realidad contiene **mocks gigantes** de contenido comercial
- mantiene `TODO: Reemplazar con llamada real a la API`

Evidencia:

- mock principal desde linea 3
- mock business desde linea 84
- TODO en lineas 669 y 710
- sigue siendo consumido por `app/business/page.tsx` y `app/business/plans/page.tsx`

Diagnostico:

- es un CMS hardcodeado disfrazado de servicio
- viola SRP, configuracion centralizada y contratos claros

## 4. Auth y sesion legacy

La mayor deuda transversal hoy ya no es el tamano de un componente: es la coexistencia del sistema nuevo y el sistema `legacy`.

### `apps/web/src/features/auth/services/session.service.ts`

Evidencia:

- `createLegacySession()` desde linea 20
- `legacySession: any` en linea 38
- `getCurrentUser(): Promise<any | null>` en linea 64
- fallback a `user_session` desde linea 121
- cast `(user as any)` para `is_banned` en linea 202

El archivo contiene:

- manejo de cookies
- refresh tokens
- fallback legacy
- cache
- lookup de usuario
- revocacion
- manejo de errores de Next

Ademas, `legacy` aparece 25 veces solo en este archivo. Esto es deuda tecnica real, no historica.

Diagnostico:

- el problema ya no es solo legibilidad: es acoplamiento entre autenticacion, persistencia, cookies, compatibilidad y comportamiento de runtime.

## Logica Muerta, Arrastre Legacy y Archivos Sospechosos

## 1. Duplicados / restos de estructura

### `apps/web/apps/web/` y `apps/web/apps/web/apps/web/`

Se detectaron package manifests anidados:

- `apps/web/apps/web/package.json`
- `apps/web/apps/web/apps/web/package.json`

No forman parte del workspace principal y huelen a residuo historico de nesting o copia accidental. Aunque no rompan el runtime directamente, si:

- ensucian el repo
- elevan ruido cognitivo
- vuelven menos confiable cualquier herramienta de barrido

## 2. Flujos marcados como obsoletos pero aun vivos

### Servicios study planner con `@deprecated`

Casos encontrados:

- `apps/web/src/features/study-planner/services/user-context.service.ts:97`
- `apps/web/src/features/study-planner/services/user-preferences.service.ts:88`
- `apps/web/src/features/study-planner/services/user-course-assignments.service.ts:320-323`
- `apps/web/src/core/hooks/useLiaChat.ts`

Problema:

- no es solo documentacion historica; parte de estos metodos siguen siendo llamados desde el orquestador principal (`getFullUserContext` sigue invocando `getLearningRoutes`).

Eso ya es deuda de comportamiento: codigo declarado muerto que aun participa en flujos activos.

## 3. Prompt-as-code sobredimensionado

### `apps/web/src/features/study-planner/prompts/study-planner.prompt.ts`

Problemas:

- 660 lineas
- mezcla reglas de negocio, UX conversacional, fechas, holidays, validaciones y respuestas anti-bucle
- contiene contenido hardcodeado altamente mutable
- expone drift documental: sigue diciendo "Gemini 3 Flash" en linea 46
- contiene demasiadas "REGLA INMUTABLE" y cabeceras decorativas que dificultan mantenimiento

No es codigo muerto, pero si deuda fuerte de mantenibilidad. Si cambia una regla del planner, hoy el blast radius es alto y el archivo invita a regresiones por edicion manual.

## 4. Mocks persistentes

### `apps/web/src/core/services/contentService.ts`

Ya descrito arriba: sigue siendo un mock estructuralmente permanente.

## Violaciones Directas A `prompt_maestro.md`

## 1. Mezcla de responsabilidades

Violaciones claras:

- `useLearnPageLogic.ts`
- `VideoProviderSelector.tsx`
- `AddCommunityModal.tsx`
- `AdminCreateCompanyModal.tsx`
- varias `route.ts` de study planner y cursos
- `session.service.ts`

## 2. Logica de negocio en UI o handlers

Ejemplos:

- validacion de progreso y secuencia de lecciones en `lessons/[lessonId]/progress/route.ts`
- upload + deteccion de metadata de video en `VideoProviderSelector.tsx`
- organizacion + theming + onboarding + fetch en `business-user/dashboard/page.tsx`

## 3. Hardcoding / magic values

Hallazgos medidos:

- `4965` ocurrencias de hex colors
- `415` archivos fuente con al menos un hex hardcodeado

Esto contradice directamente:

- configuracion centralizada
- claridad de tokens
- bajo acoplamiento con el design system

Archivos especialmente cargados:

- `CourseManagementStudentDetailsModal.tsx`
- `BusinessSubscriptionPlans.tsx`
- `AdminWorkshopsPage.tsx`
- `EditUserModal.tsx`
- `AdminUsersPage.tsx`
- `app/downloads/page.tsx`

## 4. Tipado laxo

Hallazgos medidos en archivos fuente productivos:

- `1260` ocurrencias de `as any` o `: any`

Top offenders:

- `apps/web/src/lib/analytics/lia-logger.ts`
- `apps/web/src/features/instructor/components/InstructorCourseManagement/InstructorStatsTab.tsx`
- `apps/web/src/features/business-panel/services/report-data/outcome-reports.service.ts`
- `apps/web/src/app/api/courses/[slug]/learn-data/route.ts`
- `apps/web/src/features/courses/services/course.service.ts`
- `apps/web/src/features/auth/services/session.service.ts`

## 5. TODO/FIXME reales

Hallazgos:

- `70` ocurrencias
- `45` archivos afectados

Esto no es catastrofico por si solo, pero si invalida cualquier lectura de "deuda ya casi cerrada".

## 6. Frontera cliente/servidor rota

Caso concreto que hoy rompe build:

- `AdminCompaniesFilters.tsx` importa desde `../../services/admin-companies` en linea 9
- `admin-companies/index.ts` reexporta `admin-companies-assignments.service` desde linea 1
- ese servicio importa `../../../../lib/supabase/server` en linea 1
- `lib/supabase/server.ts` marca `import 'server-only'` en linea 1 y `next/headers` en linea 4

Resultado:

- `npm run build --workspace=apps/web` falla hoy mismo por fuga de modulo server-only a arbol cliente

Este es un incumplimiento directo de separacion de capas y de "no romper comportamiento existente".

## Estado Operativo Real

## Build

`npm run build --workspace=apps/web` falla con error de importacion server-only:

- modulo afectado: `apps/web/src/lib/supabase/server.ts`
- traza de importacion: `admin-companies-assignments.service.ts` -> `admin-companies/index.ts` -> `AdminCompaniesFilters.tsx`

## Type-check

`npm run type-check --workspace=apps/web` no termina ni en 5 minutos.

Aunque no se capturo un stack final de errores, esto ya es una senal operativa negativa:

- el chequeo estatico no es una red de seguridad rapida
- validar lotes pequenos sigue siendo costoso
- el TDI contextual real no puede venderse como sub-20 mientras esto siga asi

## Que Tan Ciertos Son Los Numeros De `refactor-program.md`

## Si son ciertos

- La reduccion historica de monolitos grandes es real.
- Ya no aparecen archivos `>=900` lineas bajo el backlog medido.
- `contentService.ts` sigue siendo hotspot real.
- La deuda transversal de build/type-check/auth legacy sigue abierta.
- El sistema ya no esta ni remotamente cerca del `66%` historico.

## Son parcialmente ciertos

- El backlog por line-count sigue existiendo, pero con menos peso del que dice la tabla.
- Algunas prioridades siguen siendo buenas (`useLearnPageLogic.ts`, `conocer-lia/page.tsx`, `VideoProviderSelector.tsx`, `AddCommunityModal.tsx`, `AdminWorkshopsPage.tsx`).
- El discurso de "no hacer big bang rewrite" sigue siendo valido.

## Ya no son ciertos

- `3` archivos `>=800`
- `27` archivos `>=700`
- `114` archivos `>=500`
- `356` archivos `>=300`
- varias lineas individuales de hotspots
- la centralidad de `useLiaSidePanelLogic.ts` como P1 estructural

## Mi lectura de confianza por numero

| Claim de `refactor-program.md` | Veredicto |
|---|---|
| Snapshot de thresholds del 2026-04-01 | **Falso / desactualizado** |
| Hotspot list del top backlog | **Parcialmente cierto** |
| "No estamos por debajo de 20% real" | **Cierto** |
| `~18% operativo` | **Optimista** |
| `~22% real` | **Optimista** |

## Recomendacion De Priorizacion Real

Orden sugerido, alineado con `prompt_maestro.md`:

1. **Arreglar la frontera cliente/servidor rota**
   - `admin-companies/index.ts` no debe reexportar servicios server-only hacia componentes `use client`.
2. **Atacar los hooks/pages con un solo importador**
   - `useLearnPageLogic.ts`
   - `business-user/dashboard/page.tsx`
   - `conocer-lia/page.tsx`
3. **Reducir deuda legacy en auth**
   - aislar o matar fallback `user_session`
   - sacar `any` del `SessionService`
4. **Bajar fat routes de planner/cursos**
   - `study-planner/calendar/events/route.ts`
   - `courses/[slug]/learn-data/route.ts`
   - `lessons/[lessonId]/progress/route.ts`
5. **Eliminar falsos servicios y residuos**
   - reemplazar `contentService.ts` por fuente real o moverlo a `seed/static-content`
   - limpiar `apps/web/apps/web/**`
6. **Poner una medicion reproducible en CI**
   - script fijo para thresholds
   - gate de build
   - gate de type-check
   - reporte de `any`, `TODO`, `legacy`, hex hardcodeado

## Resumen Final

El proyecto **si mejoro** respecto a los monolitos historicos, pero el documento `docs/refactor-program.md` ya no es un espejo fiel del estado del repo. Hoy sirve como narrativa de progreso, no como snapshot exacto.

La deuda tecnica mas peligrosa ya no esta solo en "archivos muy largos". Esta en:

- deuda legacy de auth
- handlers todavia gordos en `app/api`
- hardcoding masivo visual y de prompts
- tipado laxo
- build roto por capas mal separadas
- type-check sin tiempo de respuesta razonable

Si se quiere que el programa siga siendo util, hay que recalibrarlo con medicion automatica reproducible. Sin eso, el backlog seguira dando una falsa sensacion de precision.
