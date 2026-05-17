import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { jsonError } from './questionnaire-responses'
import type { QuestionnaireAuthContext } from './questionnaire.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase no configurado')
}

export async function authenticateQuestionnaireUser(
  request: NextRequest,
): Promise<QuestionnaireAuthContext | NextResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError('Supabase no configurado. Por favor configura las variables de entorno.', 500)
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Token de autorización requerido.', 401)
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authHeader.split(' ')[1]}` } },
  })
  const { data: { user }, error: authError } = await client.auth.getUser()

  if (authError) {
    logger.error('Error de autenticación:', authError)
    return jsonError('Error de autenticación. Token inválido.', 401)
  }

  if (!user) {
    logger.warn('Usuario no autenticado')
    return jsonError('Usuario no autenticado. Por favor inicia sesión.', 401)
  }

  logger.log('Usuario autenticado:', user.id)
  return { client, user: { id: user.id } }
}
