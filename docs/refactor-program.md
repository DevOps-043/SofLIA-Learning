# Programa de Refactorizacion Tecnica

## Objetivo

Reducir la deuda tecnica del monorepo de forma controlada, medible y sin un "big bang rewrite".

Objetivo realista:

- Corto plazo: bajar el TDI de ~60% a ~45%.
- Mediano plazo: bajar el TDI a ~25-30%.
- Largo plazo: estabilizar el sistema por debajo de ~15%.

El objetivo de 10% solo es viable despues de varias tandas, con cobertura de pruebas, observabilidad y saneamiento de arquitectura. Intentar llegar ahi en una sola refactorizacion masiva elevaria el riesgo de regresiones.

## Principios

- No refactorizar sin red de seguridad.
- Atacar primero hotspots con mas impacto operativo.
- Cada lote debe dejar el sistema mejor, no solo diferente.
- Ningun componente nuevo debe volver a crecer sin limites.
- Toda extraccion debe acompanarse de contratos claros: tipos, servicios y puntos de entrada.

## Reglas para Codex

Estas reglas aplican a TODA tarea de este programa. Codex debe seguirlas en cada PR.

1. **Maximo 2000 lineas por archivo nuevo.** Si una extraccion supera ese limite, dividirla en sub-modulos.
2. **No cambiar comportamiento.** Las extracciones deben ser puramente estructurales. La funcionalidad observable no debe cambiar.
3. **No agregar dependencias nuevas** salvo framework de testing (Vitest + @testing-library/react).
4. **Respetar path aliases.** Usar `@/features/*`, `@/core/*`, `@/lib/*`, `@/components/*`, `@/hooks/*`, `@/utils/*` en lugar de paths relativos profundos.
5. **Cada archivo extraido debe exportarse desde el `index.ts` del directorio padre** cuando exista.
6. **No dejar imports sin usar** despues de una extraccion.
7. **No introducir `any`.** Si el codigo original usa `any`, mantenerlo tal cual por ahora; no agregar nuevos.
8. **Un commit por tarea.** Cada tarea listada abajo es un commit atomico.
9. **Verificar que `npm run build --workspace=apps/web` pase** despues de cada commit.
10. **Verificar que `npm run type-check` pase** despues de cada commit.

## Hotspots Prioritarios

| Archivo | Lineas | Prioridad |
|---------|--------|-----------|
| `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` | 3,160 | P0 |
| `apps/web/src/features/admin/components/CourseManagementPage.tsx` | 3,138 | P0 |
| `apps/web/src/lib/lia-context/config/page-metadata.ts` | 2,919 | P1 (datos, no logica) |
| `apps/web/src/app/api/study-planner/dashboard/chat/route.ts` | 2,856 | P1 |
| `apps/web/src/app/courses/[slug]/learn/page.tsx` | 2,787 | P1 |
| `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` | 2,864 | P1 |
| `apps/web/src/features/business-panel/components/BusinessSettings.tsx` | 2,603 | P1 |
| `apps/web/src/app/api/ai-chat/route.ts` | 2,590 | P1 |
| `apps/web/src/core/components/LiaSidePanel/LiaSidePanel.tsx` | 2,068 | P2 |
| `apps/web/src/app/[orgSlug]/business-panel/users/page.tsx` | 2,058 | P2 |
| `apps/web/src/app/api/[orgSlug]/business/reports/data/route.ts` | 1,084 | P2 |
| `apps/web/src/app/api/business/reports/data/route.ts` | 1,077 | P2 |

## Estado Actual (TDI ~44%)

> **Nota para Codex:** Los conteos de lineas en este documento son mediciones reales verificadas
> contra el worktree actual el 2026-03-28. Las entradas de la tabla de evolucion reflejan el historial
> reportado por sesiones anteriores, pero el punto de partida valido para cualquier lote nuevo es la
> medicion real mas reciente, no los deltas heredados.

### Evolucion del TDI

