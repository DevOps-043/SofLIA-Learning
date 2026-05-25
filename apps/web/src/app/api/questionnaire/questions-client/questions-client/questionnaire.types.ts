import type { createClient } from '@supabase/supabase-js'

export type QuestionnaireSupabaseClient = ReturnType<typeof createClient>

export interface QuestionnaireUser {
  id: string
}

export interface UserProfileRow {
  id: number
  area_id: number | null
  rol_id: number | null
  dificultad_id: number | null
}

export interface QuestionRow {
  id: number
  bloque: string | null
  dificultad: number | null
  area_id: number | null
  exclusivo_rol_id: number | null
  [key: string]: unknown
}

export interface AnswerRow {
  pregunta_id: number
  valor: unknown
}

export interface QuestionWithAnswer extends QuestionRow {
  respuesta_existente: unknown
}

export interface QuestionnaireAuthContext {
  client: QuestionnaireSupabaseClient
  user: QuestionnaireUser
}
