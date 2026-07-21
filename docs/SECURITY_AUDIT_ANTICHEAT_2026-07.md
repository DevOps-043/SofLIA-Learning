# Auditoría de seguridad y anti‑trampa — Cursos (Quiz + Actividad SofLIA)

**Fecha:** 2026‑07‑20
**Contexto:** Tras el preview del 2026‑07‑18 (~25 usuarios), varios alumnos completaron un
curso de ~9 h en ~2 h haciendo trampa. La auditoría del sistema de aprendizaje reveló, además
de los dos huecos de producto reportados (quiz sin límite de intentos; actividad SofLIA que se
"pasa" solo iniciándola), **vulnerabilidades de seguridad más graves** que permitían forjar
puntajes y escribir el progreso directamente desde el navegador.

Este documento inventaría cada hallazgo, su vector de explotación, severidad y estado
(corregido / documentado‑pendiente), y da la recomendación para lo pendiente.

> **Sobre "SQL injection":** el acceso a datos usa el cliente Supabase/PostgREST, que
> **parametriza** todas las consultas. No hay un vector clásico de inyección SQL en este
> código. Los vectores reales de "alterar información / conocer respuestas / pasar
> actividades" son los descritos abajo: **confianza en datos del cliente** y **RLS de
> escritura abierta**, no inyección SQL.

---

## Resumen ejecutivo

| # | Vulnerabilidad | Severidad | Estado |
|---|----------------|-----------|--------|
| V1 | El quiz se calificaba contra la clave de respuestas enviada por el cliente | Crítica | ✅ Corregida |
| V2 | La clave de respuestas del quiz viajaba al navegador (leer respuestas antes de responder) | Alta | ✅ Corregida |
| V3 | Tablas de progreso/actividad escribibles directamente por el cliente (RLS abierta) | Crítica | ✅ Corregida |
| V4 | Quiz sin límite de intentos (fuerza bruta de respuestas) | Alta | ✅ Corregida |
| V5 | Actividad SofLIA no gateaba el avance (solo iniciarla bastaba) | Alta | ✅ Corregida |
| V6 | Tablas `user_quiz_submissions` / `user_quiz_attempts` posiblemente sin RLS | Alta | ✅ Corregida (verificar en BD) |
| V7 | Sin validación server‑side del visionado de video (se puede saltar) | Media | 📋 Documentada (fuera de alcance) |
| V8 | Contenido de reflexión/lectura sin seguimiento de completitud | Media | 📋 Documentada (fuera de alcance) |
| V9 | Rate‑limiting solo global por IP (100/min); sin límite por‑usuario/endpoint | Media | 📋 Documentada (fuera de alcance) |
| V10 | RLS de `lesson_tracking` / `user_course_enrollments` sin confirmar | Media | 📋 Documentada (verificar en BD) |
| V11 | Inconsistencia trigger vs. app en conteo de intentos de diálogo | Baja | 📋 Documentada |

---

## Hallazgos corregidos

### V1 — Calificación del quiz contra la clave enviada por el cliente (CRÍTICA)

- **Vector:** el endpoint `POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit` calificaba
  usando `question.correctAnswer` tomado del **body** de la petición (`quizData`), no del
  contenido almacenado en BD. Un usuario podía interceptar/editar la petición y fijar cada
  `correctAnswer` igual a su respuesta, obteniendo **100 % en el primer intento**. Peor que
  adivinar: ni un límite de 1 intento lo detiene.
- **Corrección:**
  - Nuevo servicio puro `features/courses/services/quiz/grade-quiz.service.ts`: deriva las
    preguntas y su respuesta correcta **desde BD** (`lesson_materials.content_data` /
    `lesson_activities.activity_content`) con la misma normalización que el cliente
    (`resolveQuizPayload` → `normalizeQuizQuestions`) y califica ahí.
  - El endpoint ya **no acepta** `quizData`/`correctAnswer` en el body (schema `quizSubmitSchema`
    en `app/api/courses/_schemas.ts`); solo `answers` + el quiz objetivo.
  - Tests: `grade-quiz.service.test.ts` (incluye caso de inmunidad a clave forjada en `answers`).

### V2 — La clave de respuestas viajaba al navegador (ALTA)

- **Vector:** `content_data` / `activity_content` con `correctAnswer` se enviaban sin filtrar
  en el GET de `learn-data` (y en `activities`/`materials`/`sidebar-data`), permitiendo leer las
  respuestas desde devtools antes de responder.
