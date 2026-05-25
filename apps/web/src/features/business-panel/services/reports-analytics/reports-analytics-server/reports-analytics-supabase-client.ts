import { createClient } from '@/lib/supabase/server'

export type ReportsAnalyticsSupabaseClient = Awaited<ReturnType<typeof createClient>>
