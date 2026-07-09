# Libro de Apuntes de SofLIA Learning — Blueprint: Evolución a "Segundo Cerebro Operativo"

**Estado:** Blueprint estratégico, funcional y técnico (documento de diseño — no incluye cambios de código).
**Audiencia:** ingeniería de plataforma, producto, y equipo/agente que opera SofLIA Hub.
**Base:** módulo `features/notebook/` v1 en producción, esquema real de `supabase/migrations/`, roles organizacionales reales y la integración existente con el agente de SofLIA Hub.
**Relacionado:** `CLAUDE.md`, `docs/SOFLIA_HUB_NOTIFICATIONS_WHATSAPP_TELEGRAM.md`, `Prompt.md`.

---

## 1. Resumen ejecutivo

SofLIA Learning ya tiene un Libro de Apuntes v1 funcional: editor rico TipTap, árbol Curso → Lección → Notas acotado por organización, auto-notas IA por lección (`lesson_auto_notes`), compendios IA por curso, guardado de respuestas de SofLIA (`source: 'chat'`) y tags. Es una **libreta digital contextualizada al curso** — captura bien, pero el conocimiento capturado es pasivo: no se relaciona, no se recupera automáticamente, no alimenta a SofLIA y no produce acciones.

Este blueprint define la evolución incremental hacia un **segundo cerebro operativo**: el conocimiento del empleado se enriquece automáticamente con IA (resumen, conceptos, tareas detectadas, clasificación), se vuelve recuperable semánticamente (pgvector + embeddings Gemini), alimenta la memoria contextual de SofLIA ("conversar con mis apuntes"), se comparte con curación humana dentro de la jerarquía organizacional existente (equipo → zona → región → organización), y se extiende fuera de la plataforma a través del **agente de SofLIA Hub** (captura y repaso vía WhatsApp/Telegram).

**Tesis central:** en un Sistema de Adopción Organizacional de IA, el diferenciador no es el contenido del curso sino la **evidencia de que el aprendizaje se convierte en trabajo aplicado**. El Libro de Apuntes es el lugar donde esa conversión ocurre y queda registrada: apunte → concepto dominado → tarea derivada → decisión documentada → conocimiento de equipo. Ningún LMS tradicional cierra ese ciclo.

**Decisiones principales de este blueprint:**

| Decisión | Recomendación |
|---|---|
| Estrategia de esquema | **Extender, no reescribir**: `user_lesson_notes` se conserva intacta; el enriquecimiento vive en tablas satélite 1:1 y 1:N |
| Modelo de organización del conocimiento | **PARA-lite + capa semántica** (embeddings); NO Zettelkasten ni grafo visual en fases 1–2 |
| Búsqueda | Keyword + filtros en MVP; semántica (pgvector, `gemini-embedding-001` a 768 dims, HNSW) en Beta |
| Enriquecimiento IA | **Asíncrono** vía cola propia + Netlify scheduled function (patrón ya probado en notificaciones), idempotente por hash de contenido |
| Compartir conocimiento | Solo scope `team` con curación obligatoria de `team_leader` en Beta; organización completa en fase Avanzada |
| Integración externa | **Únicamente el agente de SofLIA Hub**: saliente (digests/repasos por la cola de entregas existente) en fase Avanzada-temprana; entrante (captura desde WhatsApp/Telegram) después de resolver la multi-tenencia del Hub |

---

## 2. Visión estratégica

### 2.1 Libreta → repositorio → segundo cerebro (y dónde está la v1)

| Nivel | Qué hace | Estado en SofLIA |
|---|---|---|
| **Libreta digital** | Capturar y editar notas con formato | ✅ v1 (TipTap, árbol curso/lección) |
| **Repositorio organizado** | Clasificar, etiquetar, buscar por estructura | ⚠️ Parcial (tags y árbol existen; sin búsqueda, sin tipos de conocimiento, sin estados) |
| **Segundo cerebro con IA** | El sistema entiende, conecta, recupera y actúa sobre el conocimiento; el conocimiento vuelve al usuario en el momento de necesidad | ❌ No existe (sin embeddings, sin relaciones, sin memoria contextual, sin acciones derivadas) |

La v1 está en la frontera entre nivel 1 y 2. El salto de valor no es "más features de notas": es que **SofLIA use los apuntes como memoria** y que **los apuntes produzcan salidas operativas** (tareas, material de repaso, conocimiento de equipo, evidencia de aplicación).

### 2.2 Cuatro memorias en un contexto B2B multi-tenant

1. **Memoria personal** (`member`): todo lo que el empleado captura; privada por defecto, protegida por RLS (`user_id = auth.uid()`), nunca cruza el límite de la organización.
2. **Memoria de aprendizaje**: la unión de apuntes + auto-notas + compendios + Q&A con SofLIA, vinculada a curso/lección/ruta/skill; es la que alimenta el repaso y la detección de brechas.
3. **Memoria de equipo** (scope `team` de la jerarquía existente): apuntes promovidos por el `member` y **curados por el `team_leader`** antes de ser visibles; convierte aprendizaje individual en práctica compartida.
4. **Memoria organizacional** (`admin`/`owner`): dos formas estrictamente separadas — (a) conocimiento curado y promovido explícitamente desde equipos, y (b) **analítica agregada y anonimizada** (conceptos más consultados, brechas), nunca contenido literal de notas privadas.

### 2.3 Valor por rol organizacional

| Rol | Valor |
|---|---|
| `member` | Captura sin fricción, enriquecimiento automático, repaso personalizado (in-app y por WhatsApp/Telegram vía Hub), "pregúntale a tus apuntes", tareas derivadas de lo aprendido |
| `team_leader` | Visibilidad del conocimiento que su equipo decide compartir, curación en un clic, detección de brechas del equipo, material de onboarding derivado |
| `zone_manager` / `regional_manager` | Agregados por scope (zona/región): adopción del módulo, conceptos con más confusión, evidencia de aplicación |
| `admin` / `owner` | Dashboard organizacional de conocimiento (agregado/anonimizado), base de conocimiento organizacional curada, evidencia de ROI del programa de adopción de IA |

