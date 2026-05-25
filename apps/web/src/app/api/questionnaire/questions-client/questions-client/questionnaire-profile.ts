import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { jsonError } from './questionnaire-responses'
import type { QuestionnaireSupabaseClient, UserProfileRow } from './questionnaire.types'

function validateProfileField(
  userProfile: UserProfileRow,
  userId: string,
  field: 'dificultad_id' | 'rol_id' | 'area_id',
  missingLog: string,
  error: string,
): NextResponse | null {
  if (userProfile[field]) return null

  logger.warn(missingLog, { user_id: userId })
  return jsonError(error, 400)
}

export async function loadAndValidateUserProfile(
  client: QuestionnaireSupabaseClient,
  userId: string,
): Promise<UserProfileRow | NextResponse> {
  const { data: userProfile, error: profileError } = await client
    .from('user_perfil')
    .select('id, area_id, rol_id, dificultad_id')
    .eq('user_id', userId)
    .returns<UserProfileRow>()
    .single()

  if (profileError || !userProfile) {
    logger.error('Error fetching user profile:', profileError)
    return jsonError(
      'Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.',
      404,
    )
  }

  return (
    validateProfileField(
      userProfile,
      userId,
      'dificultad_id',
      'Usuario sin dificultad_id asignado',
      'Tu perfil no tiene un nivel de dificultad asignado. Por favor completa el cuestionario inicial nuevamente.',
    ) ||
    validateProfileField(
      userProfile,
      userId,
      'rol_id',
      'Usuario sin rol_id asignado',
      'Tu perfil no tiene un rol asignado. Por favor completa el cuestionario inicial nuevamente.',
    ) ||
    validateProfileField(
      userProfile,
      userId,
      'area_id',
      'Usuario sin area_id asignada',
      'Tu perfil no tiene un área asignada. Por favor completa el cuestionario inicial nuevamente.',
    ) ||
    userProfile
  )
}