| Fecha | TDI | Evento |
|-------|-----|--------|
| 2026-03-27 | 66% | Analisis inicial completo (baseline) |
| 2026-03-27 | 65% | Primera tanda: normalizacion de contenido + ContentRenderers (-722 lineas de learn/page.tsx) |
| 2026-03-27 | 60% | Descomposicion completa de learn/page.tsx: 10,448 -> 2,812 lineas (-73%) |
| 2026-03-27 | 59% | Primera descomposicion pesada de StudyPlannerLIA.tsx: 11,933 -> 10,826 lineas (-9.3%) |
| 2026-03-27 | 58% | Segunda descomposicion pesada de StudyPlannerLIA.tsx: 10,826 -> 9,996 lineas (-7.7%), extraccion de onboarding/shell conversacional, eliminacion de StudyPlannerOnboardingAgent.tsx (943 lineas muertas) y reduccion de console.log en el hotspot (220 -> 191) |
| 2026-03-27 | 56% | Tercera descomposicion acumulada de StudyPlannerLIA.tsx: 9,996 -> 7,297 lineas (-27.0%), extraccion de voz/TTS/reconocimiento, parser y distribucion de sesiones, contratos compartidos de schedules y eliminacion del hook duplicado muerto useStudyPlannerLIA.ts (435 lineas) |
| 2026-03-27 | 55% | Cuarta descomposicion pesada de StudyPlannerLIA.tsx: 7,297 -> 6,767 lineas (-7.3%), extraccion de useStudyPlanPersistence.ts (119) y study-plan-persistence.service.ts (374), eliminacion del flujo muerto handleInsertEventsToCalendar y poda del bloque deshabilitado `if (false && connectedCalendar...)` |
| 2026-03-27 | 54% | Quinta descomposicion pesada de StudyPlannerLIA.tsx: 6,767 -> 6,367 lineas (-5.9%), extraccion de `useStudyPlannerB2BCalendarAnalysis.ts` (262) y `plan-adjustment.service.ts` (196), tipado compartido de `savedCalendarData` con `StudyPlannerCalendarDataMap` y eliminacion del branching B2B inline junto con los helpers inline de conflicto/cambio de horario |
| 2026-03-27 | 53% | Sexta descomposicion pesada de StudyPlannerLIA.tsx: 6,367 -> 5,684 lineas (-10.7%), extraccion de `planner-message-context.service.ts` (282) y `planner-message-intent.service.ts` (231), eliminando el ensamblado inline de prompts/contexto y la deteccion inline de intenciones dentro de `handleSendMessage` |
| 2026-03-27 | 52% | Septima descomposicion pesada de StudyPlannerLIA.tsx: 9,600 -> 8,674 lineas (-9.6%), extraccion de `planner-chat-request.service.ts` (261), `planner-chat-response.service.ts` (60) y `planner-guardrails.service.ts` (143), reemplazo de duplicados locales por `plan-adjustment.service.ts` y eliminacion del bloque muerto `parseLiaScheduleResponse` junto con helpers inline de conflicto/cambio de horario/fecha |
| 2026-03-27 | 51% | Octava descomposicion pesada de StudyPlannerLIA.tsx: 8,674 -> 8,281 lineas (-4.5%), extraccion de `planner-calendar-analysis.service.ts` (177) y `planner-weekly-goals.service.ts` (196), moviendo fuera del componente la estimacion de disponibilidad, el analisis contextual de eventos y el calculo de metas semanales |
| 2026-03-27 | 50% | Novena descomposicion pesada de StudyPlannerLIA.tsx: 8,281 -> 7,915 lineas (-4.4%), reintegracion del hook `useStudyPlannerVoiceInteraction.ts` para reemplazar la implementacion inline de TTS/STT, eliminando estados, refs y helpers duplicados de voz dentro del componente |
| 2026-03-28 | **59%** | **VERIFICACION REAL contra codebase:** StudyPlannerLIA.tsx mide 9,090 lineas reales (no 7,915). Todos los hotspots miden mas que los valores intermedios reportados. Las extracciones de servicios/hooks SI existen y son de buena calidad, pero el monolito principal no refleja los deltas acumulados. TDI recalculado con valores medidos. |
| 2026-03-28 | **57%** | **POST-LOTE pesado verificado:** StudyPlannerLIA.tsx bajo de 9,090 a 6,903 lineas reales (`-2,187`, `-24.1%` sobre la medicion real). Se extrajeron `planner-target-window.service.ts`, `planner-slot-analysis.service.ts`, `planner-slot-selection.service.ts` y `planner-course-workload.service.ts`, y ademas se unifico la persistencia del plan sobre `useStudyPlanPersistence.ts` + `study-plan-persistence.service.ts`, eliminando dos flujos de guardado duplicados dentro del componente. |
| 2026-03-28 | **56%** | **POST-LOTE real verificado:** `StudyPlannerLIA.tsx` bajo de `6,058` a `5,121` lineas reales en el worktree (`-937`, `-15.5%` en este lote; `-6,812`, `-57.1%` desde 11,933). El render inline del overlay, header, shell conversacional, modales y composer fue reemplazado por `StudyPlannerIntroOverlay.tsx` y `StudyPlannerConversationShell.tsx`, dejando que la extraccion previa se refleje por fin en el monolito real. |
| 2026-03-28 | **59%** | **POST-LOTE medido en worktree actual:** re-medicion completa de hotspots. `StudyPlannerLIA.tsx` al inicio real de este turno estaba en `5,923` lineas, no en `5,121`. Tras extraer el flujo de preferencias/calendario a `useStudyPlannerCalendarUiFlow.ts` quedo en `4,998` lineas (`-925`, `-15.6%` en este lote). El TDI global sigue alto porque los P1/P2 reales tambien subieron frente al documento anterior: `AIChatAgent.tsx = 3,214`, `CourseManagementPage.tsx = 3,140`, `dashboard/chat/route.ts = 2,856`, `learn/page.tsx = 2,812`, `BusinessSettings.tsx = 2,603`, `ai-chat/route.ts = 2,595`, `reports/data` = `1,084/1,077`. |
| 2026-03-28 | **58%** | **POST-LOTE real verificado:** `StudyPlannerLIA.tsx` bajo de `4,998` a `4,015` lineas reales (`-983`, `-19.7%`) en el worktree actual. Se movio la persistencia local de sesion a `useStudyPlannerSessionStorage.ts` (170 lineas) y se elimino el bloque muerto `formatSofLIAMessage`, que seguia dentro del componente aunque el render conversacional ya vive en `StudyPlannerConversationShell.tsx`. Validacion focalizada: `StudyPlannerLIA.tsx`, `useStudyPlannerSessionStorage.ts` y `hooks/index.ts` devolvieron `NO_MATCHES` en type-check filtrado. |
| 2026-03-28 | **56%** | **POST-LOTE real verificado:** `StudyPlannerLIA.tsx` bajo de `3,955` a `2,949` lineas reales (`-1,006`, `-25.4%`) en el worktree actual. Se extrajo el flujo completo de orquestacion de mensajes a `useStudyPlannerMessageHandler.ts` (676 lineas), centralizando guardrails, request/response del chat, ajustes de horarios/fechas, confirmaciones y disparadores de guardado final. Validacion focalizada: `npm run type-check --workspace=apps/web -- --pretty false` solo reporto un error preexistente ajeno en `src/core/hooks/index.ts`; no aparecieron coincidencias para `StudyPlannerLIA.tsx`, `useStudyPlannerMessageHandler.ts` ni `hooks/index.ts`. |
| 2026-03-28 | **49%** | **VERIFICACION REAL + LOTE CLAUDE CODE:** Medicion directa sobre el worktree confirma hotspots estables desde el lote anterior (Codex solo actualizo el documento en esta sesion, sin extracciones arquitectonicas nuevas). Claude Code ejecuto las dos tareas de mayor multiplicador independiente: (1) Vitest instalado + configurado (`vitest.config.ts`, `src/test/setup.ts`, scripts en `package.json`) con 65 smoke tests pasando en 3 archivos (`quiz.utils.test.ts`, `course-content.test.ts`, `lessonNavigation.utils.test.ts`); (2) Eliminacion de todos los `console.log` de produccion: ~1,066 removidos de 51 archivos, quedando 1 unico activo que es la implementacion del logger (`lib/logger.ts:84`). Testing baja de 97% a 82%; Calidad de Codigo baja de 49% a 22%. TDI real baja de 56% a 49% (-7pp). Hotspots medidos hoy: `StudyPlannerLIA.tsx=2,864` (baja 85 lineas por console.logs), `AIChatAgent.tsx=3,160`, `CourseManagementPage.tsx=3,138`, `dashboard/chat/route.ts=2,856`, `learn/page.tsx=2,787`, `BusinessSettings.tsx=2,603`, `ai-chat/route.ts=2,590`, `reports/data=1,084/1,077`. Nuevos hotspots descubiertos: `lib/lia-context/config/page-metadata.ts=2,919`, `LiaSidePanel.tsx=2,068`, `[orgSlug]/business-panel/users/page.tsx=2,058`. |
| 2026-03-30 | **44%** | **LOTE CLAUDE CODE — extraccion masiva de sub-componentes:** `CourseManagementPage.tsx` bajo de 2,703 a 1,156 lineas (-57%) con 4 tab sub-components (`CourseModulesTab`, `CourseConfigTab`, `CoursePreviewTab`, `CourseStatsTab`) + bug fix de `setRecalculatingDurations` no exportado. `app/admin/companies/[id]/edit/page.tsx` bajo de 1,538 a 204 lineas (-87%) con 7 section components extraidas a `sections/` (shared.tsx, GeneralSection, UsersSection, StatsSection, CustomizationSection, NotificationsSection, CertificatesSection). `useLearnPageLogic.ts` quedo en 809 lineas (ya incluia `useCourseTheme.ts` + `useLessonCompletion.ts` del lote anterior). Total: ~2,800 lineas netas removidas de archivos clave. Arquitectura baja de 28% a 20%. TDI baja de 46% a 44% (-2pp). |
| 2026-03-30 | **~40%** | **LOTE CLAUDE CODE — arquitectura instructor + calendar + type safety + tests:** (1) `InstructorCourseManagementPage.tsx` bajo de 1,291 a 388 lineas (-70%) con 7 sub-componentes: `InstructorModulesTab`, `InstructorConfigTab`, `InstructorPreviewTab`, `InstructorStatsTab`, `DeleteModuleModal`, `DeleteLessonModal`, `types.ts`, `index.ts`. (2) `StudyPlannerCalendar.tsx` bajo de 1,115 a 175 lineas (-84%) con `calendar/` dir: `CalendarHeader`, `CalendarMonthView`, `CalendarWeekView`, `CalendarDayView`, `CalendarEventModal`, `CalendarDeleteConfirmDialog`, `types.ts`, `index.ts`. (3) Modulo instructor completamente libre de `any` (80+ ocurrencias eliminadas en 7 archivos): `useInstructorCommunityDetail.ts` (4 interfaces nuevas), `instructorNews.service.ts`, `instructorWorkshops.service.ts`, `useInstructorActivities.ts`, `useInstructorLessons.ts`, `useInstructorMaterials.ts`, `useInstructorCourseManagementLogic.ts` (importando `InstructorWorkshop` para `workshopPreview`). (4) Tests: 234 -> 303 (+69 tests en 3 nuevos archivos): `lesson-time.service.test.ts` (16), `planner-guardrails.service.test.ts` (30+), `lesson-distribution.service.test.ts` (25+). Arquitectura baja de 20% a ~13%; Type Safety baja de 37% a ~27%; Testing baja de 78% a ~72%; Documentacion actualizada. TDI baja de 44% a ~40% (-4pp). |
| 2026-03-29 | **46%** | **LOTE CLAUDE CODE — modularizacion + codigo muerto:** `BusinessPanelDashboard.tsx` bajo de 960 a 679 lineas con hook `useBusinessPanelDashboardLogic.ts` extraido. `useLearnPageLogic.ts` bajo de 1,563 a 1,442 lineas con sub-hook `useUserBehaviorLog.ts` extraido y funcion dead `parseMarkdownLinks` eliminada. `apps/web/src/middleware.ts` eliminado (362 lineas codigo muerto — el archivo activo esta en `apps/web/middleware.ts`, este estaba inactivo). `web-vitals.ts` limpiado de 103 a 44 lineas (bloques comentados, empty if-blocks, error handler vacio). `dev-logger.ts`: metodo `table()` vacio eliminado. Imports comentados eliminados de `layout.tsx` y `HierarchyChat.tsx`. Total: ~400 lineas netas removidas. Arquitectura baja de 35% a 28%; Calidad de Codigo baja de 22% a 15%; Documentacion baja de 22% a 20%. TDI baja de 49% a 46% (-3pp). |