### 2.4 Ventaja competitiva

Un LMS mide "completó el curso". SofLIA, con este módulo, mide y demuestra: *qué entendió* (apuntes + conceptos), *qué le costó* (preguntas recurrentes, conceptos confusos), *qué aplicó* (tareas derivadas completadas, decisiones documentadas) y *qué quedó para la organización* (conocimiento de equipo curado). Esa trazabilidad aprendizaje→aplicación es exactamente la tesis de "Sistema de Adopción Organizacional de IA" y no es replicable por bibliotecas de contenido genéricas. Además, el canal Hub (WhatsApp/Telegram) lleva el repaso al lugar donde el empleado ya vive, algo que ningún LMS tradicional B2B ofrece con despliegue por cliente.

---

## 3. Principios de diseño

1. **Captura sin fricción** — guardar algo nunca requiere más de una acción; clasificar es opcional, la IA propone.
2. **La IA propone, el humano dispone** — todo enriquecimiento IA es editable, descartable y visiblemente marcado como generado por IA (patrón ya usado en `isAutoGenerated`).
3. **Recuperación contextual, no archivo muerto** — el valor de una nota se realiza cuando reaparece en el momento correcto (estudiando la lección, conversando con SofLIA, repasando).
4. **Privado por defecto, compartido por decisión, organizacional por curación** — tres niveles con fronteras explícitas; promover conocimiento siempre requiere acción humana (del autor) + curación humana (del `team_leader` o manager del scope).
5. **RLS como última línea de defensa, autorización de servicio como primera** — toda query pasa por el patrón existente: verificación de membresía/rol en la capa de servicio + políticas RLS por organización.
6. **Trazabilidad aprendizaje→aplicación** — cada nota puede producir tareas, decisiones y evidencias, y esas salidas quedan vinculadas a la nota, el curso y la skill de origen.
7. **El usuario es dueño de su memoria** — puede ver qué sabe SofLIA de él (sus notas usadas como contexto), corregirlo, archivarlo o eliminarlo; el borrado es real (cascada a metadata, embeddings y relaciones).
8. **Extensión incremental sobre la v1** — nada de este blueprint rompe `user_lesson_notes`, el árbol actual ni los flujos existentes; cada fase es aditiva.
9. **Costo IA controlado por diseño** — enriquecimiento asíncrono, idempotente por hash, por lotes, con presupuesto por organización y circuit breaker (`lib/resilience/`).
10. **Seguridad IA obligatoria** — todo contenido de usuario que entra a un prompt pasa por la detección de prompt injection de `lib/security/` y se enmarca como datos, no instrucciones; toda acción IA sobre conocimiento queda en `security-audit-log`.

---

## 4. Arquitectura del conocimiento

### 4.1 Taxonomía: extender la actual, no reemplazarla

La taxonomía v1 (Curso → Lección → Nota, + tags + `source`) es correcta para una plataforma donde el aprendizaje ocurre en cursos. Se extiende con **tres ejes ortogonales** (columnas/tablas nuevas, no jerarquías nuevas):

| Eje | Valores | Cómo se materializa |
|---|---|---|
| **Tipo de conocimiento** (`knowledge_type`) | `note` (default), `reflection`, `decision`, `qa`, `resource`, `evidence` | Columna en la tabla de metadatos; la IA lo sugiere, el usuario confirma |
| **Ciclo de vida** (`lifecycle_status`) | `draft`, `enriched`, `reviewed`, `actionable`, `archived`, `shared`, `promoted` | Columna en metadatos; gobierna qué entra a la memoria contextual |
| **Vinculación** | curso/lección (existen), ruta de aprendizaje, skill, concepto | FKs opcionales a `learning_paths` y `skills`; conceptos como jsonb normalizado (ver 4.3) |

**Qué NO agregar en fases 1–2:** carpetas libres, áreas/proyectos arbitrarios, jerarquías paralelas al árbol de cursos. Razón: la base instalada piensa en curso/lección; duplicar jerarquías fragmenta el conocimiento y multiplica la complejidad de RLS. "Proyectos" quedan para la fase Visión (cuando exista una entidad de proyecto real en la plataforma).

### 4.2 Evaluación de modelos

| Modelo | Veredicto | Razón |
|---|---|---|
| **PARA** | ✅ Adoptar versión "lite" | Áreas ≈ cursos/rutas (ya existen); Recursos ≈ `knowledge_type: resource`; Archivo ≈ `lifecycle_status: archived`. Proyectos se difieren. No requiere UI nueva |
| **Zettelkasten** | ❌ Evitar | Exige disciplina de vinculación manual atómica; en B2B corporativo la adopción moriría por fricción. Las relaciones las propone la IA (ver `notebook_note_relations`) |
| **Grafo de conocimiento (UI)** | ⏳ Fase Visión | Alto costo de construcción, valor demostrativo pero no operativo hasta tener masa crítica de relaciones |
| **Mapas mentales** | ❌ Evitar | Feature de nicho; el compendio por curso ya cumple el rol de síntesis |
| **Competency-based** | ✅ Integrar | `skills`/`user_skills` ya existen; vincular notas a skills habilita "evolución de dominio por skill" en analítica |
| **Memoria contextual con embeddings** | ✅ Núcleo de la evolución | Es lo que convierte el repositorio en segundo cerebro; ver §6 |

**Recomendación:** PARA-lite (estados + tipos sobre la jerarquía de cursos existente) + skills + capa semántica de embeddings. Todo lo demás se aplaza.

### 4.3 Conceptos clave

