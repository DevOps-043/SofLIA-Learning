# Completar el sistema de apuntes y cuaderno de aprendizaje

## Resumen y estado verificado

El sistema todavía no está completo ni es confiable en producción:

- En `board-vision/stack-tech-1` hay un curso finalizado con 16 lecciones, pero no existe ningún apunte automático ni compendio del curso. El usuario conserva cuatro notas manuales.
- Globalmente existen 66 apuntes automáticos, pero ningún `course_compendium`. Los disparadores actuales usan operaciones `fire-and-forget`, que pueden perderse al terminar una petición serverless.
- Las notas manuales pueden quedar sin organización porque el API descarta `organization_id`; parecen guardadas localmente, pero luego pueden desaparecer del cuaderno o no entrar al compendio.
- Las conversaciones se filtran por `activity_id`, aunque el chat actual no persiste ese dato ni `enrollment_id`; por ello SofLIA no aporta su conversación a los apuntes.
- Los dos trabajos reales de enriquecimiento agotaron sus reintentos por respuestas JSON inválidas.
- `Prompt.md` es una visión de producto y el blueprint declara explícitamente que es un documento de diseño; varias capacidades descritas allí aún no tienen implementación funcional.

Se completará el núcleo solicitado y la Fase 1 del “segundo cerebro”: apuntes automáticos por lección, conversación cruda y retroalimentación, notas manuales/chat persistentes, compendio vivo al finalizar, PDF, enriquecimiento revisable, tareas globales, búsqueda y observabilidad. Búsqueda semántica, conversación RAG sobre el cuaderno, colaboración y Hub organizacional quedan fuera de esta entrega.

## Cambios de implementación

### Persistencia y trabajos confiables

- Añadir una migración aditiva con:
  - `notebook_ai_generation_jobs`: cola durable para `lesson_auto_note` y `course_compendium`, con objetivo, usuario, organización, inscripción, curso/lección, `source_hash`, estado, intentos, arrendamiento, próximo intento y error.
  - `notebook_generated_artifacts`: resultado estructurado y versionado enlazado al registro compatible de `user_lesson_notes`.
  - `notebook_artifact_evidence`: evidencia completa y ordenada de mensajes visibles, respuestas, entregas y feedback público, sin depender del límite de 50 000 caracteres del HTML.
- Mantener `user_lesson_notes` como índice y representación compatible. Los apuntes generados serán de solo lectura; las notas manuales y de chat seguirán siendo editables.
- Ampliar metadatos con procedencia de pregunta/respuesta de SofLIA, revisión del enriquecimiento y ciclo de vida de tareas.
- Corregir las seis notas existentes sin organización derivándola de su inscripción y regenerar los tipos de Supabase.
- Aplicar RLS por autor, organización e inscripción; el cliente nunca podrá elegir arbitrariamente otra organización o convertir una nota manual en generada.

### Generación por lección

- Reemplazar todos los disparadores `fire-and-forget` por una inserción de cola esperada e idempotente. La finalización de la lección o curso no dependerá de que Gemini responda.
- Generar un apunte para cada lección completada, aunque no tenga quiz o conversación:
  1. Resumen de lo trabajado.
  2. Conversación cruda con SofLIA en orden, con rol y fecha.
  3. Retroalimentación: aciertos, correcciones, vacíos y recomendaciones.
  4. Conceptos y evidencias.
  5. Aplicación práctica y siguiente acción.
  6. Preguntas de repaso.
- Guardar `organization_id`, `enrollment_id`, `course_id`, `lesson_id` y, cuando corresponda, `activity_id` en las conversaciones nuevas. Recuperar todas las conversaciones pertenecientes a la lección, no únicamente las asociadas a una actividad.
- La sección cruda incluirá solamente mensajes visibles del usuario y SofLIA y feedback destinado al alumno. Excluirá mensajes de sistema, prompts, rúbricas internas, `instructor_summary` y razonamiento del evaluador.
- Si no hubo conversación, mostrarlo explícitamente y construir el apunte con contenido, progreso, quiz y actividades disponibles; nunca inventar diálogo.
- Una nueva conversación o evaluación posterior marcará el apunte como obsoleto y encolará una regeneración usando un nuevo `source_hash`.
- Ejecutar un worker cada minuto, reclamando trabajos con bloqueo seguro. Usará tres reintentos con backoff y conservará siempre una versión determinista `partial` si falla la IA.
- Centralizar la generación estructurada en `@google/genai`, con esquema JSON, validación Zod, timeout, circuit breaker, auditoría, métricas y detección de prompt injection. Gemini admite salidas restringidas por esquema mediante [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).

### Compendio al finalizar el curso

- Al pulsar “Finalizar curso”:
  - Confirmar la finalización inmediatamente.
  - Encolar los apuntes de lecciones faltantes u obsoletos.
  - Encolar un único compendio idempotente.
  - Mostrar el estado `queued`, `processing`, `partial`, `ready` o `failed`.
- El compendio esperará los trabajos activos de las lecciones. Después de 15 minutos podrá publicar una versión parcial con `missingArtifacts` y se regenerará automáticamente cuando llegue la evidencia pendiente.
- La síntesis incluirá:
  - Resumen ejecutivo.
  - Resúmenes por módulo y lección.
  - Conceptos dominados y evidencias.
  - Dudas, brechas y temas a reforzar.
  - Decisiones, compromisos y tareas.
  - Plan práctico de 7 y 30 días.
  - Preguntas de recuperación y repaso.
  - Referencias verificables a notas y evidencias reales.
