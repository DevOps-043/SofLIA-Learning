import { randomBytes } from 'crypto'

import { emailService } from '@/features/auth/services/email.service'
import { logger } from '@/lib/logger'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import { createInvitationRepository } from './repository'
import type { InvitationRuntime } from './types'

export async function createInvitationRuntime(): Promise<InvitationRuntime> {
  const sessionClient = await createClient()
  const securityClient = createAdminClient()

  return {
    authorizeOrganizationAdmin: async (organizationId) => {
      const auth = await requireBusiness({ organizationId })
      if (
        auth instanceof NextResponse ||
        auth.organizationId !== organizationId ||
        !auth.isOrgAdmin
      ) {
        return null
      }

      return {
        canAssignOwner:
          auth.organizationRole === 'owner' ||
          auth.userRole === 'Administrador',
        userId: auth.userId,
      }
    },
    createToken: () => randomBytes(32).toString('hex'),
    emailService,
    logger,
    now: () => new Date(),
    repo: createInvitationRepository(securityClient, sessionClient),
  }
}