- **Corrección:**
  - Sanitizador puro `lib/course-content/quiz-sanitize.ts` (`stripQuizAnswerKey`) que elimina
    `correctAnswer`/`correct_answer` de las preguntas.
  - Aplicado en los normalizadores "ForClient" (`normalizeActivityContentForClient`,
    `normalizeMaterialContentForClient`) y en `loadLessonData` (learn‑data ahora normaliza en el
    borde de salida). Todos los endpoints de aprendizaje quedan cubiertos.
  - La respuesta correcta se revela **solo tras el envío**, en la respuesta del endpoint de
    submit (`result.perQuestion[]`), que el cliente fusiona para el repaso.
  - Tests: `quiz-sanitize.test.ts`.
- **Nota / mejora futura:** el texto de `explanation` se conserva (contenido pedagógico mostrado
  tras responder). Si algún autor incrusta la respuesta literal en la explicación, podría
  filtrarse; recomendación: servir `explanation` también solo post‑envío en una fase posterior,
  y/o guía editorial para no poner la respuesta en la explicación.

### V3 — Tablas de progreso/actividad escribibles por el cliente (CRÍTICA)

- **Vector:** RLS de `user_lesson_progress`, `user_activity_submissions` y
  `user_activity_evaluations` tenía políticas `insert/update` para `authenticated` con solo
  `user_id = auth.uid()` y **sin restricción de columnas**. Como todas las escrituras del
  servidor usan service‑role (`createAdminClient`), esas políticas eran superficie de ataque:
  un alumno podía, desde el navegador, `update({ is_completed: true, quiz_passed: true })` o
  `update({ status: 'validated' })` / `insert({ result_status: 'pass' })` directamente,
  saltándose **todo** el gating del servidor.
- **Corrección:** migración `supabase/migrations/20260722100000_lock_progress_write_rls.sql`
  elimina las políticas de escritura de cliente y revoca los grants de escritura a
  `authenticated`, conservando lectura propia/org‑admin y escritura server (service‑role).
  Verificado que ningún componente del navegador escribe esas tablas.

### V4 — Quiz sin límite de intentos (ALTA)

- **Vector:** el endpoint aceptaba reenvíos ilimitados; un alumno adivinaba hasta acertar.
- **Corrección:** servicio `features/courses/services/quiz/quiz-attempt-limit.service.ts`
  (`MAX_QUIZ_ATTEMPTS = 3`, `QUIZ_ATTEMPT_COOLDOWN_HOURS = 24`), enforcement en el handler antes
  de calificar (responde `429 QUIZ_ATTEMPT_LIMIT_REACHED` con `Retry-After`). El conteo se basa
  en `user_quiz_attempts` (ventana de 24 h) y el registro del intento ahora se **espera** (await)
  para que el conteo sea fiable. La progresión ya estaba correctamente bloqueada por
  `validateRequiredQuizzes` mientras el quiz no esté aprobado. Tests:
  `quiz-attempt-limit.service.test.ts`.

### V5 — La actividad SofLIA no gateaba el avance (ALTA)

- **Vector:** el motor de diálogo ya exigía score ≥ umbral + criterios para completar, pero la
  actividad podía **no contar** como requerida (default `is_required = false`, o config no
  resoluble que la excluía del cómputo), permitiendo avanzar habiéndola solo iniciado.
- **Corrección:**
  - Umbral de aprobación **fijo en 60 %** y autoritativo (`SOFLIA_DIALOGUE_APPROVAL_MINIMUM`),
    usado en el policy‑engine y en el prompt del evaluador, **ignorando** `config.approvalMinimum`
    (que una config legacy/manipulada no pueda bajar la barra). Default del schema → 60.
  - `progress-compute.ts`: las actividades SofLIA Dialogue se tratan como **requeridas por
    diseño** (aunque `is_required` sea false) y una actividad interactiva requerida con config
    **no resoluble** cuenta como requerida‑no‑completada (**fail‑closed**, nunca fail‑open).
  - Admin: al elegir el tipo SofLIA Dialogue, `is_required` se marca por defecto.
  - La completitud del diálogo sigue exigiendo `status = 'validated'` (sincronizado solo cuando
    `activityResult === 'completed'`, que ahora requiere ≥ 60 %). Tests actualizados en
    `soflia-dialogue/__tests__` (incluye boundary 59/65 ignorando la config).

### V6 — Tablas de quiz posiblemente sin RLS (ALTA)

- **Vector:** `user_quiz_submissions` / `user_quiz_attempts` predatan el historial de migraciones
  y podían estar sin RLS; con grants por defecto, el navegador podría leer respuestas o forjar
  puntajes/intentos directamente.