Los "conceptos" (ej. *RAG*, *prompt engineering*, *fine-tuning*) son la unidad que conecta notas entre sí y con la analítica. Se extraen por IA en el enriquecimiento y se normalizan en una tabla `notebook_concepts` por organización (nombre canónico + alias), para que "conceptos más confusos del equipo" sea una consulta agregable y no un análisis de texto libre.

---

## 5. Flujo de captura y enriquecimiento

### 5.1 Fuentes de captura por fase

| Fuente | Estado | Fase |
|---|---|---|
| Texto manual (editor TipTap) | ✅ Existe | — |
| Desde lección (auto-notas IA) | ✅ Existe | — |
| Respuesta de SofLIA (`source: 'chat'`) | ✅ Existe — mejorar: guardar también la pregunta (par Q&A) | MVP |
| Compendio por curso | ✅ Existe | — |
| Documento subido (PDF/DOCX) | `lib/upload/` con whitelist de buckets ya existe; extraer texto + enriquecer | Beta |
| **WhatsApp/Telegram vía agente SofLIA Hub** (texto, nota de voz transcrita, documento) | Contrato en §8 | Avanzada |
| Página web / video / reuniones | — | Visión |

### 5.2 Pipeline de enriquecimiento IA (asíncrono)

```
Guardar nota (API route existente)
  └─ INSERT en notebook_ai_enrichment_jobs (idempotente: UNIQUE(note_id, content_hash))
       └─ Netlify scheduled function `process-notebook-enrichment` (cada 2–5 min, batch 20)
            ├─ 0. Sanitización + escaneo prompt-injection del contenido (lib/security/)
            ├─ 1. UNA llamada a Gemini con salida estructurada (JSON validado con Zod):
            │     { title_suggestion, summary, key_concepts[], detected_tasks[],
            │       detected_decisions[], suggested_tags[], knowledge_type,
            │       confidence (0–1), related_skill_slugs[] }
            ├─ 2. UPSERT notebook_note_metadata (marcado ai_generated, editable)
            ├─ 3. Chunking del texto plano (~800 tokens, overlap 100) →
            │     gemini-embedding-001 → UPSERT notebook_note_embeddings   [desde Beta]
            ├─ 4. Sugerencia de relaciones: top-k vecinos semánticos con
            │     similitud > umbral → INSERT notebook_note_relations
            │     (created_by='ai', estado sugerido)                        [desde Beta]
            └─ 5. security-audit-log + actualización de job (done/failed, attempts++)
```

**Reglas operativas:** reintentos con backoff (patrón `attempts`/`max_attempts`/`next_attempt_at` idéntico a `notification_channel_deliveries`); circuit breaker de `lib/resilience/` alrededor de Gemini; si el contenido no cambió (mismo hash), el job no se encola — ediciones cosméticas no cuestan tokens; presupuesto mensual de enriquecimiento por organización (columna en config de org) con corte suave (se pausa enriquecimiento, nunca la captura).

**Síncrono vs. asíncrono — decisión:** asíncrono. Alternativa síncrona (enriquecer al guardar) da feedback inmediato pero acopla el guardado a la latencia/disponibilidad de Gemini y dispara costo en cada autosave de TipTap. El editor guarda instantáneo; el enriquecimiento aparece segundos/minutos después con un indicador "SofLIA está procesando tu apunte".

### 5.3 Modelo mínimo de metadatos por nota

Campos actuales (se conservan): título, contenido HTML, tags, `source`, curso, lección, timestamps, `isAutoGenerated`.

Campos nuevos (tabla satélite, ver §9): `summary`, `knowledge_type`, `lifecycle_status`, `confidence`, `key_concepts`, `related_skill_ids`, `learning_path_id`, `source_url` (para capturas externas), `next_actions` (denormalizado de tareas derivadas), `visibility` + datos de curación, `ai_enriched_at`, `content_hash`.

---

## 6. Memoria e inteligencia contextual

### 6.1 Recuperación: pgvector + filtros estructurados

- **Extensión:** `pgvector` en Supabase (soporte nativo).
- **Modelo de embeddings:** `gemini-embedding-001` (mismo stack `@google/genai` ya usado). **Dimensiones: 768** por truncamiento Matryoshka (el modelo emite hasta 3072; 768 reduce 4× almacenamiento y cómputo de índice con pérdida de calidad marginal para este dominio). Registrar `embedding_model` y `dims` por fila para permitir migración futura.
- **Índice:** HNSW con `vector_cosine_ops` (mejor recall/latencia que IVFFlat para colecciones que crecen incrementalmente; no requiere re-entrenamiento del índice).
- **Función de búsqueda:** RPC `match_notebook_chunks(query_embedding, target_user_id, target_org_id, top_k, min_similarity)` como `SECURITY DEFINER` que **impone** los filtros de usuario/organización/visibilidad en SQL — el filtro de seguridad nunca depende del caller. La búsqueda híbrida = este RPC + filtros estructurados (curso, tipo, estado, fechas) + re-ranking por recencia y `confidence`.

### 6.2 Qué entra a la memoria de SofLIA (y qué no)

Nuevo proveedor de contexto `notebook` en `lib/lia-context/` (mismo patrón que los contextos de curso/planner existentes):

| Regla | Detalle |
|---|---|
| Elegibilidad | Solo notas `lifecycle_status IN ('enriched','reviewed','actionable')`; `draft` y `archived` nunca entran; `confidence < 0.4` excluidas |
| Presupuesto | Máx. 3–5 chunks por turno, con cita de origen (nota + lección) para que el usuario audite de dónde salió |
| Frescura | Score = similitud × factor de recencia; una nota contradicha por otra más nueva del mismo concepto pierde peso |
| Anti-ruido | Umbral de similitud mínimo (~0.75 coseno); si nada supera el umbral, SofLIA no inyecta memoria (mejor sin memoria que con memoria irrelevante) |
| Gobernanza | Contexto personal solo del propio usuario; contexto de equipo solo si la nota está `shared` y curada; jamás contenido de otra organización (filtro SQL + RLS) |
| Control del usuario | UI "¿Por qué SofLIA sabe esto?" → lista de notas usadas como contexto en la respuesta, con acciones editar/archivar/excluir de memoria (`memory_opt_out` boolean por nota) |

