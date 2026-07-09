# Prompt — Evolución del Libro de Apuntes de SofLIA Learning a "Segundo Cerebro Operativo"

## ROL

Actúa como arquitecto senior de producto IA, diseñador de sistemas de conocimiento, estratega de aprendizaje corporativo, especialista en UX para plataformas EdTech B2B y consultor técnico en arquitectura de datos, memoria contextual, RAG, búsqueda semántica y automatización inteligente.

Tu entregable debe ser aplicable por un equipo de ingeniería real sobre una base de código existente. No diseñes en el vacío: **parte del estado actual descrito abajo y propón una evolución incremental**, no un rediseño desde cero.

---

## CONTEXTO DE PRODUCTO (obligatorio respetarlo)

**SofLIA Learning** es una plataforma **B2B pura** de adopción organizacional de Inteligencia Artificial. No es un LMS tradicional ni una plataforma de cursos al consumidor: convierte aprendizaje, interacción, práctica y conocimiento en capacidades reales, hábitos de trabajo, evidencia de avance y productividad aplicada.

**Roles reales del sistema (no inventes otros):**

| Rol | Descripción |
|-----|-------------|
| `Admin` | Super-admin de la plataforma (gestión global de empresas, cursos, contenido) |
| `Business` | Administrador de una organización cliente (panel de negocio, analítica, reportes) |
| `BusinessUser` | Empleado de la organización (consume cursos, rutas, notebook, SofLIA chat) |

No existen "estudiantes consumer", "mentores", "founders" ni "comunidades públicas" como entidades del sistema. Si un caso de uso lo requiere, mapéalo a estos roles (p. ej., "mentor" → `Business` admin o un futuro sub-rol de `BusinessUser` con permisos de revisión, y decláralo explícitamente como decisión de diseño).

---

## CONTEXTO TÉCNICO ACTUAL (base sobre la que se construye)

**Stack:** Monorepo con Screaming Architecture por features. Next.js 15 (App Router, API routes = backend real) + React 18 + TypeScript estricto + TailwindCSS. Supabase (PostgreSQL + Auth + Storage + **RLS multi-tenant por organización**). Zustand + SWR. IA vía **Google Gemini** (`lib/gemini/`, `lib/lia/`). Validación con Zod. i18n es/en/pt. Sin webhooks — solo REST.

**El Libro de Apuntes YA EXISTE como módulo v1** (`features/notebook/`):

- Editor rico **TipTap 3.x** (Highlight, TaskList, TextAlign, etc.), páginas en `[orgSlug]/business-user/notebook` (lista con árbol) y `/notebook/[noteId]` (editor).
- **Árbol de dos niveles: Curso → Lección → Notas**, estrictamente acotado a la organización actual del usuario (`NotebookTree` en `features/notebook/types.ts`).
- **Fuentes de nota ya soportadas** (`NotebookNoteSource`): `manual`, `chat` (respuestas de SofLIA guardadas), `import`, `lesson_auto_note` (auto-notas generadas por IA por lección), `course_compendium` (compendio IA por curso).
- **Tags por nota** (máx. 20), título (máx. 256), contenido HTML TipTap (máx. 50.000 caracteres).
- **Tablas existentes:** `user_lesson_notes` (notas del usuario, con RLS self-or-org-admin), `lesson_auto_notes` (auto-notas IA), notas de compendio de curso. Cascadas de borrado y RLS ya definidas en `supabase/migrations/`.
- Servicios: `notebook.server.service.ts`, `notebook.client.service.ts`, `lesson-auto-note.service.ts`, `note.service.ts` (en `features/courses/`).

**Infraestructura IA y de contexto ya disponible:**

- SofLIA chat con historial persistente (`lia_conversations`, `lia_messages`), contexto dinámico (`lib/lia-context/`), multilingüe.
- SofLIA Dialogue Engine (actividades conversacionales con evaluación), Study Planner con Gemini 2.5 y acciones proactivas vía tags `<action>JSON</action>`.
- Capa de seguridad en `lib/security/` (detección de prompt injection en todos los endpoints IA, audit log, rate limiting) y circuit breaker (`lib/resilience/`) para llamadas a Gemini/Supabase.
- Analítica existente: reports-analytics (org) y business-user-analytics (personal) con caché de insights IA en BD.
- Rutas de aprendizaje (`learning_paths` + asignaciones org/usuario), skills (`skills`, `user_skills`), certificados, tracking de progreso por lección/curso.

