import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type PlatformSupabaseClient = SupabaseClient<Database>