### 6.3 Clasificación de memoria

`personal` (default), `de aprendizaje` (vinculada a curso/skill), `de equipo` (shared+curada), `organizacional` (promoted), `temporal` (auto-archivado sugerido a los N días si no se consulta), `permanente` (marcada por el usuario), `accionable` (con tareas derivadas abiertas), `validada` (reviewed por humano — pesa más en recuperación). No son tablas: son combinaciones de `visibility` + `lifecycle_status` + `knowledge_type` + señales de uso.

---

## 7. Experiencia de usuario

### 7.1 Flujos (delta sobre lo existente)

1. **Guardar respuesta de SofLIA** (mejora): guarda el par pregunta+respuesta como `knowledge_type: 'qa'`, con vínculo a `lia_conversations`; sugerencia proactiva de SofLIA ("¿Guardo esto en tu libreta?") vía patrón `<action>JSON</action>`.
2. **Capturar decisión/reflexión**: mismo editor, selector de tipo (chips, no modal); la IA lo pre-clasifica.
3. **Nota → tarea**: las `detected_tasks` del enriquecimiento aparecen como checklist accionable dentro de la nota; confirmar crea filas en `notebook_derived_tasks` (visibles en una vista propia y como recordatorios).
4. **Nota → material de estudio**: acción "Generar repaso" (on-demand) produce flashcards/quiz breve desde las notas de un curso.
5. **Compartir con el equipo**: botón "Proponer al equipo" → estado `pending` → el `team_leader` aprueba/rechaza desde el panel (toasts `top-right`, patrón estándar).

### 7.2 Vistas — priorización

| Prioridad | Vista | Fase |
|---|---|---|
| P0 | Árbol curso/lección (existe) + **estados y tipos visibles** en las cards | MVP |
| P0 | **Timeline** ("mi aprendizaje reciente") — barata: ORDER BY updated_at + filtros | MVP |
| P1 | **Tareas derivadas** (pendientes/completadas) | MVP |
| P1 | **Búsqueda global** (keyword+filtros MVP; semántica+conversacional Beta) | MVP/Beta |
| P2 | Conocimiento del equipo (recibido y propuesto) | Beta |
| P2 | Vista por skill / por ruta | Beta |
| P3 | Q&A guardadas, biblioteca de fuentes, resúmenes | Avanzada |
| P4 | Grafo de conocimiento, mapa de temas | Visión |

### 7.3 "Conversar con mis apuntes"

Entrada dedicada en el notebook que abre SofLIA con contexto `notebook` fijado. Ejemplos: *"¿Qué aprendí sobre prompt engineering este mes?"*, *"¿Qué decidí sobre la herramienta de análisis en el curso de datos?"*, *"¿Qué tengo pendiente de los últimos apuntes?"*, *"¿Qué conceptos se me repiten y aún marco como confusos?"*, *"Hazme un repaso de 5 preguntas de la lección 3"*. Cada respuesta cita las notas fuente (link al editor).

### 7.4 Convenciones UI obligatorias

Tema claro/oscuro; branding por organización vía `useBusinessPanelTheme()` (nunca `var(--dash-*)`); `PremiumSelect` en vez de `<select>`; toasts `top-right` + `refetchSilent()` tras mutaciones (nunca banners inline ni reload); i18n es/en/pt — el volumen de claves nuevas (>50) justifica **namespace dedicado `notebook`** registrado en `core/i18n/i18n.ts`, migrando gradualmente las claves actuales de `common.json`; mobile-first; componentes <300 líneas con hooks `use[Feature]Logic`.

---

## 8. Integración con el ecosistema

### 8.1 Integraciones internas (existentes)

| Módulo | Integración |
|---|---|
| SofLIA chat (`lia_conversations`) | Guardar Q&A; proveedor de contexto `notebook`; acciones `<action>JSON</action>` |
| Dialogue Engine | Al cerrar un diálogo con resultado, ofrecer "guardar aprendizajes de esta actividad" como nota `evidence` |
| Study Planner | Sesión de estudio completada → sugerir apunte de sesión; tareas derivadas visibles como micro-pendientes del plan |
| Cursos/lecciones | Ya integrado (auto-notas, compendio); los intro-videos y el tracking no cambian |
| Rutas y skills | Vinculación en metadatos; alimenta "dominio por skill" |
| Analítica | Nuevas secciones en business-user-analytics (personal) y reports-analytics (org), con caché server-side (patrón `business_user_analytics_insight_cache`) |
| Notificaciones | Nuevos `notification_type` para digest/repaso (ver 8.2) |

### 8.2 Agente de SofLIA Hub — contrato de integración

**Contexto real:** cada organización despliega su propia instancia de SofLIA Hub en su VPS. Hoy existe el canal saliente: cola `notification_channel_deliveries` + cron `process-notification-deliveries.ts` con POST firmado HMAC (`X-Soflia-Signature`, env `SOFLIA_HUB_NOTIFICATIONS_URL`/`SOFLIA_HUB_API_KEY`). Brecha documentada: configuración global, no por organización. Existe además `lib/security/trusted-agent-auth/` + `POST /api/security/agent-handshake` para autenticación agente-a-agente.

**Prerrequisito (bloqueante para ambas direcciones en producción multi-cliente):** tabla `organization_hub_config` (`organization_id` PK/FK, `hub_url`, `api_key_hash` — la key en secreto por org, no en texto plano —, `enabled_channels jsonb`, `notebook_features jsonb`, `status`). Cierra la brecha del doc de notificaciones y da al notebook un switch por organización.

