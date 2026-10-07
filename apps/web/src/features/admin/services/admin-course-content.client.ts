import 'server-only'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

/** Course management needs restricted columns and writes that learner RLS denies. */
export async function createAdminCourseContentClient() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    throw new Error('ADMIN_COURSE_ACCESS_DENIED')
  }

  return createAdminClient()
}