- **Corrección:** la misma migración habilita RLS con solo **lectura propia/org‑admin**
  (`user_id = auth.uid() OR can_read_org_user_activity(...)`) + escritura service‑role, y revoca
  grants de escritura a `authenticated`.
- **Verificar en BD (post‑deploy):**
  ```sql
  select relname, relrowsecurity from pg_class
  where relname in ('user_quiz_submissions','user_quiz_attempts');
  -- relrowsecurity debe ser true en ambas.
  ```

---

## Hallazgos documentados (fuera del alcance acordado — siguiente fase)

### V7 — Sin validación server‑side del visionado de video (MEDIA)

`completeLessonProgress` no consulta el estado de video de la lección actual; el gate de video
solo existe en el cliente. Un usuario puede llamar a `POST .../progress` directamente y marcar la
lección completa sin ver el video. Nota: la reproducción a 2× (wall‑clock real) está dentro del
rango permitido por el anti‑cheat del endpoint de tracking y es una decisión de producto; el
problema es que el video **no se exige** server‑side.
- **Recomendación:** en `completeLessonProgress`, requerir
  `user_lesson_progress.video_progress_percentage` (o `lesson_tracking.video_max_seconds` /
  duración) ≥ `LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT` (95 %) para la lección actual.

### V8 — Reflexión/lectura sin seguimiento de completitud (MEDIA)

`isInteractiveLessonActivity` excluye `reading`/`reflection`; no hay tabla ni gate de tiempo de
lectura. Un alumno puede completar sin abrirlas.
- **Recomendación:** registro de lectura (scroll/tiempo mínimo) y contarlas en el gate de
  actividades requeridas.

### V9 — Rate‑limiting solo global por IP (MEDIA)

Solo aplica el límite genérico `RATE_LIMITS.api` (100 req/min por IP) a quiz/progress/dialogue.
No hay límite por‑usuario/por‑endpoint.
- **Recomendación:** límites dedicados por‑usuario en `quiz/submit`, `progress` y
  `dialogue/message` (el límite de 3 intentos + cooldown de V4 ya mitiga la fuerza bruta del quiz).

### V10 — RLS de `lesson_tracking` / `user_course_enrollments` sin confirmar (MEDIA)

No se pudo confirmar desde el repo el estado de RLS de estas tablas (predatan las migraciones).
`user_course_enrollments.overall_progress_percentage` escribible por el cliente sería un vector
para inflar el progreso del curso.
- **Verificar en BD:**
  ```sql
  select relname, relrowsecurity from pg_class
  where relname in ('lesson_tracking','user_course_enrollments');
  ```
  Si RLS está deshabilitada y hay grants a `authenticated`, aplicar el mismo patrón que la
  migración `20260722100000` (habilitar RLS, solo lectura propia/org‑admin, revocar escritura de
  cliente). Se dejó fuera de la migración aplicada por mayor blast‑radius (enrollments es central)
  y por acordarse "solo lo pedido".

### V11 — Inconsistencia trigger vs. app en intentos de diálogo (BAJA)

El trigger `enforce_soflia_dialogue_session_attempt_limit` cuenta **todas** las sesiones por
`(user_id, activity_id, enrollment_id)`, mientras la app cuenta solo estados terminales. Pueden
divergir en ciertas secuencias de reinicio. Afecta contabilidad de intentos, no el gating de
completado.
- **Recomendación:** alinear el trigger con el conteo por‑estado de la app.

---

## Cómo validar (QA)

1. **V1:** enviar a `/quiz/submit` con `quizData` en el body → 400 (schema lo rechaza). El puntaje
   refleja la clave de BD, no el body. `grade-quiz.service.test.ts`.
2. **V2:** inspeccionar el GET de learn‑data → sin `correctAnswer` en las preguntas; el repaso
   post‑envío muestra aciertos desde la respuesta del servidor.
3. **V3/V6:** desde el navegador autenticado, intentar
   `supabase.from('user_lesson_progress').update({ is_completed: true })`,
   `.from('user_activity_submissions').update({ status: 'validated' })` y
   `.from('user_quiz_submissions').insert({...})` → deben fallar por permisos.
4. **V4:** fallar 3 veces → 4.º envío `429` con `Retry-After`; avance bloqueado hasta el cooldown.
5. **V5:** diálogo con score 55 → `needs_retry`, no avanza; 65 → completa, avanza; solo iniciar →
   sin submission validada → no avanza; config rota en actividad requerida → cuenta como
   no‑completada (fail‑closed).
6. Ejecutar `npm run type-check`, `npm run lint` y los tests unitarios nuevos/tocados (Vitest).