**Dirección saliente (plataforma → Hub) — Fase Avanzada-temprana, bajo riesgo:**

Se reutiliza la cola existente sin cambios estructurales. Nuevos tipos de notificación:

| `notification_type` | Contenido del payload | Disparador |
|---|---|---|
| `notebook_weekly_digest` | Resumen semanal: notas creadas, conceptos nuevos, tareas abiertas (texto renderizado + deep-link) | Cron semanal |
| `notebook_review_reminder` | 1–3 flashcards de repaso espaciado de conceptos con baja confianza | Cron según curva de repaso |
| `notebook_task_reminder` | Tareas derivadas próximas a vencer | Cron diario |

Respeta `user_notification_preferences` (canal habilitado + ventana do-not-disturb) y el gating por organización. Idempotencia: `dedup_key` existente.

**Dirección entrante (Hub → plataforma) — Fase Avanzada, tras vinculación de identidad verificada:**

El empleado escribe/manda audio o documento al bot del Hub de su organización → el Hub lo transcribe/normaliza → llama a la plataforma:

```
POST /api/agent/notebook/capture
Auth: cabeceras trusted-agent (lib/security/trusted-agent-auth/) +
      firma HMAC del body con la key de LA organización (organization_hub_config)
Body: {
  idempotency_key: string,          // UUID del Hub — reintentos seguros
  organization_id: uuid,            // debe coincidir con la credencial firmante
  linked_user_ref: string,          // identidad verificada (opt-in del doc de Hub, §vinculación)
  channel: 'whatsapp' | 'telegram',
  content_type: 'text' | 'voice_transcript' | 'document_text',
  content: string,                  // texto plano, límite 20k chars
  captured_at: timestamptz
}
→ 201 { note_id } | 200 (replay idempotente) | 401/403/422/429
```

Servidor: valida Zod → resuelve `linked_user_ref` → usuario y verifica membresía activa en esa organización → rate limit por org y por usuario → escaneo prompt-injection → crea nota `source: 'hub_agent'` (nuevo valor del enum `NotebookNoteSource`), `lifecycle_status: 'draft'`, sin curso/lección (el usuario la clasifica después o la IA sugiere vínculo) → encola enriquecimiento → `security-audit-log`. La nota aparece en el notebook con badge "capturada por WhatsApp/Telegram".

**Regla de seguridad no negociable:** una credencial de Hub solo puede crear/leer datos de SU organización; el binding credencial↔organización se valida en servidor en cada request (nunca se confía en el `organization_id` del body por sí solo).

### 8.3 Acciones de SofLIA sobre el notebook (patrón `<action>JSON</action>`)

`create_note`, `link_note` (a curso/skill/ruta), `summarize_notes` (periodo/curso), `create_task_from_note`, `generate_flashcards`, `detect_knowledge_gaps` (vs. skills de la ruta asignada), `propose_next_steps`. Cada acción se confirma en UI antes de ejecutarse (mismo modelo de confirmación del Study Planner) y se audita.

---

## 9. Modelo de datos y arquitectura técnica

### 9.1 Gap analysis del esquema

| Existente | Decisión |
|---|---|
| `user_lesson_notes` | **Se conserva intacta** (contenido, título, tags, FKs, RLS, cascadas). Solo se agrega el valor `hub_agent` al dominio de `source` |
| `lesson_auto_notes` | Sin cambios; sus notas participan del enriquecimiento/embeddings como cualquier otra |
| Compendios de curso | Sin cambios |
| RLS self-or-org-admin | Se conserva; las vistas agregadas para managers van por RPC `SECURITY DEFINER` que devuelven solo agregados |

**Por qué tablas satélite y no columnas en `user_lesson_notes`:** (1) el enriquecimiento IA tiene ciclo de vida y escritura propios (jobs) — separar evita contención de updates con el autosave del editor; (2) los embeddings son 1:N (chunks) y de otro tamaño de fila; (3) rollback trivial: se puede desactivar la capa nueva sin tocar la tabla caliente de la v1.

### 9.2 Tablas nuevas

