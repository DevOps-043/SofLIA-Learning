import { createClient } from '../../../../lib/supabase/server'

export async function createAdminReportesClient() {
  return createClient()
}
