import { createClient } from '../../../../lib/supabase/server'

export async function createAdminModulesClient() {
  return createClient()
}