```sql
-- Migración 1 (MVP): metadatos + jobs + tareas
CREATE TABLE notebook_note_metadata (
  note_id uuid PRIMARY KEY REFERENCES user_lesson_notes ON DELETE CASCADE,
  user_id uuid NOT NULL, organization_id uuid NOT NULL,
  knowledge_type text NOT NULL DEFAULT 'note'
    CHECK (knowledge_type IN ('note','reflection','decision','qa','resource','evidence')),
  lifecycle_status text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft','enriched','reviewed','actionable','archived','shared','promoted')),
  summary text, key_concepts jsonb DEFAULT '[]', confidence numeric(3,2),
  related_skill_ids uuid[], learning_path_id uuid REFERENCES learning_paths,
  source_url text, memory_opt_out boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private','team','organization','restricted')),
  content_hash text, ai_enriched_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
-- RLS: SELECT/UPDATE/DELETE propio (user_id = auth.uid()); service_role total.

CREATE TABLE notebook_ai_enrichment_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES user_lesson_notes ON DELETE CASCADE,
  organization_id uuid NOT NULL, job_type text NOT NULL DEFAULT 'enrich',
  content_hash text NOT NULL, status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','done','failed')),
  attempts int NOT NULL DEFAULT 0, max_attempts int NOT NULL DEFAULT 3,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), last_error text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (note_id, content_hash, job_type)          -- idempotencia
);
-- RLS: solo service_role (cola de trabajo, patrón notification_channel_deliveries).

CREATE TABLE notebook_derived_tasks (
  task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES user_lesson_notes ON DELETE CASCADE,
  user_id uuid NOT NULL, organization_id uuid NOT NULL,
  title text NOT NULL, status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','done','dismissed')),
  due_at timestamptz, created_by text NOT NULL CHECK (created_by IN ('ai','user')),
  created_at timestamptz DEFAULT now(), completed_at timestamptz
);
-- RLS: propio; índice (user_id, status, due_at).

-- Migración 2 (Beta): embeddings + relaciones + shares + conceptos
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE notebook_note_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES user_lesson_notes ON DELETE CASCADE,
  user_id uuid NOT NULL, organization_id uuid NOT NULL,
  chunk_index int NOT NULL, chunk_text text NOT NULL,
  content_hash text NOT NULL,
  embedding vector(768) NOT NULL,
  embedding_model text NOT NULL DEFAULT 'gemini-embedding-001',
  created_at timestamptz DEFAULT now(),
  UNIQUE (note_id, chunk_index)
);
CREATE INDEX ON notebook_note_embeddings
  USING hnsw (embedding vector_cosine_ops);
-- RLS: solo service_role; la búsqueda pasa por RPC SECURITY DEFINER con filtros obligatorios.

CREATE TABLE notebook_note_relations (
  from_note_id uuid REFERENCES user_lesson_notes ON DELETE CASCADE,
  to_note_id   uuid REFERENCES user_lesson_notes ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'related',
  created_by text NOT NULL CHECK (created_by IN ('ai','user')),
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','confirmed','dismissed')),
  confidence numeric(3,2), created_at timestamptz DEFAULT now(),
  PRIMARY KEY (from_note_id, to_note_id)
);

CREATE TABLE notebook_note_shares (
  share_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES user_lesson_notes ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope IN ('team','zone','region','organization')),
  scope_id uuid NOT NULL,                    -- FK lógica a organization_teams/zones/regions
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','revoked')),
  requested_by uuid NOT NULL, curated_by uuid, curated_at timestamptz,
  snapshot_content text NOT NULL,            -- lo compartido es un snapshot, no la nota viva
  created_at timestamptz DEFAULT now(),
  UNIQUE (note_id, scope, scope_id)
);
-- RLS: autor ve las suyas; curador (team_leader/manager del scope) ve pending+approved de su scope;
-- miembros del scope ven solo approved. Verificación de scope vía función de membresía de jerarquía.

CREATE TABLE notebook_concepts (
  concept_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL, canonical_name text NOT NULL,
  aliases text[] DEFAULT '{}', created_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, canonical_name)
);

-- Migración 3 (Avanzada): organization_hub_config (ver §8.2)
```

**Snapshot en shares — decisión deliberada:** compartir copia el contenido en ese momento. Evita que ediciones privadas posteriores se filtren al equipo sin nueva curación, y simplifica RLS (el scope lee el snapshot, nunca la nota original).

### 9.3 Consideraciones transversales

- **Migraciones:** aditivas y reversibles (cada una con bloque de rollback documentado); `CREATE INDEX CONCURRENTLY` para índices sobre tablas pobladas; backfill de metadatos por lotes vía job, no en la migración.
- **Escalabilidad:** decenas de miles de notas/org → HNSW escala bien; paginación por cursor en todos los listados nuevos; agregados de analítica precalculados en caché (patrón insight-cache), nunca agregación en caliente sobre contenido.
- **N+1:** el árbol ya se construye en una pasada (`notebook-tree.builder.ts`); las nuevas vistas usan joins explícitos con selección de columnas, nunca fetch por nota.
- **Re-embedding:** debounce por `content_hash`; solo re-embebe chunks cuyo texto cambió.
- **Privacidad/PII:** logs de jobs sin contenido de notas (solo ids y métricas); retención: al borrar nota, cascada borra metadata/embeddings/relaciones/tareas; borrado de usuario ya cubierto por `delete_user_cascade` (extender la función con las tablas nuevas).
- **Backend:** API routes Next.js + Zod (patrón actual); crons como Netlify scheduled functions (patrón existente); idempotencia en capture (Hub) y jobs (hash).

---

## 10. Casos de uso prioritarios (MVP → Beta)

| # | Rol | Caso | Flujo ideal | Métrica de éxito | Complejidad | Riesgo principal |
|---|---|---|---|---|---|---|
| 1 | `member` | Apuntes por lección enriquecidos | Escribe → guarda → segundos después ve resumen, conceptos y tareas sugeridas | ≥60% de notas con enriquecimiento aceptado sin edición | Media | Enriquecimiento de baja calidad → desconfianza |
| 2 | `member` | Guarda Q&A de SofLIA y luego conversa con sus apuntes | Chat → "guardar" → semanas después pregunta y SofLIA cita sus notas | ≥30% de usuarios activos usan "conversar con apuntes" mensualmente | Alta (Beta) | Recuperación irrelevante |
| 3 | `member` | Nota → tareas + repaso vía Hub | Confirma tareas detectadas; recibe digest semanal por WhatsApp/Telegram | ≥40% de tareas derivadas completadas; CTR del digest | Media (saliente Hub) | Fatiga de notificaciones |
| 4 | `member` | Captura desde WhatsApp/Telegram | Manda idea al bot del Hub → aparece como borrador en su notebook | ≥20% de capturas externas curadas después en la plataforma | Alta (Avanzada) | Identidad no verificada / spam |
| 5 | `team_leader` | Cura conocimiento del equipo | Recibe propuestas `pending` → aprueba → el equipo lo ve y SofLIA lo usa como contexto de equipo | ≥1 nota curada/equipo/semana en equipos activos | Media (Beta) | Cuello de botella de curación |
| 6 | `admin`/`owner` | Panel de conocimiento organizacional | Ve agregados anonimizados: conceptos top, conceptos confusos, brechas por skill | Uso mensual del panel; decisiones de formación derivadas | Media | Percepción de vigilancia si no es claramente agregado |

