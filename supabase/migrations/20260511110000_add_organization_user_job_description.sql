ALTER TABLE public.organization_users
ADD COLUMN IF NOT EXISTS job_description text;

COMMENT ON COLUMN public.organization_users.job_description IS
  'User-provided summary of the duties, responsibilities, and activities performed in the organization role.';
