import { createClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
export type CountMap = Record<string, number>
export type LookupRow = { id: string; nombre: string }
export type DateActivityMap = Record<string, { posts: number; comments: number }>