---

## 11. Automatizaciones inteligentes

| Automatización | Disparador | Salida | Canal | Intervención humana | Riesgo | Fase |
|---|---|---|---|---|---|---|
| Enriquecimiento de nota | Guardado (hash nuevo) | Metadatos + embeddings | In-app | Editar/descartar | Clasificación errónea | MVP |
| Detección de tareas | Parte del enriquecimiento | Checklist sugerido | In-app | Confirmación obligatoria | Falsos positivos | MVP |
| Digest semanal | Cron semanal | Resumen + pendientes | In-app + **Hub (WhatsApp/Telegram)** | Opt-out por preferencia | Fatiga | Avanzada-temprana |
| Repaso espaciado (flashcards) | Cron según curva por concepto de baja confianza | 1–3 tarjetas | In-app + Hub | Opt-in | Costo tokens | Avanzada |
| Sugerencia de relaciones | Post-embedding | Relaciones `suggested` | In-app | Confirmar/descartar | Ruido | Beta |
| Conceptos no dominados | Cron semanal (agrega Q&A repetidas + confidence baja) | Alerta personal + insumo analytics | In-app | — | Sobre-señalización | Avanzada |
| Reporte org de conocimiento | Cron mensual → insight-cache | Insights agregados para `admin`/`owner` | Panel de negocio | Lectura | Percepción de vigilancia | Avanzada |
| Alerta de conocimiento obsoleto | Cron: notas `permanent` con conceptos cuyo curso fue actualizado | Sugerencia de revisión | In-app | Confirmar | Falsas alarmas | Visión |

**Control de costos común:** todas las automatizaciones IA corren por lotes en horarios valle, con presupuesto por organización, circuit breaker y validación de utilidad por métrica (tasa de aceptación/CTR); una automatización con <15% de aceptación sostenida se apaga por defecto.

---

## 12. Analítica, medición e impacto

| Nivel | Métricas | Superficie |
|---|---|---|
| **Actividad** | Notas creadas (por source, incl. `hub_agent`), tags, ediciones, búsquedas | business-user-analytics (personal) |
| **Aprendizaje** | Conceptos extraídos/confirmados, confianza media por skill, Q&A guardadas, flashcards acertadas | business-user-analytics + progreso |
| **Aplicación** | Tareas derivadas creadas/completadas, decisiones documentadas, notas `evidence`, notas curadas al equipo | Ambos paneles |
| **Impacto organizacional** | Conceptos top/confusos por scope (equipo/zona/región — solo agregados anonimizados con k-anonimato: nunca mostrar agregados de grupos <5 personas), brechas vs. skills de rutas asignadas, reutilización de conocimiento de equipo | reports-analytics (`admin`/`owner`) |

Todos los agregados organizacionales se sirven desde caché server-side (patrón `business_user_analytics_insight_cache`) recalculada por cron; nunca queries de agregación en caliente sobre contenido de notas.

---

## 13. Gobernanza, privacidad y permisos

### 13.1 Niveles de visibilidad

| Nivel | Quién ve | Cómo se llega |
|---|---|---|
| `private` (default) | Solo el autor | Automático |
| `team` | Miembros del `organization_teams` del share | Autor propone → `team_leader` aprueba (snapshot) |
| `zone`/`region` | Miembros del scope | Igual, curado por `zone_manager`/`regional_manager` — **fase Avanzada**, no v1 |
| `organization` | Toda la organización | Doble curación: `team_leader` + `admin`/`owner` — fase Avanzada |
| `restricted` | Autor + curador designado | Casos sensibles |
| `archived` | Solo autor; fuera de memoria y búsqueda por defecto | Acción del autor o sugerencia automática |

**En Beta solo entra scope `team`.** Razón: es el scope con curador natural (`team_leader`), menor blast radius y valida el modelo de curación antes de escalarlo.

### 13.2 Reglas duras

1. `admin`/`owner` ven **agregados anonimizados**, nunca contenido literal de notas privadas (la RLS actual permite lectura org-admin sobre `user_lesson_notes` para soporte; el panel de analítica NO la usa — consume solo RPCs de agregados). Documentar esto en el consentimiento de onboarding del módulo.
2. Promoción de conocimiento **siempre** = acción del autor + curación humana; ninguna automatización comparte contenido.
3. Toda acción IA sobre conocimiento (enriquecer, sugerir relación, usar como contexto, capturar vía Hub) → `security-audit-log` con actor (`user`/`ai`/`hub_agent`), nota afectada y organización.
4. Contenido de notas jamás sale de la organización: el Hub de una org solo recibe payloads de sus propios usuarios; la credencial firma y limita el tenant.
5. Datos sensibles: el enriquecimiento incluye un clasificador ligero de PII que sugiere `restricted` cuando detecta datos personales de terceros.

---

## 14. Riesgos y decisiones críticas

### 14.1 Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Exceso de información / ruido en memoria | Umbrales de similitud, presupuesto de contexto, estados que excluyen drafts/archivadas, auto-archivado sugerido |
| Mala clasificación automática | IA solo sugiere; confirmación humana para tareas/compartir; medir tasa de aceptación |
| Recuperación irrelevante | Búsqueda híbrida (semántica+filtros), re-ranking por recencia/confianza, citas visibles para auditar |
| Privacidad insuficiente / percepción de vigilancia | Agregados anonimizados con k-anonimato, consentimiento explícito, "por qué SofLIA sabe esto", snapshot en shares |
| Baja adopción por fricción | Captura de 1 acción, clasificación opcional, canal Hub donde el usuario ya vive |
| Dependencia excesiva de IA / alucinaciones | Enriquecimiento marcado como IA, editable; salida estructurada validada con Zod; contenido enmarcado como datos |
| Duplicidad de notas | Detección de casi-duplicados por similitud en el enriquecimiento → sugerir fusión |
| Complejidad prematura | Roadmap por fases; grafo/proyectos/zonas-regiones diferidos explícitamente |
| Costos de embeddings/tokens | 768 dims, hash-gating, lotes, presupuesto por org, circuit breaker, automatizaciones apagables por métrica |
| Hub: identidad no verificada / abuso del endpoint | Vinculación opt-in verificada (prerrequisito), HMAC por org, rate limiting, límites de payload, audit log |
| Dificultad para medir valor | Métricas de 4 niveles definidas desde el MVP; cada fase tiene criterio de éxito medible |

