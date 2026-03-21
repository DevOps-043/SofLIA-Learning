/**
 * Netlify Scheduled Function: Process CourseEngine Inbox
 *
 * Se ejecuta cada 5 minutos para procesar los cursos depositados
 * por SofLIA CourseEngine en la tabla `courseengine_inbox`.
 *
 * Llama al endpoint interno /api/cron/process-inbox con el CRON_SECRET.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    console.log('[CRON process-inbox] Iniciando...')

    const cronSecret = process.env.CRON_SECRET
    // Netlify provee la variable URL con la URL raíz del sitio en producción
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL

    if (!cronSecret) {
        console.error('[CRON process-inbox] Falta CRON_SECRET en variables de entorno')
        return { statusCode: 500, body: JSON.stringify({ error: 'CRON_SECRET no configurado' }) }
    }

    if (!siteUrl) {
        console.error('[CRON process-inbox] Falta NEXT_PUBLIC_SITE_URL / URL en variables de entorno')
        return { statusCode: 500, body: JSON.stringify({ error: 'URL del sitio no configurada' }) }
    }

    const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-inbox`
    console.log(`[CRON process-inbox] Llamando a ${endpoint}`)

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${cronSecret}`,
            },
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('[CRON process-inbox] Error en el endpoint:', result)
            return { statusCode: response.status, body: JSON.stringify(result) }
        }

        console.log(`[CRON process-inbox] ✅ Resultado: procesados=${result.processed}, errores=${result.errors}`)
        return { statusCode: 200, body: JSON.stringify(result) }

    } catch (error: any) {
        console.error('[CRON process-inbox] Error de red:', error.message)
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }
}

export { handler }
