import { createAdminClient } from '../../../../lib/supabase/admin'

export async function createAdminReportesClient() {
  return createAdminClient()
}