### 14.2 Decisiones críticas pre-construcción (con recomendación)

1. **Alcance MVP:** metadatos+enriquecimiento+tareas+búsqueda keyword+timeline. Sin compartir, sin embeddings. ✔
2. **Automatización inicial:** solo enriquecimiento y detección de tareas; todo lo demás detrás de métricas. ✔
3. **Permisos:** modelo snapshot+curación; solo `team` en Beta. ✔
4. **Integración prioritaria:** Hub saliente antes que entrante (el entrante depende de multi-tenencia y vinculación verificada del Hub). ✔
5. **Datos:** tablas satélite, `user_lesson_notes` intocable. ✔
6. **Búsqueda semántica:** Beta, no MVP — requiere pgvector, pipeline de embeddings y RPC seguro; la keyword valida la demanda primero. ✔
7. **Fuera de la v1 (explícito):** grafo visual, proyectos/áreas libres, scopes zone/region/organization, captura de reuniones/web/video, versionado completo de notas, Telegram/WhatsApp entrante.

---

## 15. Roadmap

### Fase 1 — MVP "Notas que trabajan" (4–6 semanas)

- **Incluye:** `notebook_note_metadata` + `notebook_ai_enrichment_jobs` + `notebook_derived_tasks` (migración 1); pipeline de enriquecimiento asíncrono; par Q&A al guardar desde chat; chips de tipo/estado en UI; vista timeline y vista de tareas; búsqueda keyword+filtros; namespace i18n `notebook`.
- **Excluye:** embeddings, compartir, Hub, automatizaciones cron.
- **Dependencias:** ninguna externa. **Riesgo:** calidad del enriquecimiento → prompt con salida estructurada + evaluación con set de notas reales antes de GA.
- **Criterio de éxito:** ≥50% de usuarios activos del notebook con ≥1 nota enriquecida aceptada; ≥25% confirma al menos una tarea derivada.

### Fase 2 — Beta "Memoria viva" (6–8 semanas)

- **Incluye:** pgvector + embeddings + RPC de búsqueda segura (migración 2); búsqueda semántica y conversacional; proveedor de contexto `notebook` en `lib/lia-context/` con citas y controles de usuario; relaciones sugeridas; compartir scope `team` con curación de `team_leader`; tiles de notebook en business-user-analytics.
- **Dependencias:** Fase 1; extensión `vector` habilitada en Supabase.
- **Riesgos:** recuperación irrelevante (umbral conservador al inicio), costo de backfill de embeddings (por lotes, horario valle).
- **Criterio de éxito:** ≥30% de usuarios usan búsqueda/chat con apuntes mensualmente; precisión percibida (thumbs) >70%; primeras notas curadas por equipo.

### Fase 3 — Avanzada "Conocimiento que circula" (8–10 semanas)

- **Incluye:** `organization_hub_config` + Hub **saliente** (digest semanal, recordatorios de tareas, repaso espaciado); Hub **entrante** (`/api/agent/notebook/capture`, source `hub_agent`) cuando la vinculación de identidad verificada del Hub esté disponible; conceptos normalizados + panel org agregado en reports-analytics (con k-anonimato); flashcards on-demand; captura desde documentos subidos.
- **Dependencias:** Fase 2; del lado Hub: multi-tenencia de configuración y vinculación opt-in verificada (brechas documentadas en `docs/SOFLIA_HUB_NOTIFICATIONS_WHATSAPP_TELEGRAM.md`).
- **Riesgos:** fatiga de notificaciones (frecuencia conservadora + preferencias), abuso del endpoint entrante (rate limit + HMAC + auditoría).
- **Criterio de éxito:** CTR de digest >20%; ≥15% de usuarios con captura externa mensual; panel org consultado mensualmente por `admin`/`owner`.

### Fase 4 — Visión

Grafo de conocimiento navegable; scopes zone/region/organization con doble curación; memoria proactiva en todas las superficies de SofLIA (el contexto de notas acompaña cada conversación); detección de brechas conectada a asignación automática sugerida de rutas; captura de reuniones y fuentes web; entidad de "proyecto" si la plataforma la incorpora.

---

## 16. Recomendaciones finales de implementación

1. **Empezar por la migración 1 y el pipeline de enriquecimiento** — es el 80% del valor percibido con el 20% del riesgo, y no toca nada existente.
2. **Evaluar la calidad del enriquecimiento con notas reales** (set de ~50 notas es/en/pt) antes de activarlo por defecto; el primer contacto del usuario con "IA que entiende mis apuntes" define la adopción.
3. **No construir el endpoint entrante del Hub hasta cerrar la multi-tenencia** (`organization_hub_config`) y la vinculación de identidad — el orden inverso crea deuda de seguridad.
4. **Instrumentar desde el día 1**: tasa de aceptación de enriquecimiento, uso de búsqueda, tareas confirmadas — las fases 2–3 se aprueban o recortan con esos datos.
5. **Extender `delete_user_cascade` y las cascadas de curso** en la misma migración que cree cada tabla nueva — la integridad de borrado es parte del contrato, no un follow-up.
6. **Mantener el principio rector:** cada fase debe poder detenerse y dejar un producto coherente; el segundo cerebro se construye por capas de valor, no por big bang.
