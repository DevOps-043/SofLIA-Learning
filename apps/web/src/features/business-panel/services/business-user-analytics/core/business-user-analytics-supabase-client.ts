import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type BusinessUserAnalyticsSupabaseClient = SupabaseClient<Database>
