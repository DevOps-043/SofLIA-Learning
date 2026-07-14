-- ============================================================================
-- Tabla `landing_contacts` — leads del formulario de contacto de la landing.
--
-- POR QUÉ
-- El endpoint /api/landing/contact hacía INSERT en `landing_contacts`, una
-- tabla que NO existía. La página /contact está montada y el formulario se
-- renderiza, así que cada persona que pulsaba "Contáctanos" creía haber escrito
-- y su lead se PERDÍA (el INSERT fallaba en silencio y el flujo seguía). El
-- correo de aviso sí se enviaba, pero no quedaba registro consultable.
--
-- Esta tabla recupera esos leads y guarda TODOS los campos del formulario
-- (antes el INSERT solo guardaba name/email/company; teléfono, mensaje e
-- interés se perdían aunque el formulario los enviara).
--
-- RLS: solo service_role escribe/lee. El endpoint usa el cliente de servidor;
-- ningún usuario final debe poder leer los leads de la empresa.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.landing_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL,
  company       text,
  phone         text,
  company_size  text,
  interest      text,
  message       text,
  source        text NOT NULL DEFAULT 'landing_cta',
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'contacted', 'qualified', 'discarded')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índice para la bandeja de leads: los más nuevos primero, filtrando por estado.
CREATE INDEX IF NOT EXISTS idx_landing_contacts_status_created
  ON public.landing_contacts (status, created_at DESC);

ALTER TABLE public.landing_contacts ENABLE ROW LEVEL SECURITY;

-- Sin políticas para usuarios: solo service_role (que ignora RLS) puede tocarla.
-- Un formulario público que escribe con el cliente de servidor no necesita
-- exponer la tabla a nadie más.


-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.landing_contacts;
