-- =============================================
-- Migration: Create organization_join_requests table
-- Description: Tracks requests from users wanting to join existing organizations
-- Date: 2026-02-14
-- =============================================

CREATE TABLE IF NOT EXISTS organization_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  job_title TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON organization_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_status ON organization_join_requests(organization_id, status);
