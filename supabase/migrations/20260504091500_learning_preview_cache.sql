-- Create table for storing learning previews to prevent repeated Gemini calls
CREATE TABLE public.learning_preview_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['course'::text, 'learning_path'::text])),
  target_id uuid NOT NULL,
  locale text NOT NULL CHECK (locale = ANY (ARRAY['es'::text, 'en'::text, 'pt'::text])),
  model_name text,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT learning_preview_cache_pkey PRIMARY KEY (id),
  CONSTRAINT learning_preview_cache_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT learning_preview_cache_unique UNIQUE (organization_id, kind, target_id, locale)
);

-- Enable RLS
ALTER TABLE public.learning_preview_cache ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can view learning_preview_cache in their organization" ON public.learning_preview_cache
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_users.organization_id
      FROM public.organization_users
      WHERE organization_users.user_id = auth.uid()
    )
  );

-- No insert policies are needed as they are handled entirely by the backend using service_role bypassing RLS
