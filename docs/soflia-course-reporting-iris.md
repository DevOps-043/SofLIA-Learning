# SofLIA Cursos: Reportes con Imagen e Integración IRIS

## Estado encontrado

El sistema de reportes sí sigue activo después de la refactorización, pero estaba fragmentado:

- `reportes_problemas` sigue siendo la tabla central de incidencias.
- `apps/web/src/app/api/reportes/route.ts` permite reportes manuales.
- `apps/web/src/app/api/lia/chat/chat-response.formatter.ts` ya guardaba reportes automáticos desde SofLIA general usando `[[BUG_REPORT:{...}]]`.
- `apps/web/src/features/admin/services/adminReportes.service.ts` y `apps/web/src/features/admin/components/ViewReporteModal.tsx` consumen ese dominio.

## Huecos detectados antes del cambio

- SofLIA dentro de cursos no enviaba el contexto de bug reporting que sí tenía SofLIA general.
- El chat de cursos no aceptaba evidencia visual.
- `metadata` en `reportes_problemas` era demasiado ambiguo para conectar luego con IRIS.
- `supabase/migrations/BD.sql` estaba vacío, así que no servía como referencia del dominio.

## Cambios aplicados

### 1. Contrato unificado de reportes

Se creó un contrato compartido en:

- `apps/web/src/core/reporting/report-problem.contract.ts`

Este contrato define:

- categorías y prioridades válidas
- adjuntos visuales (`LiaImageAttachment`)
- metadata estructurada para reportes
- estado de sincronización con IRIS

### 2. Backend de reportes más claro

Se centralizó la lógica de adjuntos y metadata en:

- `apps/web/src/core/reporting/report-problem.server.ts`

Ahora el backend:

- valida imágenes
- sube evidencia a `reportes-screenshots`
- conserva `screenshot_url` por compatibilidad
- guarda metadata explícita y lista para IRIS

### 3. SofLIA cursos ya puede reportar con imagen

Se extendió el flujo de cursos para:

- adjuntar imágenes directamente en el chat
- forzar contexto de reporte cuando hay evidencia visual
- capturar snapshot de sesión con rrweb
- guardar el reporte automático con contexto de curso/lección

Archivos principales:

- `apps/web/src/core/hooks/useLiaCourseChat.ts`
- `apps/web/src/features/courses/components/CourseLia.tsx`
- `apps/web/src/app/api/lia/chat/route.ts`
- `apps/web/src/app/api/lia/chat/chat-response.formatter.ts`

### 4. Reporte manual dentro del panel de cursos

Se agregó la entrada manual desde el panel de SofLIA en cursos usando el modal existente, pero ahora enviando contexto útil del curso:

- curso
- módulo
- lección
- pestaña actual
- origen del reporte

Archivo clave:

- `apps/web/src/core/components/ReporteProblema/ReporteProblema.tsx`

### 5. Admin con más contexto operativo

La vista admin ahora puede mostrar mejor:

- origen del reporte
- curso/lección asociados
- estado de sincronización con IRIS

Archivos:

- `apps/web/src/features/admin/services/adminReportes.service.ts`
- `apps/web/src/features/admin/components/ViewReporteModal.tsx`

## Metadata recomendada en `reportes_problemas.metadata`

```json
{
  "source": "manual_modal | lia_chat_automatic | lia_course_chat",
  "fromLia": true,
  "reportedAt": "2026-04-09T00:00:00.000Z",
  "originContext": {
    "paginaUrl": "https://...",
    "pathname": "/cursos/...",
    "currentPage": "/cursos/...",
    "currentTab": "video | activities | questions",
    "pageType": "course_lesson | workshop_lesson | ..."
  },
  "courseContext": {
    "contextType": "course | workshop",
    "courseId": "uuid",
    "courseSlug": "slug",
    "courseTitle": "Curso",
    "moduleId": "uuid",
    "moduleTitle": "Módulo",
    "lessonId": "uuid",
    "lessonTitle": "Lección"
  },
  "attachments": [
    {
      "kind": "image",
      "fileName": "captura.png",
      "mimeType": "image/png",
      "size": 12345,
      "publicUrl": "https://...",
      "storagePath": "report-..."
    }
  ],
  "irisSync": {
    "externalSystem": "IRIS",
    "status": "pending | sent | skipped",
    "externalIssueId": null,
    "lastAttemptAt": null
  },
  "liaContext": {
    "conversationId": "uuid",
    "recordingStatus": "active | error | unavailable",
    "hasSessionRecording": true,
    "recordingUrl": "https://..."
  },
  "clientContext": {
    "userAgent": "...",
    "screenResolution": "1920x1080",
    "browser": "chrome"
  }
}
```

## Mapeo recomendado hacia IRIS

### Campos mínimos

| SofLIA | IRIS |
| --- | --- |
| `id` | `external_reference` |
| `titulo` | `title` |
| `descripcion` | `description` |
| `categoria` | `issue_type` |
| `prioridad` | `priority` |
| `estado` | `status` |
| `pagina_url` / `pathname` | `location` |
| `metadata.courseContext.*` | `course_context` |
| `screenshot_url` | `primary_attachment_url` |
| `metadata.attachments[]` | `attachments[]` |
| `session_recording` o `metadata.liaContext.recordingUrl` | `session_replay_url` |
| `user_id` | `reporter_user_id` |

### Reglas operativas

- `reportes_problemas` sigue siendo la fuente de verdad en SofLIA.
- IRIS debe consumir por integración, no escribir directamente el dominio de SofLIA.
- El primer sync debe marcar `metadata.irisSync.status = sent` y guardar `externalIssueId`.
- Si falla el sync, dejar `pending` y registrar `lastAttemptAt`.

## Flujo recomendado con IRIS

1. SofLIA crea el reporte en `reportes_problemas`.
2. Un worker o webhook detecta `metadata.irisSync.status = pending`.
3. Se transforma el payload al contrato de IRIS.
4. IRIS crea la incidencia.
5. SofLIA actualiza `metadata.irisSync`.

## Decisiones para no aumentar deuda técnica

- No se introdujo `any`.
- Se mantuvo `screenshot_url` por compatibilidad con admin y reportes actuales.
- La integración futura con IRIS se resuelve vía `metadata.irisSync`, evitando migraciones apresuradas.
- El contrato de adjuntos y metadata quedó centralizado en un solo módulo compartido.
