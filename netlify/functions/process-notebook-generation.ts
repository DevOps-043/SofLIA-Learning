import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions'

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  console.log('[CRON notebook-generation] Iniciando...')

  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

  if (!cronSecret) {
    console.error('[CRON notebook-generation] Falta CRON_SECRET')
    return {
      body: JSON.stringify({ error: 'CRON_SECRET no configurado' }),
      statusCode: 500,
    }
  }

  if (!siteUrl) {
    console.error('[CRON notebook-generation] Falta NEXT_PUBLIC_SITE_URL / URL')
    return {
      body: JSON.stringify({ error: 'URL del sitio no configurada' }),
      statusCode: 500,
    }
  }

  try {
    const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-notebook-generation?limit=10&maxRuntimeMs=24000`
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const result = await response.json().catch(() => ({
      code: 'NOTEBOOK_QUEUE_INVALID_RESPONSE',
      error: `Respuesta no JSON del endpoint (status ${response.status})`,
    }))

    if (!response.ok) {
      console.error('[CRON notebook-generation] Error en endpoint', {
        code: result.code,
        correlationId: result.correlationId,
        status: response.status,
      })
      return { body: JSON.stringify(result), statusCode: response.status }
    }

    console.log(
      `[CRON notebook-generation] Resultado: processed=${result.processed}, done=${result.done}, partial=${result.partial}, failed=${result.failed}, rescheduled=${result.rescheduled}`,
    )
    return { body: JSON.stringify(result), statusCode: 200 }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    console.error('[CRON notebook-generation] Error de red', { message })
    return {
      body: JSON.stringify({ error: 'No se pudo contactar el endpoint interno' }),
      statusCode: 500,
    }
  }
}

export { handler }