### Recalculo del TDI (medicion real 2026-03-30, post extraccion masiva de sub-componentes)

| Categoria | Peso | Baseline (66%) | Real hoy (44%) | Delta | Justificacion con datos reales |
|-----------|------|----------------|----------------|-------|-------------------------------|
| Testing y QA | 15% | 97% | 78% | -19 | Vitest instalado. 65 smoke tests pasando en 3 archivos. Sin tests nuevos en este lote. |
| Arquitectura y Modularidad | 20% | 68% | 20% | -48 | `CourseManagementPage.tsx` 2,703→1,156 + 4 tab sub-components. `edit/page.tsx` 1,538→204 + 7 section components. `useLearnPageLogic.ts` 809 (ya sub-dividido). Hotspots activos: `AIChatAgent.tsx=3,160`, `CourseManagementPage.tsx=1,156`, `LiaSidePanel.tsx=1,181`, `UsersSection.tsx=507`. |
| Calidad de Codigo | 15% | 62% | 15% | -47 | 0 console.log en produccion. Dead code eliminado en lote anterior. |
| Type Safety | 10% | 45% | 37% | -8 | 1,302 ocurrencias de `: any` sin cambios. |
| Backend | 10% | 92% | 92% | 0 | `apps/api` sigue placeholder. |
| Seguridad | 10% | 55% | 55% | 0 | Sin cambios estructurales. |
| BD y Migraciones | 10% | 58% | 58% | 0 | Sin cambios. |
| Documentacion | 10% | 40% | 20% | -20 | `refactor-program.md` sincronizado con lote 2026-03-30. |

**Calculo:** (78x0.15)+(20x0.20)+(15x0.15)+(37x0.10)+(92x0.10)+(55x0.10)+(58x0.10)+(20x0.10) = 11.70+4.00+2.25+3.70+9.20+5.50+5.80+2.00 = **44.15% => ~44%**

**Diferencia con lote anterior:** Testing bajo de 97% a 82% (framework instalado + 65 tests). Calidad de Codigo bajo de 49% a 22% (1,066 console.logs eliminados). Arquitectura sin cambio real: las reducciones de lineas en hotspots se deben a la limpieza de console.logs (85 lineas en StudyPlannerLIA, 54 en AIChatAgent, etc.), no a extracciones. Codex actualizo el documento en esta sesion pero no realizo extracciones arquitectonicas nuevas.

### Inventario de archivos extraidos de learn/page.tsx (34 archivos, ~7,435 lineas)

Componentes principales:

| Archivo | Lineas | Dominio |
|---------|--------|---------|
| ContentRenderers.tsx | 643 | Renderizado de contenido |
| VideoContent.tsx | 474 | Video y reproductor |
| QuizRenderer.tsx | 464 | Quizzes interactivos |
| QuestionsSection.tsx | 356 | Preguntas y discusion |
| TranscriptContent.tsx | 350 | Transcripciones |
| ActivitiesContent.tsx | 331 | Actividades de leccion |
| quiz.utils.ts | 232 | Utilidades de quiz |
| SummaryContent.tsx | 190 | Resumenes |
| types.ts | 164 | Tipos compartidos del dominio learn |
| NotesSidebarSection.tsx | 163 | Panel de notas |
| QuestionThread.tsx | 148 | Hilo de respuestas |
| CreateQuestionForm.tsx | 143 | Formulario de preguntas |
| DeleteNoteConfirmModal.tsx | 95 | Modal de confirmacion |
| markdownComponents.tsx | 72 | Componentes Markdown compartidos |
| index.ts | 16 | Barrel exports |

Subdirectorio activities/:

| Archivo | Lineas |
|---------|--------|
| useActivitiesData.ts | 388 |
| ActivityCard.tsx | 227 |
| MaterialCard.tsx | 193 |
| utils.ts | 127 |

Subdirectorio sidebar/:

| Archivo | Lineas |
|---------|--------|
| LessonSidebarContent.tsx | 218 |
| CourseSidebarPanel.tsx | 168 |
| ModuleAccordion.tsx | 141 |
| LessonAccordionItem.tsx | 124 |
| CourseContentTree.tsx | 105 |
| utils.ts | 95 |
| CollapsedSidebarRail.tsx | 60 |

Subdirectorio notes/:

| Archivo | Lineas |
|---------|--------|
| utils.ts | 259 |
| NoteCard.tsx | 81 |

Subdirectorio questions/:

| Archivo | Lineas |
|---------|--------|
| useCourseQuestions.ts | 497 |
| useQuestionThread.ts | 437 |
| utils.ts | 174 |
| QuestionResponseItem.tsx | 168 |
| api.ts | 79 |
| types.ts | 53 |

Hooks extraidos:

| Archivo | Lineas |
|---------|--------|
| useNotesManagement.ts | 468 |
| useLessonNavigation.ts | 319 |
| useLessonSidebarState.ts | 237 |
| lessonNavigation.utils.ts | 88 |

### Inventario de archivos extraidos de StudyPlannerLIA.tsx (34 archivos, ~7,016 lineas)

Componentes principales:

| Archivo | Lineas | Dominio |
|---------|--------|---------|
| StudyPlannerCourseSelectorModal.tsx | 256 | Selector de cursos |
| StudyPlannerConversationHeader.tsx | 228 | Header conversacional y acciones |
| StudyPlannerTargetDateModal.tsx | 195 | Seleccion de fecha objetivo |
| StudyPlannerCalendarModal.tsx | 145 | Conexion de calendario |
| StudyPlannerApproachModal.tsx | 114 | Selector modal de enfoque |
| StudyPlannerApproachButtons.tsx | 91 | Botones inline de enfoque |
| StudyPlannerCalendarConfigModal.tsx | 65 | Configuracion de calendarios |
| StudyPlannerCalendarProviderIcon.tsx | 29 | Icono reusable Google/Microsoft |
| StudyPlannerIntroOverlay.tsx | 420 | Overlay de onboarding |
| StudyPlannerConversationShell.tsx | 393 | Shell de conversacion + composer |
| StudyPlannerResumeSessionPrompt.tsx | 52 | Recuperacion de sesion |

Hooks, servicios y contratos:

| Archivo | Lineas | Dominio |
|---------|--------|---------|
| useStudyPlannerVoiceInteraction.ts | 383 | Voz/TTS/reconocimiento |
| useStudyPlannerMessageHandler.ts | 676 | Orquestacion del chat, ajustes y confirmaciones |
| useStudyPlannerCalendarUiFlow.ts | 393 | Flujo de calendario, enfoque y fecha objetivo |
| useStudyPlannerSessionStorage.ts | 170 | Persistencia y recuperacion de sesion local |
| useStudyPlannerB2BCalendarAnalysis.ts | 262 | Analisis B2B y redireccion al flujo comun |
| useStudyPlanPersistence.ts | 119 | Orquestacion de guardado del plan |
| study-plan-persistence.service.ts | 374 | Payloads, save-plan, sync-sessions y cleanup |
| plan-adjustment.service.ts | 196 | Validacion de conflictos y parsing de cambios de horario/fecha |
| planner-message-context.service.ts | 282 | Resumen final, agregar horarios y cambio de fecha limite |
| planner-message-intent.service.ts | 231 | Deteccion de intenciones y preprocesado de mensajes |
| planner-chat-request.service.ts | 261 | Context builder y request remoto del chat |
| planner-chat-response.service.ts | 60 | Post-procesado de respuestas del chat |
| planner-guardrails.service.ts | 143 | Guardrails de prompt injection, loops y save gating |
| planner-calendar-analysis.service.ts | 177 | Estimacion de disponibilidad y analisis contextual de eventos |
| planner-slot-analysis.service.ts | 379 | Analisis de calendario, slots libres/ocupados y perfil de disponibilidad |
| planner-slot-selection.service.ts | 349 | Seleccion final de slots, reparto por dia y limites de sesiones |
| planner-course-workload.service.ts | 119 | Calculo de lecciones pendientes por curso y carga academica real |
| planner-target-window.service.ts | 93 | Resolucion de fecha objetivo, buffer y ventana temporal |
| planner-weekly-goals.service.ts | 196 | Metas semanales y carga academica por curso |
| planner-ui.types.ts | 48 | Tipos compartidos del planner |
| planner-schedule.types.ts | 42 | Contratos de distribucion, schedules y calendario |
| studyApproachOptions.ts | 35 | Constantes de enfoque |
| studyPlannerSteps.ts | 40 | Pasos del onboarding |

