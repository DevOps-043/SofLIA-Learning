# Plan de saneamiento del Study Planner SofLIA

## Resumen
El planificador ya cubre creación de planes, sesiones, calendario Google/Microsoft, B2B/B2C, dashboard, chat Gemini y navegación desde dashboard general. El riesgo actual viene de tres cosas: datos críticos inferidos por IA, acciones mutativas disparadas desde texto libre, y demasiada lógica concentrada en archivos grandes.

Patrones externos a copiar: [ScholarCal](https://scholarcal.com/) confirma antes de escribir eventos, [BlockPlan](https://block-plan.com/) combina syllabus/curso, calendario, riesgo y drag-drop, [CourseLink](https://apps.apple.com/us/app/courselink-ai-study-planner/id6755744656) automatiza extracción y sync, [FlowSavvy](https://flowsavvy.app/ai-assistant) separa agenda automática de eventos fijos, [Reclaim](https://reclaim.ai/features/planner) usa calendario como fuente viva y reprograma conflictos, y [Coursera Coach](https://www.coursera.org/explore/coach) ancla respuestas al contenido real del curso.

No hay imágenes adjuntas visibles en este hilo; el plan asume los problemas descritos y agrega una fase de QA visual para validar capturas o reproducción local.

## Cambios clave
- Crear un servicio determinístico `StudyPlannerCoverageService` y endpoint `GET /api/study-planner/coverage?planId=...`.
  Debe devolver por plan y curso: `totalLessons`, `completedLessons`, `plannedLessons`, `unplannedLessons`, `pendingLessons`, `coveredBySessions`, `coverageStatus`.
  SofLIA no debe volver a calcular “faltan 33 lecciones” desde texto. El chat solo podrá citar el resumen estructurado.
- Corregir [pending-lessons/route.ts](</C:/Users/fysg5/OneDrive/Escritorio/Pulse Hub/Soflia Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/pending-lessons/route.ts:267>) para exigir `courseId` cuando la UI esté en contexto de curso, validar que pertenece al usuario/organización activa y deduplicar fuentes B2B, jerarquía y enrollment.
- Cambiar el contrato de chat dashboard: `response`, `actions: ActionProposal[]`, `needsConfirmation`, `traceId`.
  Las acciones de [chat-actions.service.ts](</C:/Users/fysg5/OneDrive/Escritorio/Pulse Hub/Soflia Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/chat-actions.service.ts:112>) deben validarse con Zod por tipo y no ejecutarse automáticamente si modifican sesiones, plan o calendario.
- Implementar confirmación obligatoria server-side para `move_session`, `delete_session`, `delete_plan`, `create_session`, `recover_missed_session`, `rebalance_plan`, `reduce_session_load`, `update_calendar_selection`.
  Gemini puede proponer, pero el servidor decide si se ejecuta.
- Mostrar el error real de acciones en el panel, no solo “Error en la acción”. Incluir `action.message`, `action.code`, `traceId` y una opción de reintento cuando sea seguro.

## Fixes funcionales
- Voz: extraer `formatTextForTTS` de [useStudyPlannerVoiceInteraction.ts](</C:/Users/fysg5/OneDrive/Escritorio/Pulse Hub/Soflia Learning/SofLIA-Learning/apps/web/src/features/study-planner/hooks/useStudyPlannerVoiceInteraction.ts:74>) a servicio testeable.
  Agregar `stripMarkdownForSpeech`: remover links Markdown, bullets, negritas, encabezados, tablas, code fences, HTML/action tags y textos técnicos.
- Voz: reemplazar política actual de `stopAllAudio()` al iniciar cada `speakText` por cola TTS con modos `enqueue`, `replace`, `interruptByUser`.
  Solo una intervención explícita del usuario debe cortar audio en curso.
- Voz: limitar autolectura a resúmenes cortos; respuestas largas se muestran en chat y se leen como “Tengo el detalle listo en pantalla”.
- Calendario: extender `CalendarListItem` con `accountEmail`, `providerAccountId`, `isConnectedAccountPrimary`, `source`.
  La UI debe mostrar “Principal de la cuenta conectada: fer@...” para evitar confundir “Principal” con otro calendario.
- Calendario: separar lectura de disponibilidad y escritura de sesiones.
  Disponibilidad lee calendarios seleccionados; sesiones se escriben en calendario SofLIA/plataforma cuando exista, con fallback explícito y visible.
- Dashboard: al cargar, SofLIA puede analizar, pero no debe ejecutar cambios proactivos sin confirmación.

## Refactor técnico
- Dividir archivos de alto riesgo:
  `calendar.service.ts` 763 líneas en token/OAuth, metadata, event CRUD, sync helpers.
  `planner-chat-request.service.ts` 694 líneas en contexto, prompts, request builder y parser.
  `analysis.service.ts` 673 líneas en conflictos, sesiones perdidas, carga semanal y slots libres.
  `useStudyPlannerLIALogic.ts` 619 líneas en orquestador, flujo conversacional, voz, calendario y persistencia.
  `validation.service.ts` 612 líneas en validadores puros por dominio.
  `generate-plan/route.ts` 592 líneas debe quedar como route delgada y delegar a un único motor.
- Consolidar los dos generadores de plan existentes en un solo motor puro.
  El route actual duplica lógica y usa `any`; el servicio debe aceptar `PlannerGenerationInput` validado con Zod y devolver estructura, no texto como fuente primaria.
- Eliminar `any` de producción:
  `slots: any[]` en `generate-plan/route.ts`, `phaseData?: Record<string, any>` en `lia-context.types.ts`, y `act: any` / `mat: any` en `lesson-time.service.ts`.
- Reducir hardcoded UI debt en Study Planner: textos visibles a i18n ES/EN/PT, colores hex a Tailwind/CSS variables salvo logos externos, y revisar cadenas con encoding roto.
- Crear un “action outbox” o tabla/auditoría ligera para mutaciones de calendario: `pending`, `applied`, `failed`, `rolled_back`, `traceId`, `userId`, `planId`.

## Contingencia
- Feature flag `STUDY_PLANNER_ACTIONS_READONLY`: si hay errores, SofLIA solo explica y propone, sin ejecutar.
- Feature flag `STUDY_PLANNER_CALENDAR_SYNC_DISABLED`: si falla Google/Microsoft, el plan se conserva en Supabase y las sesiones quedan `pending_sync`.
- Si coverage falla, el chat responde “no puedo verificar cobertura ahora” y no inventa conteos.
- Si TTS falla, se desactiva autolectura y el chat sigue funcionando.
- Si una acción parcial falla, rollback lógico: revertir sesión Supabase o marcar `sync_failed`; nunca borrar el plan por error de calendario.
- Logs obligatorios por acción: `traceId`, `conversationId`, `userId`, `planId`, `actionType`, `confirmationState`, `calendarProvider`, `selectedCalendarIds`.

## Pruebas y aceptación
- Unit tests:
  curso con 14 lecciones nunca reporta 33; multi-curso solo suma cuando el plan incluye varios cursos.
  `coverage` diferencia completadas, planificadas, pendientes y no planificadas.
  parser Zod rechaza acciones incompletas, JSON inválido y tipos desconocidos.
  TTS no lee Markdown, links, bullets ni `<action>`.
  cola TTS no corta audio salvo `interruptByUser`.
- Integration tests:
  chat propone mover sesión y devuelve `needsConfirmation`; solo endpoint de confirmación ejecuta.
  calendario seleccionado muestra email/cuenta correcta y limpia IDs stale.
  Google y Microsoft mantienen paridad de lectura, selección y errores de reconexión.
- E2E/manual:
  crear plan desde `/study-planner/create`, guardar, abrir dashboard, preguntar “¿cubre todo mi curso?”, mover una sesión con confirmación, simular conflicto de calendario y recuperar sin perder sesiones.
- QA visual:
  validar dashboard, panel SofLIA, selector de calendarios y modales en mobile/desktop con light/dark mode y capturas reales cuando estén disponibles.
- Build/check mínimo antes de liberar:
  `npm run build --workspace=apps/web` y suites Vitest de `study-planner` relacionadas con coverage, chat actions, calendario, voz y generación de plan.

## Orden de ejecución recomendado
1. Fase 0: flags de contingencia, logs, no auto-ejecución de acciones riesgosas, error real en UI.
2. Fase 1: coverage determinístico y corrección de conteos.
3. Fase 2: voz/TTS y mensajes largos.
4. Fase 3: confirmaciones Zod + action proposals.
5. Fase 4: calendario con identidad de cuenta y separación lectura/escritura.
6. Fase 5: refactor de archivos >500 líneas y eliminación de `any`.
7. Fase 6: regresiones, QA visual y rollout gradual por organización.
