/**
 * Netlify Scheduled Function: Process Module Learning Summaries
 *
 * Procesa la cola durable de apuntes SofLIA por modulo.
 * Llama al endpoint interno /api/cron/process-module-learning-summaries con CRON_SECRET.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  console.log('[CRON module-learning-summaries] Iniciando...')

  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

  if (!cronSecret) {
    console.error('[CRON module-learning-summaries] Falta CRON_SECRET')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CRON_SECRET no configurado' }),
    }
  }

  if (!siteUrl) {
    console.error('[CRON module-learning-summaries] Falta NEXT_PUBLIC_SITE_URL / URL')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'URL del sitio no configurada' }),
    }
  }

  const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-module-learning-summaries`
  console.log(`[CRON module-learning-summaries] Llamando a ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[CRON module-learning-summaries] Error en endpoint:', result)
      return { statusCode: response.status, body: JSON.stringify(result) }
    }

    console.log(
      `[CRON module-learning-summaries] Resultado: processed=${result.processed}, failed=${result.failed}`,
    )
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[CRON module-learning-summaries] Error de red:', message)
    return { statusCode: 500, body: JSON.stringify({ error: message }) }
  }
}

export { handler }
