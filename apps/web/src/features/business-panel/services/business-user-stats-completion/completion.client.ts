import { createClient } from '../../../../lib/supabase/server'

export type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>