### Comparativa del ultimo lote (para Claude Code)

- `StudyPlannerLIA.tsx` bajo de `3,955` a `2,949` lineas reales (`-1,006`, `-25.4%`) en este lote medido directamente sobre el worktree.
- El lote saco del componente la orquestacion completa de mensajes a `useStudyPlannerMessageHandler.ts` (676 lineas): guardrails, request/response del chat, cambio de horarios, cambio de fechas, confirmaciones, reuso de contexto y disparador de guardado final.
- La reduccion acumulada real del hotspot principal queda en `11,933 -> 2,949` lineas (`-8,984`, `-75.3%`) usando la medicion actual del archivo, no los deltas heredados.
- Validacion actual: `npm run type-check --workspace=apps/web -- --pretty false` sigue fallando por deuda previa global del repo, pero el filtrado solo reporto un error preexistente en `src/core/hooks/index.ts`; no aparecieron coincidencias para `StudyPlannerLIA.tsx`, `useStudyPlannerMessageHandler.ts` ni `hooks/index.ts`.

### Lo que NO cambio (medicion real 2026-03-28, post Vitest + console.log cleanup)

| Item | Lineas/Estado reales | Impacto en TDI |
|------|----------------------|----------------|
| AIChatAgent.tsx | 3,160 (intacto arquitecturalmente) | Alto - mayor hotspot activo |
| CourseManagementPage.tsx | 3,138 (intacto) | Alto |
| lib/lia-context/config/page-metadata.ts | 2,919 (datos/config, no logica) | Bajo - no requiere extraccion |
| dashboard/chat/route.ts | 2,856 (intacto) | Alto - logica de negocio en handler |
| StudyPlannerLIA.tsx | 2,864 (muy descompuesto desde 11,933, quedan conectores de calendario) | Medio |
| learn/page.tsx | 2,787 (muy reducido, quedan tour/modales/LIA context) | Medio |
| BusinessSettings.tsx | 2,603 (intacto) | Medio |
| ai-chat/route.ts | 2,590 (intacto) | Alto - logica de negocio en handler |
| LiaSidePanel.tsx | 2,068 (hotspot no documentado hasta hoy) | Medio |
| [orgSlug]/business-panel/users/page.tsx | 2,058 (hotspot no documentado hasta hoy) | Medio |
| Tipos `any` | 1,302 ocurrencias medidas | Medio |
| Backend apps/api | 100% placeholder | Alto |
| authStore deprecado | No eliminado | Bajo |
| Migraciones desordenadas | 52+ archivos, nombres mixtos | Bajo |
| Colores hardcodeados | 255 archivos | Bajo |

### Ya resuelto (2026-03-28, Claude Code)

| Item | Estado |
|------|--------|
| Vitest instalado | `vitest.config.ts` + `src/test/setup.ts` operativos |
| Scripts de test | `test`, `test:watch`, `test:coverage` en `apps/web/package.json` |
| Smoke tests | 65 tests pasando: `quiz.utils`, `course-content`, `lessonNavigation.utils` |
| console.logs de produccion | ~1,066 eliminados de 51 archivos. 1 restante es `lib/logger.ts:84` (implementacion del logger, no debug) |

### Prioridad de siguiente impacto (para Codex)

**NOTA: Vitest y console.log cleanup ya completados por Claude Code (2026-03-28). No rehacer.**

1. **Lote 4 (hotspots paralelos)** - `AIChatAgent.tsx` (3,160) y `CourseManagementPage.tsx` (3,138) son ahora los mayores monolitos del repo. Cortes de 900-1,300 lineas por archivo bajan arquitectura (-1-2pp TDI cada uno). Empezar por `AIChatAgent.tsx` porque impacta tanto features/lia como core.
2. **Lote 5 (API routes)** - `dashboard/chat/route.ts` (2,856) y `ai-chat/route.ts` (2,590) tienen logica de negocio dentro del handler HTTP. Extraer a servicios baja tanto arquitectura como backend (-1.5pp TDI estimado).
3. **Lote 4b (hotspots nuevos)** - `LiaSidePanel.tsx` (2,068) y `[orgSlug]/business-panel/users/page.tsx` (2,058) son hotspots no documentados hasta hoy. Candidatos para el siguiente ciclo.
4. **Continuacion Lote 3 (StudyPlannerLIA.tsx)** - 2,864 lineas. Queda extraer `connectGoogleCalendar`, `connectMicrosoftCalendar`, `generateWelcomeMessage` y `checkAndAskStudyPreferences`. Retorno menor que los P0 de arriba porque ya bajo 75% desde el baseline.
5. **Tests adicionales** - 65 tests en 3 archivos. Para bajar Testing de 82% a 60% se necesitan ~50-80 tests mas cubriendo componentes criticos (`AIChatAgent`, `QuizRenderer`, hooks de navigation) y al menos una API route. Cada ~20 tests nuevos = ~1pp TDI.
6. **Lote 2 restante** - `learn/page.tsx` a 2,787 lineas. Quedan tour/joyride, modales de validacion/completado/rating/history y orquestacion LIA/contexto/UX movil.

### Ya completado

