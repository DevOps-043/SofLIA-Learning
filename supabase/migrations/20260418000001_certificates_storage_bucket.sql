BEGIN;

-- Crea el bucket de almacenamiento para PDFs de certificados si no existe.
-- Es público: los PDFs son accesibles por URL directa (intencional para verificación y descarga).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Solo service_role (backend con admin key) puede subir certificados.
-- Evita que usuarios suban archivos arbitrarios al bucket.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'service_role_upload_certificates'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_upload_certificates"
      ON storage.objects FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'certificates');
    $policy$;
  END IF;
END;
$$;

-- Acceso público de lectura para que cualquier persona con la URL pueda descargar el PDF
-- (necesario para verificación pública y compartir certificados).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public_read_certificates'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "public_read_certificates"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'certificates');
    $policy$;
  END IF;
END;
$$;

COMMIT;
