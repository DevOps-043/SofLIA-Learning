/**
 * Netlify Scheduled Function: Process TTS Audio
 *
 * Drains durable TTS audio assets into the private `tts-audio` bucket.
 */

import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  console.log('[CRON tts-audio] Starting...');

  const cronSecret = process.env.CRON_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL;

  if (!cronSecret) {
    console.error('[CRON tts-audio] Missing CRON_SECRET');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CRON_SECRET not configured' }),
    };
  }

  if (!siteUrl) {
    console.error('[CRON tts-audio] Missing NEXT_PUBLIC_SITE_URL / URL');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Site URL not configured' }),
    };
  }

  const endpoint = `${siteUrl.replace(/\/$/, '')}/api/cron/process-tts-audio`;
  console.log(`[CRON tts-audio] Calling ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[CRON tts-audio] Endpoint error:', result);
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    console.log(
      `[CRON tts-audio] Result: processed=${result.processed}, ready=${result.ready}, failed=${result.failed}`,
    );
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON tts-audio] Network error:', message);
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};

export { handler };
