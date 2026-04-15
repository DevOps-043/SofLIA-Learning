BEGIN;

ALTER TABLE public.user_course_certificates
  ADD COLUMN IF NOT EXISTS branding_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS document_snapshot jsonb;

UPDATE public.user_course_certificates AS cert
SET organization_id = enroll.organization_id
FROM public.user_course_enrollments AS enroll
WHERE cert.enrollment_id = enroll.enrollment_id
  AND cert.organization_id IS NULL
  AND enroll.organization_id IS NOT NULL;

UPDATE public.user_course_certificates AS cert
SET template_id = template.id
FROM public.certificate_templates AS template
WHERE cert.organization_id = template.organization_id
  AND cert.template_id IS NULL
  AND template.is_active = true
  AND template.is_default = true;

UPDATE public.user_course_certificates AS cert
SET certificate_hash = public.certificate_hash_immutable(
  p_certificate_id => cert.certificate_id,
  p_certificate_url => cert.certificate_url,
  p_course_id => cert.course_id,
  p_enrollment_id => cert.enrollment_id,
  p_issued_at => cert.issued_at,
  p_user_id => cert.user_id
)
WHERE cert.certificate_hash IS NULL;

WITH certificate_context AS (
  SELECT
    cert.certificate_id,
    cert.organization_id,
    cert.template_id,
    cert.issued_at,
    cert.user_id,
    cert.course_id,
    org.name AS organization_name,
    COALESCE(org.brand_logo_url, org.logo_url) AS organization_logo_url,
    org.brand_color_primary,
    org.brand_color_accent,
    org.brand_color_secondary,
    tpl.design_config,
    course.title AS course_title,
    course.instructor_id,
    learner.display_name AS learner_display_name,
    learner.first_name AS learner_first_name,
    learner.last_name AS learner_last_name,
    learner.username AS learner_username,
    instructor.display_name AS instructor_display_name,
    instructor.first_name AS instructor_first_name,
    instructor.last_name AS instructor_last_name,
    instructor.username AS instructor_username,
    instructor.signature_url AS instructor_signature_url,
    instructor.signature_name AS instructor_signature_name
  FROM public.user_course_certificates AS cert
  LEFT JOIN public.organizations AS org
    ON org.id = cert.organization_id
  LEFT JOIN public.certificate_templates AS tpl
    ON tpl.id = cert.template_id
  LEFT JOIN public.courses AS course
    ON course.id = cert.course_id
  LEFT JOIN public.users AS learner
    ON learner.id = cert.user_id
  LEFT JOIN public.users AS instructor
    ON instructor.id = course.instructor_id
)
UPDATE public.user_course_certificates AS cert
SET
  branding_snapshot = jsonb_build_object(
    'platform', jsonb_build_object(
      'name', 'SofLIA',
      'logoUrl', '/icono.png'
    ),
    'issuer', jsonb_build_object(
      'organizationId', ctx.organization_id,
      'name', COALESCE(ctx.organization_name, 'SofLIA'),
      'logoUrl', ctx.organization_logo_url
    ),
    'visualTokens', jsonb_build_object(
      'primaryColor', COALESCE(
        ctx.design_config -> 'colors' ->> 'primary',
        ctx.brand_color_primary,
        '#0A2540'
      ),
      'accentColor', COALESCE(
        ctx.design_config -> 'colors' ->> 'secondary',
        ctx.brand_color_accent,
        '#00D4B3'
      ),
      'borderColor', COALESCE(ctx.brand_color_secondary, '#D6E3F1'),
      'backgroundColor', COALESCE(
        ctx.design_config -> 'colors' ->> 'background',
        '#F7FBFF'
      ),
      'textColor', COALESCE(
        ctx.design_config -> 'colors' ->> 'text',
        '#0F172A'
      ),
      'mutedColor', '#475569'
    ),
    'legacyMode', CASE WHEN ctx.organization_id IS NULL THEN true ELSE false END
  ),
  document_snapshot = jsonb_build_object(
    'learnerName', COALESCE(
      NULLIF(ctx.learner_display_name, ''),
      NULLIF(TRIM(CONCAT(COALESCE(ctx.learner_first_name, ''), ' ', COALESCE(ctx.learner_last_name, ''))), ''),
      ctx.learner_username,
      'Estudiante'
    ),
    'courseTitle', COALESCE(ctx.course_title, 'Curso sin título'),
    'instructorName', COALESCE(
      NULLIF(ctx.instructor_display_name, ''),
      NULLIF(TRIM(CONCAT(COALESCE(ctx.instructor_first_name, ''), ' ', COALESCE(ctx.instructor_last_name, ''))), ''),
      ctx.instructor_username,
      'Instructor'
    ),
    'instructorSignatureUrl', ctx.instructor_signature_url,
    'instructorSignatureName', ctx.instructor_signature_name,
    'issuedAt', ctx.issued_at,
    'programText', CONCAT(
      'Forma parte del programa de capacitación de ',
      COALESCE(ctx.organization_name, 'SofLIA')
    )
  )
FROM certificate_context AS ctx
WHERE cert.certificate_id = ctx.certificate_id
  AND (
    cert.branding_snapshot IS NULL
    OR cert.document_snapshot IS NULL
  );

COMMIT;
