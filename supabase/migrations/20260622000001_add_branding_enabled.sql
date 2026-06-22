-- Add branding_enabled column to organizations table.
-- When false (default), the org uses the SofLIA default theme.
-- When true, the org's custom brand colors are applied across all user-facing surfaces.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS branding_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN organizations.branding_enabled IS
  'When true, the organization''s custom brand colors are applied to all user-facing UI surfaces. '
  'When false (default), the SofLIA default theme is used.';
