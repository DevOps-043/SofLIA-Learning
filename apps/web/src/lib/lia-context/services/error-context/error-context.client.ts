import { createClient } from '@/lib/supabase/server'

export async function createErrorContextClient() {
  return createClient()
}
