import { NextResponse, type NextRequest } from 'next/server'
import { QuestionnaireValidationService } from '../features/auth/services/questionnaire-validation.service'
import { createProxySupabaseClient } from './supabase'
import type { ProxyLogger } from './logger'

export async function validateLegacySessionAndQuestionnaire(
  request: NextRequest,
  response: NextResponse,
  logger: ProxyLogger,
) {
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  if (!sessionCookie) {
    logger.log('??? No hay sesi??n, redirigiendo a /auth')
    return { response: NextResponse.redirect(new URL('/auth', request.url)), shouldReturn: true }
  }
  logger.log('???? Validando sesi??n en base de datos...')
  try {
    let mutableResponse = response
    const supabase = createProxySupabaseClient(request, (nextResponse) => { mutableResponse = nextResponse })
    const { data: sessionData, error: sessionError } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).single()
    logger.log('???? Sesi??n en DB:', sessionData ? 'V??lida' : 'No v??lida')
    logger.log('??? Error de sesi??n:', sessionError?.message || 'Ninguno')
    if (sessionError || !sessionData) {
      mutableResponse.cookies.delete('aprende-y-aplica-session')
      return { response: NextResponse.redirect(new URL('/auth', request.url)), shouldReturn: true }
    }
    const questionnaireRedirect = await validateQuestionnaire(request, sessionData.user_id, logger)
    if (questionnaireRedirect) return { response: questionnaireRedirect, shouldReturn: true }
    return { response: mutableResponse, shouldReturn: false }
  } catch (error) {
    logger.error('??? Error validando sesi??n:', error)
    return { response: NextResponse.redirect(new URL('/auth', request.url)), shouldReturn: true }
  }
}

async function validateQuestionnaire(request: NextRequest, userId: string, logger: ProxyLogger) {
  try {
    const requiresQuestionnaire = await QuestionnaireValidationService.requiresQuestionnaire(userId)
    if (requiresQuestionnaire) return NextResponse.redirect(new URL('/statistics', request.url))
    return null
  } catch (questionnaireError) {
    logger.error('??? Error verificando cuestionario - DENEGANDO ACCESO por seguridad:', questionnaireError)
    return NextResponse.redirect(new URL('/statistics', request.url))
  }
}
