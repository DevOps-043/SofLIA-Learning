import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { StatisticsResponseRow, StatisticsUserProfile } from './types'

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : user
}

export async function getStatisticsUserProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('user_perfil').select('*').eq('user_id', userId).single()
  return (data as StatisticsUserProfile | null) ?? null
}

export async function getStatisticsResponses(supabase: SupabaseClient, userProfileId: string) {
  const { data, error } = await supabase
    .from('respuestas')
    .select(`*, preguntas (id, section, bloque, peso, escala, scoring, respuesta_correcta, tipo, dimension, dificultad, texto)`)
    .eq('user_perfil_id', userProfileId)

  if (error) logger.error('Error al obtener respuestas:', error)
  return error ? null : ((data as StatisticsResponseRow[]) ?? [])
}

export async function getAdoptionCountryData(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('adopcion_genai').select('*').order('indice_aipi', { ascending: false })
  if (error) logger.warn('Error al obtener datos de adopcion:', error)
  return data ?? []
}