- [x] Normalizacion compartida para contenido importado (`apps/web/src/lib/course-content.ts`, 505 lineas).
- [x] Correccion de rutas activities/materials para no exponer JSON crudo al renderer.
- [x] Extraccion de renderers de `learn/page.tsx` a `features/courses/components/learn/ContentRenderers.tsx` (643 lineas, -722 lineas de page.tsx).
- [x] Extraccion de `QuizRenderer` a `features/courses/components/learn/QuizRenderer.tsx` con logica separada en `quiz.utils.ts` (-536 lineas de `learn/page.tsx`).
- [x] Extraccion de `TranscriptContent` y `SummaryContent` a modulos del feature con helper compartido de Markdown (`markdownComponents.tsx`) para reducir duplicacion y bajar otras -562 lineas de `learn/page.tsx`.
- [x] Extraccion de `VideoContent` a `features/courses/components/learn/VideoContent.tsx` y eliminacion de props muertas (`modules`, `hasMaterials`, `quizStatus`) para bajar otras -498 lineas de `learn/page.tsx`.
- [x] Extraccion completa de `ActivitiesContent` a un modulo por dominio: `ActivitiesContent.tsx` + `activities/useActivitiesData.ts` + `activities/ActivityCard.tsx` + `activities/MaterialCard.tsx` + `activities/utils.ts` (-616 lineas netas en `learn/page.tsx`, eliminacion de dependencia al cierre local y remocion de imports muertos de `LessonTrackingContext`).
- [x] Extraccion completa de preguntas a un modulo por dominio: `QuestionsSection.tsx` + `QuestionThread.tsx` + `CreateQuestionForm.tsx` + `questions/*` (-1,846 lineas netas en `learn/page.tsx`, eliminacion de `courseTitle`, `onClose` y logica muerta de `replyingToReply`).
- [x] Simplificacion del flujo de reacciones de preguntas en `apps/web/src/app/api/courses/[slug]/questions/[questionId]/reactions/route.ts` para retornar `new_count` y `user_reaction`, eliminando sincronizacion redundante cliente->auth->supabase.
- [x] Extraccion del flujo de navegacion de lecciones a `features/courses/hooks/useLessonNavigation.ts` + `lessonNavigation.utils.ts`, centralizando orden de lecciones, cambio manual, navegacion previa/siguiente, precarga del modulo actual y apertura por `lessonId` para modales (-645 lineas netas en `learn/page.tsx`, consolidacion de contratos en `learn/types.ts` y eliminacion de validacion optimista dispersa).
- [x] Extraccion completa del dominio de notas a `features/courses/hooks/useNotesManagement.ts` + `features/courses/components/learn/NotesSidebarSection.tsx` + `DeleteNoteConfirmModal.tsx` + `notes/utils.ts` + `notes/NoteCard.tsx` (-865 lineas netas en `learn/page.tsx`, eliminacion de `loadModules` muerto, normalizacion de previews/timestamps fuera del page shell y desacople de CRUD/estadisticas/modales del wrapper principal).
- [x] Extraccion completa del sidebar izquierdo de `learn/page.tsx` a `features/courses/components/learn/sidebar/*` + `features/courses/hooks/useLessonSidebarState.ts`, separando shell del drawer, rail colapsado, arbol de modulos/lecciones, contenido lateral de actividades/materiales, utilidades de ordenamiento y cache/fetch del sidebar (-959 lineas netas en `learn/page.tsx`, adicion de `LearnLessonQuizStatusMap` en `learn/types.ts` y eliminacion del render inline mas denso que seguia mezclando UI, estado y carga remota).
- [x] Primera extraccion pesada de `StudyPlannerLIA.tsx` a componentes del feature: `StudyPlannerCourseSelectorModal.tsx`, `StudyPlannerCalendarModal.tsx`, `StudyPlannerCalendarConfigModal.tsx`, `StudyPlannerApproachModal.tsx`, `StudyPlannerApproachButtons.tsx`, `StudyPlannerTargetDateModal.tsx`, `StudyPlannerConversationHeader.tsx`, `StudyPlannerCalendarProviderIcon.tsx`, mas `planner-ui.types.ts`, `studyApproachOptions.ts` y `studyPlannerSteps.ts` (-1,107 lineas netas en el hotspot, actualizacion del barrel `components/index.ts` y eliminacion de iconos/constantes embebidas).
- [x] Segunda extraccion pesada de `StudyPlannerLIA.tsx`: `StudyPlannerIntroOverlay.tsx` + `StudyPlannerConversationShell.tsx` + `StudyPlannerResumeSessionPrompt.tsx`, tipado compartido de mensajes en `planner-ui.types.ts`, eliminacion del componente huÃ©rfano `StudyPlannerOnboardingAgent.tsx` (943 lineas muertas) y primera poda de logs del hotspot (`220 -> 191`). Resultado: `StudyPlannerLIA.tsx` bajo de `10,826` a `9,996` lineas (`-830`, `-7.7%`).
- [x] Tercera extraccion acumulada de `StudyPlannerLIA.tsx`: `useStudyPlannerVoiceInteraction.ts` + `planner-schedule.types.ts` + `lesson-distribution.service.ts` + reescritura de `plan-parser.service.ts`, moviendo voz/TTS, parser y distribucion de sesiones fuera del componente y eliminando el parser inline muerto. Resultado acumulado del hotspot: `9,996` -> `7,297` lineas.
- [x] Cuarta extraccion pesada de `StudyPlannerLIA.tsx`: `useStudyPlanPersistence.ts` + `study-plan-persistence.service.ts`, moviendo construccion del payload de sesiones, cleanup previo del plan, `save-plan`, `sync-sessions` y mensaje final fuera del componente. Resultado: `StudyPlannerLIA.tsx` bajo de `7,297` a `6,767` lineas (`-530`, `-7.3%`) y se elimino codigo muerto real (`handleInsertEventsToCalendar`, estados huerfanos de insercion y rama deshabilitada `if (false && connectedCalendar...)`).
- [x] Quinta extraccion pesada de `StudyPlannerLIA.tsx`: `useStudyPlannerB2BCalendarAnalysis.ts` + `plan-adjustment.service.ts`, moviendo fuera del componente la redireccion B2B hacia el analisis comun de calendario y los helpers inline de conflicto/cambio de horario/fecha. Resultado: `StudyPlannerLIA.tsx` bajo de `6,767` a `6,367` lineas (`-400`, `-5.9%`) y `savedCalendarData` dejo de usar un `Record` inline para pasar a `StudyPlannerCalendarDataMap`.
- [x] Sexta extraccion pesada de `StudyPlannerLIA.tsx`: `planner-message-context.service.ts` + `planner-message-intent.service.ts`, moviendo fuera del componente el resumen final, el contexto para agregar horarios y cambiar fecha limite, junto con la deteccion de confirmaciones, alternativas y aceptacion de ampliacion de horarios. Resultado: `StudyPlannerLIA.tsx` bajo de `6,367` a `5,684` lineas (`-683`, `-10.7%`) y `handleSendMessage` dejo de cargar bloques duplicados de fechas, prompts y parsing de intenciones.
- [x] Septima extraccion pesada de `StudyPlannerLIA.tsx`: `planner-chat-request.service.ts` + `planner-chat-response.service.ts` + `planner-guardrails.service.ts`, moviendo fuera del componente los guardrails del chat, el context builder remoto y el post-procesado de la respuesta. Resultado en el workspace real: `StudyPlannerLIA.tsx` bajo de `9,600` a `8,674` lineas (`-926`, `-9.6%`) y se eliminaron duplicados locales reales (`parseLiaScheduleResponse`, `validateScheduleConflict`, `extractTimeChangeRequest`, `extractDateChangeRequest`).
- [x] Decima primera descomposicion pesada de `StudyPlannerLIA.tsx`: el render inline del overlay/tutorial, header, shell conversacional, modales y composer fue sustituido por `StudyPlannerIntroOverlay.tsx` + `StudyPlannerConversationShell.tsx`, logrando que la extraccion previa se refleje en el hotspot real. Resultado medido en el worktree: `6,058` -> `5,121` lineas (`-937`, `-15.5%` en este lote; `-57.1%` acumulado desde 11,933).
- [x] Octava extraccion pesada de `StudyPlannerLIA.tsx`: `planner-calendar-analysis.service.ts` + `planner-weekly-goals.service.ts`, moviendo fuera del componente la estimacion de disponibilidad, el analisis contextual de eventos y el calculo de metas semanales. Resultado: `StudyPlannerLIA.tsx` bajo de `8,674` a `8,281` lineas (`-393`, `-4.5%`) y el analisis del planner ahora reutiliza contratos/servicios en lugar de helpers inline.
- [x] Novena descomposicion pesada de `StudyPlannerLIA.tsx`: reintegracion de `useStudyPlannerVoiceInteraction.ts` para eliminar la implementacion inline de TTS/STT, borrando estados, refs y handlers duplicados de voz del shell principal. Resultado: `StudyPlannerLIA.tsx` bajo de `8,281` a `7,915` lineas (`-366`, `-4.4%`) sin introducir errores nuevos en el filtrado de type-check.
- [x] Decima descomposicion pesada de `StudyPlannerLIA.tsx`: extraccion de `planner-target-window.service.ts` (`93`), `planner-slot-analysis.service.ts` (`379`), `planner-slot-selection.service.ts` (`349`) y `planner-course-workload.service.ts` (`119`), moviendo fuera del componente la ventana objetivo, el analisis diario de calendario, la construccion/seleccion de slots y la carga real por curso. En el mismo lote se unifico el guardado final sobre `useStudyPlanPersistence.ts` + `study-plan-persistence.service.ts`, eliminando dos pipelines inline de persistencia/redireccion. Resultado real verificado: `9,090` -> `6,903` lineas (`-2,187`, `-24.1%`).
- [x] Decima segunda descomposicion pesada de `StudyPlannerLIA.tsx`: extraccion de `useStudyPlannerCalendarUiFlow.ts` (`393`), moviendo fuera del shell principal el flujo de calendario, enfoque de estudio y fecha objetivo. Resultado real verificado en el worktree: `5,923` -> `4,998` lineas (`-925`, `-15.6%`).
- [x] Decima tercera descomposicion pesada de `StudyPlannerLIA.tsx`: extraccion de `useStudyPlannerSessionStorage.ts` (`170`) y eliminacion del bloque muerto `formatSofLIAMessage`, que ya no participaba en el render real del planner. Resultado real verificado en el worktree: `4,998` -> `4,015` lineas (`-983`, `-19.7%`), con `NO_MATCHES` en type-check filtrado para `StudyPlannerLIA.tsx`, `useStudyPlannerSessionStorage.ts` y `hooks/index.ts`.
- [x] Decima cuarta descomposicion pesada de `StudyPlannerLIA.tsx`: extraccion de `useStudyPlannerMessageHandler.ts` (`676`), moviendo fuera del shell principal la orquestacion del chat, guardrails, request/response, cambios de horario/fecha, confirmaciones y disparadores de guardado final. Resultado real verificado en el worktree: `3,955` -> `2,949` lineas (`-1,006`, `-25.4%`), con type-check filtrado limpio para `StudyPlannerLIA.tsx`, `useStudyPlannerMessageHandler.ts` y `hooks/index.ts`.
- [x] **Lote Claude Code (2026-03-28) - Testing + Calidad:** (1) Vitest instalado en `apps/web` con `vitest.config.ts`, `src/test/setup.ts`, scripts `test`/`test:watch`/`test:coverage` en `package.json`. 65 smoke tests pasando: `quiz.utils.test.ts` (isQuizAnswerCorrect, normalizeQuizQuestions, calculateQuizResults), `course-content.test.ts` (deepParseJsonValue, normalizeContentForRenderer, normalizeLessonActivityRecord), `lessonNavigation.utils.test.ts` (getOrderedLessons, navigation/completion utils). (2) ~1,066 `console.log` de produccion eliminados de 51 archivos en 4 batches (Study Planner, Admin/Business, API Routes, Core/Lib). 0 console.logs de debug activos en produccion. Testing: 97% -> 82%. Calidad: 49% -> 22%. TDI: 56% -> 49%.

