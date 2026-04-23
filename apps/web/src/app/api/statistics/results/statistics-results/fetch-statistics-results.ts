import { SupabaseClient } from '@supabase/supabase-js'
import { processAnalysis } from './analysis'
import { processRadarData } from './radar-data'
import { generateRecommendations } from './recommendations'
import {
  getAdoptionCountryData,
  getAuthenticatedUser,
  getStatisticsResponses,
  getStatisticsUserProfile,
} from './queries'
import { ApiRouteResult } from './types'

export async function fetchStatisticsResultsData(
  supabase: SupabaseClient,
): Promise<ApiRouteResult> {
  const user = await getAuthenticatedUser(supabase)
  if (!user) return { status: 401, body: { error: 'Usuario no autenticado' } }

  const userProfile = await getStatisticsUserProfile(supabase, user.id)
  if (!userProfile?.id) return { status: 404, body: { error: 'Perfil de usuario no encontrado' } }

  const responses = await getStatisticsResponses(supabase, userProfile.id)
  if (responses === null) return { status: 500, body: { error: 'Error al obtener respuestas del usuario' } }

  const adoptionData = await getAdoptionCountryData(supabase)
  const radarData = processRadarData(responses, userProfile.dificultad_id)
  const analysis = processAnalysis(responses, userProfile)
  const recommendations = generateRecommendations(radarData, analysis)

  return {
    status: 200,
    body: {
      success: true,
      data: { radarData, analysis, recommendations, countryData: adoptionData, userProfile },
    },
  }
}
