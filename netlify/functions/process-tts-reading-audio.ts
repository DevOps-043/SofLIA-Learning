/**
 * Netlify Scheduled Function: Process TTS Reading Audio
 *
 * Procesa la cola durable de pre-generación de audio de lecturas (reflexiones,
 * lecturas de actividad, transcripciones y resúmenes).
 * Llama al endpoint interno /api/cron/process-tts-reading-audio con CRON_SECRET.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  console.log('[CRON tts-reading-audio] Iniciando...')

  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

  if (!cronSecret) {
    console.error('[CRON tts-reading-audio] Falta CRON_SECRET')
    return { statusCode: 500, body: JSON.stringify({ error: 'CRON_SECRET no configurado' }) }
  }

  if (!siteUrl) {
    console.error('[CRON tts-reading-audio] Falta NEXT_PUBLIC_SITE_URL / URL')
    return { statusCode: 500, body: JSON.stringify({ error: 'URL del sitio no configurada' }) }
  }

  const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-tts-reading-audio`
  console.log(`[CRON tts-reading-audio] Llamando a ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[CRON tts-reading-audio] Error en endpoint:', result)
      return { statusCode: response.status, body: JSON.stringify(result) }
    }

    console.log(
      `[CRON tts-reading-audio] Resultado: processed=${result.processed}, failed=${result.failed}`,
    )
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[CRON tts-reading-audio] Error de red:', message)
    return { statusCode: 500, body: JSON.stringify({ error: message }) }
  }
}

export { handler }
