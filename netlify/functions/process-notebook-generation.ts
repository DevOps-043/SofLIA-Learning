import type { Handler } from '@netlify/functions'

const handler: Handler = async () => {
  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL
  if (!cronSecret || !siteUrl) {
    return {
      body: JSON.stringify({ error: 'CRON_SECRET o URL no configurado' }),
      statusCode: 500,
    }
  }

  try {
    const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-notebook-generation?limit=10&maxRuntimeMs=24000`
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    const body = await response.text()
    return { body, statusCode: response.status }
  } catch (error) {
    return {
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Network error',
      }),
      statusCode: 500,
    }
  }
}

export { handler }
