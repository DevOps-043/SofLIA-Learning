import { randomBytes } from 'crypto'

import { emailService } from '@/features/auth/services/email.service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { createInvitationRepository } from './repository'
import type { InvitationRuntime } from './types'

interface CreateInvitationRuntimeOptions {
  // 'session' (default): cookie-bound client. Required by the public invite-
  // acceptance flow, which resolves the caller's identity via
  // supabase.auth.getUser() on this same client (repository/authenticated-user.ts).
  // 'admin': service-role client. user_invitations lost its `authenticated`
  // grant in migration 20260827120000_emergency_data_api_lockdown, so callers
  // that already authorized the request themselves (e.g. requireBusiness())
  // and never call resolveAuthenticatedUserId() must opt into this instead.
  client?: 'session' | 'admin'
}

export async function createInvitationRuntime(
  options: CreateInvitationRuntimeOptions = {},
): Promise<InvitationRuntime> {
  const supabase = options.client === 'admin' ? createAdminClient() : await createClient()

  return {
    createToken: () => randomBytes(32).toString('hex'),
    emailService,
    logger,
    now: () => new Date(),
    repo: createInvitationRepository(supabase),
  }
}
