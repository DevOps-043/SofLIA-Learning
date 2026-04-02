import { randomBytes } from 'crypto'

import { emailService } from '@/features/auth/services/email.service'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

import { createInvitationRepository } from './repository'
import type { InvitationRuntime } from './types'

export async function createInvitationRuntime(): Promise<InvitationRuntime> {
  const supabase = await createClient()

  return {
    createToken: () => randomBytes(32).toString('hex'),
    emailService,
    logger,
    now: () => new Date(),
    repo: createInvitationRepository(supabase),
  }
}