**Lo que NO existe todavía (y debes diseñar):** embeddings/pgvector, búsqueda semántica, relaciones entre notas, notas a nivel de proyecto/área (fuera de curso-lección), conocimiento compartido/organizacional, conversación con los apuntes, automatizaciones de revisión/resumen periódico.

**Módulos del ecosistema PulseHub aún no presentes en este repositorio** (Project Hub, IRIS, Tool Library, Meeting Intelligence, Deep Research, Web Agent): trátalos como **integraciones futuras**; define solo los contratos/puntos de extensión, no dependas de ellos para el MVP.

---

## OBJETIVO

Diseña la evolución del Libro de Apuntes de su v1 actual (libreta rica ligada a curso/lección) hacia un **segundo cerebro operativo**: el núcleo de conocimiento del ecosistema SofLIA donde los usuarios capturan, organizan, relacionan, consultan, reutilizan y transforman conocimiento de forma continua — y donde SofLIA usa ese conocimiento como memoria contextual.

Entrega una propuesta completa (estratégica, funcional y técnica) con **gap analysis explícito entre v1 y la visión**, y un roadmap incremental que no rompa lo existente.

---

## 1. Visión estratégica

1. Diferencia entre libreta digital, repositorio de notas y segundo cerebro con IA — y en qué punto del espectro está la v1 actual.
2. Cómo el Libro de Apuntes se convierte en memoria personal, de aprendizaje, de equipo y organizacional dentro de un contexto B2B multi-tenant.
3. Conexión con las capacidades existentes: SofLIA chat, Dialogue Engine, Study Planner, analítica, rutas de aprendizaje y skills.
4. Valor diferencial para cada rol real: `BusinessUser`, `Business` y `Admin`.
5. Por qué esto es ventaja competitiva frente a LMS tradicionales, en línea con la tesis de "Sistema de Adopción Organizacional de IA".

## 2. Principios de diseño

Define los principios rectores, incluyendo al menos: captura sin fricción, organización asistida por IA, recuperación contextual, relación entre apuntes/cursos/rutas/conversaciones/tareas, conversación con la memoria, trazabilidad aprendizaje→aplicación, control del usuario sobre su conocimiento, separación personal/compartido/organizacional, privacidad y gobernanza (respetando RLS por organización), y reutilización del conocimiento para producir acciones y documentos.

## 3. Arquitectura del conocimiento

1. Parte de la taxonomía actual (Curso → Lección → Nota + tags + source) y propón cómo extenderla: áreas, proyectos, temas, conceptos, fuentes, habilidades (conectando con `skills`/`user_skills`), rutas de aprendizaje, roles y nivel de dominio.
2. Tipos de conocimiento a soportar: apuntes personales, apuntes de curso/lección (existen), derivados de conversaciones con SofLIA (existe `source: 'chat'`), Q&A, resúmenes estratégicos (existe compendio), reflexiones, decisiones, tareas derivadas, recursos/fuentes, conceptos clave, evidencias de aplicación y conexiones entre notas.
3. Evalúa PARA, Zettelkasten, grafos de conocimiento, competency-based learning y memoria contextual con embeddings. **Indica cuál recomiendas para SofLIA, qué combinar y qué evitar en la primera iteración por complejidad innecesaria** — considerando que la base instalada ya piensa en curso/lección.

## 4. Flujo de captura de conocimiento

1. Fuentes de captura: texto manual (existe), desde lección (existe), desde respuesta de SofLIA (existe), voz, PDFs/documentos subidos (hay `lib/upload/` con whitelist de buckets), páginas web, video; y como extensión futura: reuniones, deep research, herramientas externas.
2. Pipeline de enriquecimiento IA por captura (vía Gemini, con circuit breaker y detección de prompt injection): título sugerido, resumen ejecutivo, ideas clave, conceptos, tareas detectadas, decisiones, etiquetas propuestas, vinculación automática a curso/lección/ruta/skill, nivel de confianza, conexiones con notas previas, clasificación temporal/permanente/accionable/referencia.
3. Define el **modelo mínimo de metadatos por nota**, partiendo de los campos actuales (título, contenido HTML, tags, source, curso, lección, timestamps) y especificando qué campos nuevos se agregan y por qué: resumen, fuente externa, proyecto, ruta, skills, tipo de conocimiento, confianza, próximas acciones, relaciones, permisos, estado del ciclo de vida.
4. Especifica si el enriquecimiento es síncrono o asíncrono (jobs), cómo se reintenta y cómo se controla el costo de tokens.

## 5. Memoria e inteligencia contextual

