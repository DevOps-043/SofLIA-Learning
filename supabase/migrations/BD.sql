-- ============================================================================
-- BD.sql
-- ============================================================================
-- Estado original encontrado el 2026-04-09: archivo vacío.
-- Este documento reconstruye el dominio de reportes usado actualmente por
-- SofLIA y deja el contrato mínimo necesario para la futura integración IRIS.
--
-- IMPORTANTE:
-- - Este archivo es una referencia técnica del dominio de reportes.
-- - Debe revisarse manualmente antes de ejecutarse como migración real.
-- - La fuente operativa del dominio sigue siendo la base real + types.ts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: public.reportes_problemas
-- Propósito:
--   Incidencias manuales y automáticas reportadas desde SofLIA.
-- ----------------------------------------------------------------------------
create table if not exists public.reportes_problemas (
  id uuid primary key,
  user_id uuid not null references public.users(id),
  titulo text not null,
  descripcion text not null,
  categoria text not null,
  prioridad text null,
  estado text null,
  pagina_url text not null,
  pathname text null,
  user_agent text null,
  screen_resolution text null,
  navegador text null,
  pasos_reproducir text null,
  comportamiento_esperado text null,
  screenshot_url text null,
  session_recording text null,
  recording_size text null,
  recording_duration integer null,
  admin_asignado uuid null references public.users(id),
  notas_admin text null,
  metadata jsonb null,
  created_at timestamptz null,
  updated_at timestamptz null,
  resuelto_at timestamptz null
);

comment on table public.reportes_problemas is
'Incidencias de plataforma y contenido reportadas desde SofLIA.';

comment on column public.reportes_problemas.categoria is
'Valores esperados en aplicación: bug, sugerencia, contenido, performance, ui-ux, otro.';

comment on column public.reportes_problemas.prioridad is
'Valores esperados en aplicación: baja, media, alta, critica.';

comment on column public.reportes_problemas.estado is
'Valores esperados en aplicación: pendiente, en_revision, en_progreso, resuelto, rechazado, duplicado.';

comment on column public.reportes_problemas.metadata is
'JSONB estructurado con source, originContext, courseContext, attachments, irisSync, liaContext y clientContext.';

-- ----------------------------------------------------------------------------
-- Metadata JSONB recomendada
-- ----------------------------------------------------------------------------
-- {
--   "source": "manual_modal | lia_chat_automatic | lia_course_chat",
--   "fromLia": true,
--   "reportedAt": "2026-04-09T00:00:00.000Z",
--   "originContext": {
--     "paginaUrl": "https://...",
--     "pathname": "/courses/slug/learn",
--     "currentPage": "/courses/slug/learn",
--     "currentTab": "video | activities | questions",
--     "pageType": "course_lesson | workshop_lesson | ..."
--   },
--   "courseContext": {
--     "contextType": "course | workshop",
--     "courseId": "uuid",
--     "courseSlug": "slug",
--     "courseTitle": "Curso",
--     "moduleId": "uuid",
--     "moduleTitle": "Módulo",
--     "lessonId": "uuid",
--     "lessonTitle": "Lección"
--   },
--   "attachments": [
--     {
--       "kind": "image",
--       "fileName": "captura.png",
--       "mimeType": "image/png",
--       "size": 12345,
--       "publicUrl": "https://...",
--       "storagePath": "report-..."
--     }
--   ],
--   "irisSync": {
--     "externalSystem": "IRIS",
--     "status": "pending | sent | skipped",
--     "externalIssueId": null,
--     "lastAttemptAt": null
--   },
--   "liaContext": {
--     "conversationId": "uuid",
--     "recordingStatus": "active | error | unavailable",
--     "hasSessionRecording": true,
--     "recordingUrl": "https://..."
--   },
--   "clientContext": {
--     "userAgent": "...",
--     "screenResolution": "1920x1080",
--     "browser": "chrome"
--   }
-- }

-- ----------------------------------------------------------------------------
-- Vista: public.reportes_con_usuario
-- Uso actual:
--   Endpoint GET /api/reportes
-- ----------------------------------------------------------------------------
-- Columnas observadas en types.ts:
-- - id, user_id, titulo, descripcion, categoria, prioridad, estado
-- - pagina_url, pathname, navegador, screen_resolution
-- - pasos_reproducir, comportamiento_esperado, screenshot_url
-- - admin_asignado, admin_nombre
-- - username, display_name, email, user_role
-- - metadata, created_at, updated_at, resuelto_at

