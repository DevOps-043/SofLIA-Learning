-- Add AI context fields to organizations table
-- These fields allow SofLIA to contextualize responses based on company profile

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS industry        text,
  ADD COLUMN IF NOT EXISTS company_size    text,
  ADD COLUMN IF NOT EXISTS company_type    text,
  ADD COLUMN IF NOT EXISTS company_mission text,
  ADD COLUMN IF NOT EXISTS company_country text;

COMMENT ON COLUMN organizations.industry        IS 'Business sector / giro de la empresa (e.g. Tecnología, Salud, Finanzas)';
COMMENT ON COLUMN organizations.company_size    IS 'Employee count range (e.g. 1-10, 11-50, 51-200, 201-1000, 1001-5000, 5000+)';
COMMENT ON COLUMN organizations.company_type    IS 'Business model (B2B, B2C, Mixto, Pública, ONG)';
COMMENT ON COLUMN organizations.company_mission IS 'Mission or purpose statement of the organization';
COMMENT ON COLUMN organizations.company_country IS 'Country where the organization primarily operates';