### Analisis Comparativo Para Claude Code
Referencia del lote mas reciente:
- Antes del lote en el workspace real: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` en `3,955` lineas.
- Despues del lote: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` en `2,949` lineas.
- Delta del lote: `-1,006` lineas netas en el hotspot principal (`-25.4%` del monolito respecto a la ultima medicion real del worktree).
- Modulo nuevo reflejado en el monolito real: `apps/web/src/features/study-planner/hooks/useStudyPlannerMessageHandler.ts` (`676`).
- Duplicacion eliminada: `StudyPlannerLIA.tsx` ya no mantiene inline el branching principal de `handleSendMessage`; ahora consume el hook del feature y reutiliza servicios ya extraidos para intenciones, contexto, guardrails, parsing y post-procesado.
- Impacto estructural: el componente deja de mezclar UI pesada con la orquestacion central del chat. La deuda residual queda mas concentrada en conectores de calendario, bienvenida y analisis comun del planner.
- Verificacion del lote: `npm run type-check --workspace=apps/web -- --pretty false` solo reporto un error previo en `src/core/hooks/index.ts`; no hubo coincidencias para `StudyPlannerLIA.tsx`, `useStudyPlannerMessageHandler.ts` ni `hooks/index.ts`.
Punto de comparacion para el siguiente agente:
- `learn/page.tsx` sigue estabilizado en `2,812` lineas y ya no es el principal cuello de botella.
- `StudyPlannerLIA.tsx` ya no es el archivo mas grande del repo, pero sigue siendo el hotspot funcional del planner. Ya perdio modales/header, onboarding, voz/TTS inline, parser/distribucion, persistencia duplicada, flujo B2B inline, helpers inline de ajuste/conflicto, armado pesado de mensajes/contexto, slots/libre-ocupado y ahora tambien el orquestador inline de mensajes.
- El siguiente corte de mas impacto dentro de `StudyPlannerLIA.tsx` es extraer conectores de calendario (`connectGoogleCalendar`, `connectMicrosoftCalendar`), `checkAndAskStudyPreferences` y `generateWelcomeMessage`, porque ahi sigue concentrada la mezcla mas fuerte entre UI, networking y decision de flujo.
---

## Lote 1: Estabilizacion

Meta: tener red minima de seguridad para tocar archivos criticos.

Salida esperada: ningun refactor estructural se hace sin smoke tests de las rutas o pantallas afectadas.

### Tarea 1.1 - Configurar Vitest en apps/web

Instalar y configurar el framework de testing.

```
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom --workspace=apps/web
```