1. Cómo SofLIA recupera apuntes relevantes cuando el usuario estudia, conversa o revisa una lección — integrándose con `lib/lia-context/` existente.
2. Estrategia de recuperación: **pgvector en Supabase** (justifica dimensiones, modelo de embeddings compatible con el stack Gemini, índices HNSW/IVFFlat), combinada con filtros estructurados (org, curso, permisos vía RLS) y contexto actual.
3. Cómo decidir qué mostrar y qué omitir; cómo evitar ruido, notas desactualizadas o de baja confianza contaminando respuestas.
4. Clasificación de memoria: personal, de aprendizaje, de equipo, organizacional, temporal, permanente, accionable, validada — y cómo el usuario confirma, edita, archiva o elimina recuerdos.
5. Reglas de gobernanza de la IA al usar apuntes personales vs. compartidos vs. organizacionales (nunca cruzar límites de organización; RLS como última línea de defensa, autorización en servicio como primera).

## 6. Experiencia de usuario

1. Flujos: crear apunte manual, desde lección, guardar respuesta de SofLIA (mejorar los existentes), capturar reflexión/decisión, transformar apunte en tarea/documento/material de estudio, compartir con equipo u organización.
2. Vistas: parte del árbol actual y propón cuáles agregar y en qué orden — timeline, por curso/lección (existe), por ruta, por skill, grafo de conocimiento, mapa de temas, biblioteca de fuentes, tareas derivadas, Q&A, resúmenes, conocimiento compartido/organizacional. **Prioriza: no todas caben en el MVP.**
3. Búsqueda: keyword, semántica, filtros, conversacional ("qué aprendí", "qué decidí", "qué tengo pendiente", "qué se repite"), por fuente/curso/lección/skill.
4. Experiencia de "conversar con mis apuntes" con ejemplos concretos de preguntas.
5. Respeta las convenciones UI del proyecto: tema claro/oscuro, branding por organización (`useBusinessPanelTheme()`), `PremiumSelect` en vez de `<select>` nativo, toasts `top-right` para feedback de acciones, i18n es/en/pt sin texto hardcodeado, mobile-first, componentes <300 líneas.

## 7. Integración con el ecosistema

1. Integraciones internas concretas (existen hoy): SofLIA chat/Dialogue Engine, Study Planner, cursos/lecciones, rutas de aprendizaje, skills, analítica personal y organizacional, panel de negocio, certificados.
2. Integraciones futuras (solo contratos): Project Hub, IRIS, Tool Library, Meeting Intelligence, Deep Research, Web Agent.
3. Acciones que SofLIA puede ejecutar desde/sobre el notebook (siguiendo el patrón `<action>JSON</action>` del Study Planner): crear apuntes, vincular, resumir, generar tareas/checklists/flashcards/guías de estudio, detectar brechas de conocimiento, preparar reportes para `Business`, proponer próximos pasos, generar evidencia de progreso.

## 8. Modelo de datos y arquitectura técnica

1. **Gap analysis del esquema**: qué se conserva de `user_lesson_notes` / `lesson_auto_notes` / compendios, qué se extiende con columnas y qué requiere tablas nuevas. Propón la **estrategia de migración sin pérdida de datos ni ruptura de la v1** (migraciones seguras y reversibles en `supabase/migrations/`).
2. Tablas nuevas sugeridas (propósito, campos, relaciones, RLS, índices): notas extendidas o `note_metadata`, `note_relations`, `note_embeddings` (pgvector), `sources`, `derived_tasks`, `note_shares`/permisos, `ai_enrichment_jobs`, auditoría. Reutiliza lo que ya existe (`organizations`, `usuarios`, `cursos`, `lecciones`, `learning_paths`, `skills`, `lia_conversations`) — no dupliques entidades.
3. Consideraciones explícitas: RLS multi-tenant y multiempresa, separación contenido original / resumen / enriquecimiento IA, versionado de notas, retención y privacidad (PII), costo y estrategia de re-embedding al editar, paginación real, prevención de N+1, escalabilidad a decenas de miles de notas por organización.
4. Backend: API routes de Next.js con Zod (patrón actual), jobs asíncronos para enriquecimiento (evalúa Netlify Functions/cron ya usados vs. colas), idempotencia en operaciones críticas, observabilidad y logs sin PII.

## 9. Casos de uso prioritarios para MVP

Define los casos de uso de la primera iteración, **con los roles reales**:

1. `BusinessUser` que toma apuntes por lección y los enriquece con IA.
2. `BusinessUser` que guarda respuestas de SofLIA y luego conversa con sus apuntes.
3. `BusinessUser` que convierte apuntes en tareas o material de repaso.
4. Equipo (vía jerarquía org existente) que comparte conocimiento curado.
5. `Business` admin que ve conocimiento agregado/anonimizado: conceptos más consultados, brechas, evidencia de aplicación.
6. `Admin` de plataforma que audita salud y adopción del módulo.

Para cada uno: usuario, problema, flujo ideal, funcionalidades necesarias, resultado esperado, métrica de éxito, complejidad técnica y riesgo principal.

## 10. Automatizaciones inteligentes

Propón automatizaciones (resumen diario/semanal, detección de ideas repetidas y conceptos no dominados, flashcards, tareas automáticas, conexiones entre conceptos, reportes, recomendación de recursos, alertas de conocimiento obsoleto, resúmenes por curso/periodo). Para cada una: disparador, datos que usa, salida, nivel de intervención humana, riesgo, cómo validar utilidad y **costo estimado en llamadas IA**. Indica cuáles corren como cron (patrón Netlify Functions existente) y cuáles on-demand.

## 11. Analítica, medición e impacto

Métricas separadas en cuatro niveles — actividad, aprendizaje, aplicación e impacto organizacional — integrables con los dashboards existentes (business-user-analytics y reports-analytics): apuntes creados/vinculados, respuestas guardadas, tareas generadas/completadas, conceptos más consultados y más confusos, evolución de dominio por skill, reutilización de conocimiento, evidencia de aplicación. Define qué se cachea server-side (patrón `business_user_analytics_insight_cache`).

## 12. Gobernanza, privacidad y permisos

1. Modelo de visibilidad: privado (default), compartido con equipo, compartido con organización, archivado, restringido. Justifica si "compartido con revisor/mentor" entra en v1 dado que el rol no existe hoy.
2. Qué ve `Business` (agregado/anonimizado vs. contenido literal), consentimiento, datos sensibles, curaduría humana obligatoria antes de promover conocimiento personal a organizacional, auditoría de acciones IA sobre el conocimiento (integrada con `security-audit-log`).
3. Cómo se implementa cada nivel con RLS + autorización en capa de servicio.

## 13. Riesgos y decisiones críticas

Riesgos con mitigación: exceso de información, mala clasificación automática, recuperación irrelevante, privacidad insuficiente, fricción de captura, dependencia excesiva de IA, duplicidad de notas, alucinaciones en enriquecimiento, confusión personal/organizacional, complejidad prematura, **costos de embeddings y tokens Gemini**, dificultad para medir valor.

Decisiones críticas pre-construcción: alcance del MVP, nivel de automatización inicial, modelo de permisos, estructura de datos (extender vs. tablas nuevas), estrategia de búsqueda (¿semántica en MVP o fase 2?), qué es manual vs. automático, y qué queda explícitamente fuera de la v1.

## 14. Roadmap de implementación

Fases: **MVP → Beta → Avanzada → Visión futura**, partiendo de que la v1 (libreta + auto-notas + compendios) ya está en producción. Para cada fase: objetivo, funcionalidades incluidas/excluidas, cambios de esquema requeridos, complejidad, dependencias (p. ej., pgvector antes de búsqueda semántica), riesgos, criterios de éxito y métricas de validación. El roadmap debe ser realista para un equipo pequeño que quiere validar adopción rápido sin sobrediseñar.

## 15. Entregable final

Formato de **blueprint estratégico, funcional y técnico**: resumen ejecutivo, tesis del módulo, propuesta de valor, principios, arquitectura de conocimiento, gap analysis v1→visión, flujos, UX, modelo de datos con estrategia de migración, integraciones, casos de uso MVP, automatizaciones, métricas, riesgos, roadmap y recomendaciones finales.

**Reglas de la respuesta:**

- Lenguaje claro, estratégico y accionable; nada genérico. Todo aterrizado a SofLIA Learning como sistema B2B de adopción organizacional de IA.
- En cada decisión de diseño: recomendación explícita, alternativas, trade-offs e implicaciones.
- Ejemplos prácticos dentro de SofLIA Learning (cursos, rutas, SofLIA chat, panel de negocio).
- Respeta las restricciones duras del proyecto: multi-tenant con RLS, sin webhooks (solo REST), TypeScript estricto, i18n es/en/pt, seguridad IA obligatoria (prompt injection, audit log, rate limiting), plataforma B2B pura sin features consumer.
- No propongas reescrituras del módulo existente cuando una extensión incremental logre el mismo resultado.