-- ----------------------------------------------------------------------------
-- Función: public.get_reportes_stats()
-- Uso actual:
--   Dashboard/estadísticas admin de reportes
-- ----------------------------------------------------------------------------
-- Retorna observado en types.ts:
-- - total_reportes
-- - pendientes
-- - en_revision
-- - en_progreso
-- - resueltos
-- - por_categoria (json)
-- - tiempo_promedio_resolucion

-- ----------------------------------------------------------------------------
-- Storage bucket requerido
-- ----------------------------------------------------------------------------
-- Bucket esperado por aplicación:
--   reportes-screenshots
--
-- Uso:
-- - screenshot_url: evidencia visual primaria
-- - session_recording: replay o archivo de sesión rrweb
-- - metadata.attachments[]: adjuntos adicionales listos para IRIS

-- ----------------------------------------------------------------------------
-- Reglas de integración con IRIS
-- ----------------------------------------------------------------------------
-- 1. SofLIA crea primero en reportes_problemas.
-- 2. IRIS consume por integración; no debe mutar el dominio directo.
-- 3. metadata.irisSync.status inicia en "pending".
-- 4. Al sincronizar, guardar externalIssueId y lastAttemptAt.
-- 5. Mantener screenshot_url por compatibilidad con la UI admin actual.

-- ============================================================================
-- CERTIFICADOS
-- Nota importante:
--   Este archivo era insuficiente como fuente de verdad para certificados.
--   La implementaciÃ³n operativa ahora depende de:
--   - supabase/migrations/20260411173000_certificate_snapshots_and_backfill.sql
--   - apps/web/src/lib/supabase/types.ts
-- ============================================================================

-- Tabla: public.user_course_certificates
-- Columnas relevantes observadas/esperadas:
-- - certificate_id uuid pk
-- - user_id uuid fk -> users.id
-- - course_id uuid fk -> courses.id
-- - enrollment_id uuid fk -> user_course_enrollments.enrollment_id
-- - organization_id uuid fk -> organizations.id
-- - template_id uuid fk -> certificate_templates.id
-- - certificate_url text not null
-- - certificate_hash text
-- - issued_at timestamptz not null
-- - expires_at timestamptz
-- - created_at timestamptz not null
-- - branding_snapshot jsonb
-- - document_snapshot jsonb

-- branding_snapshot:
-- {
--   "platform": {
--     "name": "SofLIA",
--     "logoUrl": "/icono.png"
--   },
--   "issuer": {
--     "organizationId": "uuid | null",
--     "name": "Empresa emisora",
--     "logoUrl": "https://... | null"
--   },
--   "visualTokens": {
--     "primaryColor": "#0A2540",
--     "accentColor": "#00D4B3",
--     "borderColor": "#D6E3F1",
--     "backgroundColor": "#F7FBFF",
--     "textColor": "#0F172A",
--     "mutedColor": "#475569"
--   },
--   "legacyMode": false
-- }

-- document_snapshot:
-- {
--   "learnerName": "Nombre alumno",
--   "courseTitle": "Curso",
--   "instructorName": "Instructor",
--   "instructorSignatureUrl": "https://... | null",
--   "instructorSignatureName": "Firma textual | null",
--   "issuedAt": "2026-04-11T18:00:00Z",
--   "programText": "Forma parte del programa de capacitaciÃ³n de Empresa"
-- }

-- Tabla: public.certificate_ledger
-- Uso:
-- - Registro de cadena/hash para verificaciÃ³n
-- - cert_id fk -> user_course_certificates.certificate_id
-- - op, block_hash, prev_hash, payload, created_at

-- Tabla: public.certificate_templates
-- Uso:
-- - ConfiguraciÃ³n visual por organizaciÃ³n
-- - organization_id fk -> organizations.id
-- - design_config jsonb
-- - is_default, is_active

-- FunciÃ³n: public.certificate_hash_immutable(...)
-- Uso:
-- - Genera hash canÃ³nico por certificado
-- - Se usa para backfill y para certificados emitidos antes de snapshot

-- FunciÃ³n: public.validate_certificate(p_hash text)
-- Uso:
-- - Fuente de verdad para verificación pÃºblica
-- - Retorna: certificate_id, chain_ok, course_title, is_expired, is_valid,
--   issued_at, last_block_at, last_op, user_id
