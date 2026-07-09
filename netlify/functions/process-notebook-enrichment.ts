/**
 * Netlify Scheduled Function: Process Notebook Enrichment
 *
 * Procesa la cola durable de enriquecimiento IA del Libro de Apuntes
 * (notebook_ai_enrichment_jobs). Llama al endpoint interno
 * /api/cron/process-notebook-enrichment con CRON_SECRET, siguiendo el mismo
 * patrón que process-tts-reading-audio.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  console.log('[CRON notebook-enrichment] Iniciando...')

  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

  if (!cronSecret) {
    console.error('[CRON notebook-enrichment] Falta CRON_SECRET')
    return { statusCode: 500, body: JSON.stringify({ error: 'CRON_SECRET no configurado' }) }
  }

  if (!siteUrl) {
    console.error('[CRON notebook-enrichment] Falta NEXT_PUBLIC_SITE_URL / URL')
    return { statusCode: 500, body: JSON.stringify({ error: 'URL del sitio no configurada' }) }
  }

  const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-notebook-enrichment?limit=10&maxRuntimeMs=24000`
  console.log(`[CRON notebook-enrichment] Llamando a ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const result = await response.json().catch(() => ({
      error: `Respuesta no JSON del endpoint de enriquecimiento (status ${response.status})`,
    }))

    if (!response.ok) {
      console.error('[CRON notebook-enrichment] Error en endpoint:', result)
      return { statusCode: response.status, body: JSON.stringify(result) }
    }

    console.log(
      `[CRON notebook-enrichment] Resultado: processed=${result.processed}, done=${result.done}, skipped=${result.skipped}, failed=${result.failed}`,
    )
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[CRON notebook-enrichment] Error de red:', message)
    return { statusCode: 500, body: JSON.stringify({ error: message }) }
  }
}

export { handler }
