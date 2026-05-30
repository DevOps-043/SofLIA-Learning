BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Caché persistente de audio TTS para las lecturas de actividades.
--
-- El audio sintetizado (Gemini) es determinista por (texto, voz, modelo,
-- contexto, versión de prompt), así que lo almacenamos una sola vez y lo
-- reutilizamos entre usuarios para eliminar la latencia de re-síntesis.
--
-- Bucket PRIVADO: el acceso es exclusivamente server-side con el service-role
-- (que omite RLS). No se exponen URLs públicas; el audio se sirve vía /api/tts.
-- Solo se cachea contenido de lectura (no PII); el chat queda fuera.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-audio',
  'tts-audio',
  false,
  10485760,  -- 10 MB por objeto
  ARRAY['audio/wav', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