- Para cursos grandes se aplicará una síntesis por módulos y una reducción final. Las referencias inventadas por el modelo se descartarán.
- El HTML guardado será únicamente una vista previa cacheada. La pantalla y el PDF compondrán en vivo todas las notas automáticas, manuales, de chat e importadas, evitando que el límite de almacenamiento omita contenido.
- El botón cambiará a “Ver cuaderno” cuando esté listo y ofrecerá reintento cuando haya un fallo recuperable.

### Cuaderno, notas manuales y Fase 1

- Resolver organización e inscripción en el servidor al crear, actualizar o eliminar una nota. Todos los CRUD se acotarán por usuario, organización, inscripción y lección.
- “Guardar respuesta de SofLIA” conservará pregunta, respuesta, conversación y mensajes de origen; se registrará como `source_type: chat` y `knowledge_type: qa`.
- Hacer durable la cola de enriquecimiento, permitir reintentar trabajos agotados y crear un backfill para notas previas.
- Separar sugerencias de IA de contenido confirmado. El usuario podrá aceptar, editar o descartar resumen, conceptos y tareas.
- Completar el cuaderno con:
  - Línea de tiempo reciente.
  - Badges de fuente y estado.
  - Vista global de tareas con estados pendiente/en progreso/completada/descartada.
  - Búsqueda paginada en servidor por contenido y título.
  - Filtros por curso, lección, fuente, tipo de conocimiento y ciclo de vida.
  - Compendio visible en el árbol desde que queda encolado.
- Traducir toda la experiencia a ES/EN/PT, incluidos modal de finalización, estados, errores y reintentos; mantener tema claro/oscuro, branding organizacional y diseño móvil.

## Contratos públicos

- Incorporar:

```ts
type GenerationStatus =
  | 'queued'
  | 'processing'
  | 'partial'
  | 'ready'
  | 'failed'
  | 'stale';

interface GenerationState {
  targetType: 'lesson_auto_note' | 'course_compendium';
  status: GenerationStatus;
  noteId?: string;
  retryable: boolean;
  updatedAt: string;
}

interface CourseNotebookView {
  state: GenerationState;
  sourceHash: string;
  generatedAt?: string;
  summary: CourseNotebookSummary | null;
  chapters: NotebookModuleChapter[];
  missingArtifacts: string[];
}
```

- La respuesta de finalización incluirá `notebookGeneration`, con estado de la lección y, cuando corresponda, del compendio.
- Añadir endpoints REST organizacionales para:
  - Consultar estados de generación por curso/lección.
  - Reintentar un apunte.
  - Crear o regenerar el compendio, devolviendo `202`.
  - Obtener `CourseNotebookView`.
  - Exportar el compendio completo a PDF.
  - Revisar/reintentar enriquecimientos.
  - Consultar notas y tareas mediante cursor y filtros.
- Las peticiones de notas aceptarán `manual`, `chat` o `import`; `chat` requerirá procedencia válida. Organización, autor e inscripción se derivarán y validarán en servidor.

## Migración, pruebas y aceptación

- Desplegar primero las tablas y RLS con el worker desactivado; ejecutar el backfill y validar conteos. Activar después para `board-vision/stack-tech-1` y finalmente de forma global.
- Conservar los 66 apuntes automáticos existentes y adjuntarles artefactos sin sobrescribir su contenido hasta una regeneración explícita.
- Encolar compendios para inscripciones ya finalizadas y enriquecimientos para notas elegibles.
- Registrar profundidad y antigüedad de colas, latencia, reintentos, resultados parciales, validaciones JSON, modelo y tokens; los logs no contendrán conversación ni datos personales.
- Actualizar `Prompt.md`, el blueprint y la documentación técnica con una matriz “diseñado/implementado/verificado”, el flujo durable real y el nombre canónico de configuración del Hub.

Pruebas obligatorias:

- Unitarias para hashes, transcript, exclusión de datos internos, fallback determinista, citas, síntesis por módulos y estados.
- Integración API/Supabase para RLS, aislamiento entre organizaciones, CRUD, cola idempotente, reintentos y carreras.
- Casos con conversación, sin conversación, múltiples sesiones y diálogo posterior a la finalización.
- Gemini caído o JSON inválido: el curso finaliza, aparece un apunte parcial y el usuario puede reintentar.
- Repetir quiz, finalizar lección o pulsar “Finalizar curso” no crea duplicados.
- Una nota manual o de chat continúa visible después de recargar y entra en el compendio.
- E2E del curso objetivo: 16 apuntes automáticos, las cuatro notas manuales del usuario incluidas, un solo compendio, navegación y PDF funcionales.
- Pruebas ES/EN/PT, móvil, claro/oscuro y accesibilidad.
- Ejecutar los tests específicos, type-check, lint y build completos. Los 54 tests unitarios actuales permanecen como regresión base.

Supuestos adoptados al no recibirse una preferencia adicional:

- Se implementa núcleo + Fase 1, no las fases semánticas/sociales del blueprint.
- Toda lección completada genera apunte, no únicamente las que contienen quiz.
- El cuaderno es vivo y exportable: las notas futuras actualizan su estado y provocan regeneración de la síntesis.
- La indisponibilidad de IA nunca impide completar una lección o curso.
