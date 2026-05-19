-- Phase 5.7 Auth hardening: MFA TOTP factors for Admin/Business roles
-- - secret_encrypted: TOTP secret encrypted with pgcrypto using MFA_SECRET_KEY
-- - recovery_codes_hashed: one-way hashed recovery codes for break-glass access
-- - status: 'pending' (provisioning) -> 'active' (verified once) -> 'revoked'
-- - RLS: user can only read/manage their own factors; service role bypasses for admin ops

CREATE TABLE IF NOT EXISTS public.user_mfa_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL DEFAULT 'totp' CHECK (factor_type IN ('totp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  secret_encrypted BYTEA NOT NULL,
  recovery_codes_hashed TEXT[] NOT NULL DEFAULT '{}',
  issuer TEXT NOT NULL DEFAULT 'SofLIA Learning',
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS user_mfa_factors_unique_active
  ON public.user_mfa_factors (user_id, factor_type)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS user_mfa_factors_user_id_idx
  ON public.user_mfa_factors (user_id);

CREATE INDEX IF NOT EXISTS user_mfa_factors_status_idx
  ON public.user_mfa_factors (status, last_used_at DESC);

ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_mfa_factors_self_select
  ON public.user_mfa_factors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_mfa_factors_self_insert
  ON public.user_mfa_factors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mfa_factors_self_update
  ON public.user_mfa_factors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mfa_factors_self_delete
  ON public.user_mfa_factors
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_mfa_factors IS
  'TOTP/MFA factors. Secret encrypted at rest with MFA_SECRET_KEY via pgcrypto on the service layer.';
COMMENT ON COLUMN public.user_mfa_factors.secret_encrypted IS
  'Encrypted with AES-256-GCM in the application layer (lib/auth/mfa). Never store plaintext.';
COMMENT ON COLUMN public.user_mfa_factors.recovery_codes_hashed IS
  'Recovery codes stored as SHA-256 hashes. Plain values shown to the user only at provisioning.';