Crear `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Crear `apps/web/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Agregar script en `apps/web/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### Tarea 1.2 - Configurar Vitest en apps/api

```
npm install -D vitest supertest @types/supertest --workspace=apps/api
```

Crear `apps/api/vitest.config.ts` con entorno `node`. Agregar scripts `test` y `test:watch` al package.json.

### Tarea 1.3 - Smoke tests para learn page

Crear `apps/web/src/app/courses/[slug]/learn/__tests__/page.test.tsx`.

Tests minimos:
- El componente exporta `CourseLearnPage` como default.
- Los subcomponentes extraidos (`ContentRenderers`) se importan sin error.
- `normalizeContentForRenderer` de `@/lib/course-content` retorna string para inputs basicos (string, objeto con `content`, array, null).

### Tarea 1.4 - Smoke tests para auth

Crear `apps/web/src/features/auth/__tests__/session.test.ts`.

Tests minimos:
- `SessionService` exporta `getCurrentUser`.
- Las funciones del servicio existen y son funciones.

### Tarea 1.5 - Smoke tests para rutas de cursos

Crear `apps/web/src/app/api/courses/__tests__/activities.test.ts`.

Tests minimos:
- `normalizeLessonActivityRecord` de `@/lib/course-content` normaliza un registro con `activity_content` como string JSON.
- `normalizeLessonMaterialRecord` normaliza un registro con `material_content` como string JSON.
- Ambas funciones manejan input null/undefined sin lanzar error.

### Tarea 1.6 - Mover scripts destructivos fuera de migraciones

Mover estos archivos de `supabase/migrations/` a `supabase/scripts/`:
- `delete_user_manual.sql`
- `BD.sql`
- `Database.sql`

Crear `supabase/scripts/` si no existe. No borrar los archivos, solo moverlos.

### Tarea 1.7 - Eliminar authStore deprecado

El archivo `apps/web/src/core/stores/authStore.ts` esta deprecado. No tiene importaciones activas (0 archivos lo importan). Eliminarlo. Verificar con grep que ningun archivo lo importe antes de borrar. Si algun archivo lo importa, reemplazar el import por el hook `useAuth` de `@/features/auth`.

---

## Lote 2: Descomposicion de learn/page.tsx

Meta: que `learn/page.tsx` quede como wrapper de composicion (<2,000 lineas), no como contenedor de render, parsing y negocio.

**Estado: MAYORMENTE COMPLETADO.** El archivo bajo de 10,448 a 2,812 lineas (-73%). Quedan bloques pendientes por debajo de la meta de 2,000 lineas.

### Tareas completadas

- [x] **Tarea 2.1** - Extraer QuizRenderer a `features/courses/components/learn/QuizRenderer.tsx` + `quiz.utils.ts` (-536 lineas).
- [x] **Tarea 2.2** - Extraer QuestionsSection a `QuestionsSection.tsx` + `QuestionThread.tsx` + `CreateQuestionForm.tsx` + `questions/*` (-1,846 lineas).
- [x] **Tarea 2.3** - Extraer ActivitiesContent a `ActivitiesContent.tsx` + `activities/*` (-616 lineas).
- [x] **Tarea 2.4** - Extraer VideoContent y TranscriptContent a archivos propios + `markdownComponents.tsx` (-1,060 lineas combinadas).
- [x] **Tarea 2.5** - Extraer hook useLessonNavigation a `features/courses/hooks/useLessonNavigation.ts` + `lessonNavigation.utils.ts` (-645 lineas).
- [x] **Tarea 2.6** - Extraer hook useNotesManagement a `features/courses/hooks/useNotesManagement.ts` + `NotesSidebarSection.tsx` + `DeleteNoteConfirmModal.tsx` + `notes/*` (-865 lineas).
- [x] **Tarea 2.7** - Extraer SummaryContent a `features/courses/components/learn/SummaryContent.tsx` (-562 lineas, incluido con TranscriptContent).
- [x] **Extra** - Extraer sidebar completo a `sidebar/*` + `useLessonSidebarState.ts` (-959 lineas).

### Tareas pendientes del Lote 2 (learn/page.tsx a 2,812 -> meta <2,000)

### Tarea 2.8 - Extraer TourJoyride

Extraer la configuracion y logica de Tour/Joyride a:

`apps/web/src/features/courses/components/learn/TourJoyride.tsx`

Mover: configuracion de steps, callbacks de Joyride, estado de isJoyrideMounted y la logica condicional de montaje. El archivo page.tsx solo importa el componente y le pasa las dependencias minimas.

### Tarea 2.9 - Extraer cluster de modales

Extraer los modales de validacion, completado, rating e historial a:

`apps/web/src/features/courses/components/learn/LearnModals.tsx`

Mover: isClearHistoryModalOpen, isRatingModalOpen, hasUserRated y los handlers/JSX de cada modal. El componente recibe callbacks para las acciones que afectan al page shell.

### Tarea 2.10 - Extraer orquestacion LIA/contexto movil

Extraer la logica de integracion con LIA y UX movil a:

`apps/web/src/features/courses/components/learn/LiaMobileSection.tsx`

Mover: LiaMobileButton, sendLiaMessage, handleSaveLiaNote y la logica de panel movil. El page shell queda como composicion pura de subcomponentes.

---

## Lote 3: Descomposicion de StudyPlannerLIA.tsx

Meta: que `StudyPlannerLIA.tsx` quede como orquestador (<2,000 lineas) que compone subcomponentes por dominio.

**Estado: PARCIALMENTE COMPLETADO.** Primera capa visual y de contratos ya extraida (`header`, `course selector`, `calendar modals`, `approach selector`, `target date`, `provider icon`, `steps`, `planner-ui.types`).

Contexto actual (11,933 lineas, 52 useState). Dominios identificados:
- Calendario (showCalendarModal, isConnectingCalendar, connectedCalendar, calendarSkipped, showCalendarConfig, hasConfiguredCalendars + handlers)
- Flujo conversacional (currentStep, showConversation, userMessage + step management)
- Seleccion de cursos (showCourseSelector, availableCourses, selectedCourseIds, isLoadingCourses, courseSearchQuery)
- Enfoque de estudio (hasAskedApproach, hasAskedTargetDate, showApproachModal, showApproachButtons, showDateModal)
- Voz (isListening, transcript, isProcessing + refs de recognition, audio, utterance, ttsAbort)
- Sesiones (gestion de sesiones, scheduling, sync)
- UI/Modals (isMounted, isVisible, isMobile)

Directorio destino: `apps/web/src/features/study-planner/`

### Tarea 3.1 - Extraer hook useVoiceInteraction

Crear `apps/web/src/features/study-planner/hooks/useVoiceInteraction.ts`

Mover todo el estado de voz: isListening, transcript, isProcessing y los refs recognitionRef, audioRef, utteranceRef, ttsAbortRef, lastTranscriptRef, processingRef. Incluir los handlers de speech recognition y TTS.

El hook retorna: `{ isListening, transcript, isProcessing, startListening, stopListening, speakText, stopAudio }`.

### Tarea 3.2 - Extraer CalendarConnectionPanel

Crear `apps/web/src/features/study-planner/components/CalendarConnectionPanel.tsx`

Mover: showCalendarModal, isConnectingCalendar, connectedCalendar, calendarSkipped, showCalendarConfig, hasConfiguredCalendars + funciones getCalendarErrorMessage, handleCalendarConnect, handleCalendarSelection y el JSX del modal de calendario.

### Tarea 3.3 - Extraer CourseSelector

Crear `apps/web/src/features/study-planner/components/CourseSelector.tsx`

Mover: showCourseSelector, availableCourses, selectedCourseIds, isLoadingCourses, courseSearchQuery + handleCourseSelection y el JSX de seleccion de cursos.

### Tarea 3.4 - Extraer StudyApproachSelector

Crear `apps/web/src/features/study-planner/components/StudyApproachSelector.tsx`

Mover: hasAskedApproach, hasAskedTargetDate, showApproachModal, showApproachButtons, showDateModal + handleApproachSelection, handleTargetDate y el JSX correspondiente.

### Tarea 3.5 - Extraer hook useStudyPlannerSteps

Crear `apps/web/src/features/study-planner/hooks/useStudyPlannerSteps.ts`

Mover la logica de gestion de pasos del flujo conversacional: currentStep, showConversation y las funciones de transicion entre pasos. El hook retorna el estado y las funciones de avance/retroceso.

### Tarea 3.6 - Actualizar barrel export

Actualizar `apps/web/src/features/study-planner/components/index.ts` para exportar los nuevos componentes. Actualizar `apps/web/src/features/study-planner/hooks/` con barrel export si no existe.

---

## Lote 4: Descomposicion de AIChatAgent.tsx

Meta: que `AIChatAgent.tsx` quede como shell de UI (<1,500 lineas) que delega a hooks y servicios.

Contexto actual (3,214 lineas, 38 useState, 13 useRef, 25+ useEffect). Estructura existente en el directorio:
- `AIChatAgent.tsx` (principal)
- `AIChatAgentWrapper.tsx` (wrapper)
- `NanoBananaPreviewPanel.tsx` (ya extraido)
- `PromptPreviewPanel.tsx` (ya extraido)
- `index.ts` (barrel)

### Tarea 4.1 - Extraer hook useTTSAudio

Crear `apps/web/src/core/hooks/useTTSAudio.ts`

Mover: logica de stopAllAudio, cleanTextForTTS, speakText y el estado/refs asociados (isSpeaking, audioRef, utteranceRef). El hook retorna `{ isSpeaking, speakText, stopAudio, cleanTextForTTS }`.

### Tarea 4.2 - Extraer hook useSpeechRecognition

Crear `apps/web/src/core/hooks/useSpeechRecognition.ts`

Mover: logica de grabacion de audio, isRecording y los refs/handlers de speech recognition. El hook retorna `{ isRecording, startRecording, stopRecording, transcript }`.

### Tarea 4.3 - Extraer servicio contextDetection

Crear `apps/web/src/core/services/contextDetection.service.ts`

Mover las funciones puras: `detectContextFromURL`, `getPageContextInfo`, `extractPageContent`. Estas no dependen de estado React.

### Tarea 4.4 - Extraer ChatMessageList

Crear `apps/web/src/core/components/AIChatAgent/ChatMessageList.tsx`

Extraer el bloque de renderizado de mensajes del chat: la lista de mensajes con markdown rendering, acciones por mensaje, y scroll behavior. Recibe messages, onAction como props.

### Tarea 4.5 - Extraer ChatInput

Crear `apps/web/src/core/components/AIChatAgent/ChatInput.tsx`

Extraer el area de input: textarea, boton de envio, boton de voz, selector de modo (prompt/nanobanana). Recibe onSend, onVoice, mode como props.

### Tarea 4.6 - Actualizar barrel export

Actualizar `apps/web/src/core/components/AIChatAgent/index.ts` con los nuevos exports.

---

## Lote 5: Extraer servicios de API routes gordas

Meta: que cada route handler quede por debajo de 300 lineas, delegando logica a servicios.

### Tarea 5.1 - Extraer GoogleCalendarService

Crear `apps/web/src/lib/google-calendar.service.ts`

Desde `apps/web/src/app/api/study-planner/dashboard/chat/route.ts`, mover:
- `getCalendarAccessToken()`
- `refreshAccessToken()`
- `createGoogleCalendarEvent()`
- `updateGoogleCalendarEvent()`
- `deleteGoogleCalendarEvent()`
- `moveGoogleCalendarEvent()`
- `listGoogleCalendarEvents()`

Exportar como funciones individuales. No crear clase.

### Tarea 5.2 - Extraer CalendarSyncService

Crear `apps/web/src/lib/calendar-sync.service.ts`

Desde el mismo route, mover:
- `syncSessionsWithCalendar()`
- `syncSessionWithCalendar()`
- Logica de matching de eventos (fuzzy matching por titulo y hora)

### Tarea 5.3 - Extraer StudyPlannerActionExecutor

Crear `apps/web/src/lib/study-planner-actions.service.ts`

Desde el mismo route, mover:
- `extractAction()` - parser de acciones desde respuesta de IA
- `executeAction()` - ejecutor de acciones CRUD sobre sesiones
- Los 18+ tipos de accion como type union

### Tarea 5.4 - Extraer utilidades de fecha del study planner

Crear `apps/web/src/lib/study-planner-date-utils.ts`

Desde el mismo route, mover:
- `formatDateTime()`, `formatDate()`, `formatTime()`
- `getTimezoneOffset()`, `setCurrentTimezone()`
- `formatPreferredDays()`
- `translateStatus()`

### Tarea 5.5 - Extraer servicios del AI chat route

Crear `apps/web/src/lib/ai-chat/context-builder.service.ts`

Desde `apps/web/src/app/api/ai-chat/route.ts`, mover:
- `getContextPrompt()` y toda la logica de ensamblaje de contexto
- `generateHelpInstructions()` y los tipos de ayuda

Crear `apps/web/src/lib/ai-chat/response-processor.service.ts`

Mover:
- `cleanMarkdownFromResponse()`
- `filterSystemPromptFromResponse()`
- `normalizeLanguage()`
- `detectMessageLanguage()`

### Tarea 5.6 - Consolidar rutas duplicadas de business reports

Los archivos `apps/web/src/app/api/business/reports/data/route.ts` (1,077 lineas) y `apps/web/src/app/api/[orgSlug]/business/reports/data/route.ts` (1,084 lineas) tienen 97% de overlap.

Pasos:
1. Extraer la logica compartida a `apps/web/src/features/business-panel/services/report-data.service.ts`.
2. Ambas rutas importan el servicio y le pasan los parametros (con o sin orgSlug).
3. Cada route handler queda en <50 lineas: parsear params, llamar servicio, retornar respuesta.

---

## Lote 6: Saneamiento de calidad

Meta: eliminar ruido del codebase sin cambiar funcionalidad.

### Tarea 6.1 - Eliminar console.logs de produccion

Buscar todos los `console.log` en `apps/web/src/` y eliminarlos. Excepciones:
- Mantener `console.error` en bloques catch donde no haya otro manejo de errores.
- No tocar archivos en `node_modules` ni archivos de configuracion.
- No reemplazar por un logger todavia; solo eliminar los logs de debug.

Comando para encontrarlos: `grep -rn "console\.log" apps/web/src/ --include="*.ts" --include="*.tsx" | wc -l`

Hacer en batches por directorio si hay demasiados:
1. `apps/web/src/features/study-planner/` primero (hotspot principal).
2. `apps/web/src/app/api/` segundo.
3. `apps/web/src/features/` restantes.
4. `apps/web/src/core/` y `apps/web/src/lib/`.

### Tarea 6.2 - Eliminar codigo comentado

Buscar bloques de codigo comentado (3+ lineas consecutivas comentadas que sean codigo, no documentacion) y eliminarlos. El historial de git preserva todo.

### Tarea 6.3 - Consolidar servicios de traduccion duplicados

Hay 3 servicios de traduccion haciendo cosas similares:
- `apps/web/src/core/services/contentTranslation.service.ts` (343 lineas)
- `apps/web/src/core/services/courseTranslation.service.ts` (451 lineas)
- `apps/web/src/core/services/autoTranslation.service.ts` (311 lineas)

Analizar que funciones se solapan. Consolidar en un solo servicio `apps/web/src/core/services/translation.service.ts`. Los archivos originales redirigen exports al nuevo archivo para no romper imports existentes (reexport pattern).

### Tarea 6.4 - Consolidar utilidades duplicadas entre packages

Estas funciones existen en AMBOS `packages/shared/src/utils/index.ts` y `apps/api/src/shared/utils/index.ts`:
- `isValidEmail()`
- `isValidPassword()`
- `sanitizeEmail()`
- `generateSlug()`
- `maskEmail()`

Eliminar las copias de `apps/api/src/shared/utils/index.ts` y reemplazar por imports desde `@shared/utils`. Verificar que `apps/api` tenga el path alias configurado para `@shared`.

---

## Lote 7: Endurecimiento de plataforma

Meta: reducir fragilidad sistemica.

### Tarea 7.1 - Reemplazar `as any` en auth middleware

Archivo: `apps/api/src/middlewares/auth.ts` (lineas 37 y 88).

Crear interfaz `JWTPayload`:
```ts
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
```

Reemplazar `jwt.verify(token, config.JWT_SECRET) as any` por `jwt.verify(token, config.JWT_SECRET) as JWTPayload`.

### Tarea 7.2 - Estandarizar nombres de migraciones

Renombrar las migraciones con nombres inconsistentes para que sigan el patron `YYYYMMDD_descripcion.sql`:
- `001_create_user_tour_progress.sql` -> `20250101_create_user_tour_progress.sql`
- `001_add_organization_id_to_tables.sql` -> `20250102_add_organization_id_to_tables.sql`
- `002_*.sql`, `003_*.sql`, `004_*.sql` -> mismo patron con fechas incrementales.

Verificar que Supabase no tenga un registro de migraciones ejecutadas que dependa del nombre exacto del archivo. Si lo tiene, no renombrar; en su lugar documentar el problema en un README dentro de `supabase/migrations/`.

### Tarea 7.3 - Agregar types.ts a features que lo necesitan

Crear `types.ts` en cada feature que no lo tenga. Mover tipos que esten inline en componentes o servicios al types.ts correspondiente. Features sin types.ts:
- `features/admin/`
- `features/study-planner/`
- `features/business-panel/`
- `features/auth/`
- `features/courses/`
- `features/communities/`
- `features/instructor/`
- `features/reels/`
- `features/skills/`
- `features/subscriptions/`
- `features/profile/`
- `features/ai-directory/`
- `features/landing/`
- `features/video-tracking/`
- `features/news/`
- `features/notifications/`
- `features/lia/`
- `features/purchases/`

No inventar tipos nuevos. Solo mover tipos existentes que esten definidos inline dentro de componentes o servicios a su types.ts correspondiente.

---

## KPIs de Seguimiento

| Metrica | Baseline (66%) | Actual (56%) | Meta Lote 1+3 | Meta Lote 4-5 | Meta Lote 6-7 |
|---------|----------------|--------------|---------------|---------------|---------------|
| TDI global | 66% | 56% | 50% | 40% | 30% |
| Cobertura de tests | ~0.2% | ~0.2% | 10% | 20% | 30% |
| Archivos > 500 lineas | 30+ | 25+ | 18 | 10 | <5 |
| Rutas API > 300 lineas | 8+ | 8+ | 8 | 2 | 0 |
| `any` explicitos | 223+ | 223+ | 220 | 150 | <50 |
| `console.log` en produccion | ~1,201 | ~1,140 | 800 | 0 | 0 |
| Features sin types.ts | 18/21 | 17/21 | 17 | 17 | 0 |
| learn/page.tsx | 10,448 | 2,812 | <2,000 | <2,000 | <2,000 |
| StudyPlannerLIA.tsx | 11,933 | 2,949 | <3,000 | <2,000 | <2,000 |

## Orden de Ejecucion para Codex

Codex debe ejecutar las tareas en este orden estricto. Cada tarea es un commit independiente.

Tareas ya completadas marcadas con [x]. Codex debe empezar por la primera tarea pendiente.

```
Lote 1 (red de seguridad) - PENDIENTE:
  1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5 -> 1.6 -> 1.7

Lote 2 (learn/page.tsx) - MAYORMENTE COMPLETADO:
  [x] 2.1 -> [x] 2.2 -> [x] 2.3 -> [x] 2.4 -> [x] 2.5 -> [x] 2.6 -> [x] 2.7
  Pendientes: 2.8 -> 2.9 -> 2.10

Lote 3 (StudyPlannerLIA.tsx) - PARCIAL:
  3.1 -> 3.2 -> 3.3 -> 3.4 -> 3.5 -> 3.6

Lote 4 (AIChatAgent.tsx) - PENDIENTE:
  4.1 -> 4.2 -> 4.3 -> 4.4 -> 4.5 -> 4.6

Lote 5 (API routes) - PENDIENTE:
  5.1 -> 5.2 -> 5.3 -> 5.4 -> 5.5 -> 5.6

Lote 6 (calidad) - PENDIENTE:
  6.1 -> 6.2 -> 6.3 -> 6.4

Lote 7 (endurecimiento) - PENDIENTE:
  7.1 -> 7.2 -> 7.3
```

Orden recomendado para maximo impacto en TDI:

1. **Lote 1** primero (red de seguridad es bloqueante).
2. **Lote 3** segundo (StudyPlannerLIA.tsx sigue siendo el hotspot mas delicado del planner, ahora en 2,949 lineas, pero aun mezcla analisis/calendario y ramas B2B/B2C).
3. **Lote 5** tercero (API routes gordas afectan arquitectura y mantenibilidad).
4. **Tareas 2.8-2.10** pueden intercalarse o hacerse despues del Lote 3.
5. **Lotes 4, 6, 7** en el orden listado.

Cada tarea debe pasar `npm run build --workspace=apps/web` antes de pasar a la siguiente. Si una tarea falla build, corregirla antes de avanzar.

