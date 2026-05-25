import { createClient } from '../../../../lib/supabase/server'

export async function createAdminActivitiesClient() {
  return createClient()
}
