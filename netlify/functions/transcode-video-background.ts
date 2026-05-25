import type { Handler, HandlerEvent } from '@netlify/functions';
import { getEnv } from './transcode-video-background/env';
import { processTranscodeJob } from './transcode-video-background/job-processor';
import type { TranscodeJobPayload } from './transcode-video-background/types';

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!isAuthorized(event)) {
    console.error('[transcode-bg] Unauthorized request');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const payload = parsePayload(event);
  if (!payload) {
    return { statusCode: 400, body: 'Bad Request' };
  }

  console.log(`[transcode-bg] Starting job ${payload.jobId} - ${payload.sourcePath}`);
  await processTranscodeJob(payload);

  return { statusCode: 202, body: '' };
};

function isAuthorized(event: HandlerEvent) {
  const secret = getEnv('TRANSCODING_INTERNAL_SECRET');
  const authHeader = event.headers.authorization ?? event.headers.Authorization ?? '';
  return Boolean(secret && authHeader === `Bearer ${secret}`);
}

function parsePayload(event: HandlerEvent): TranscodeJobPayload | null {
  try {
    const payload = JSON.parse(event.body ?? '{}') as TranscodeJobPayload;
    if (!payload.jobId || !payload.sourcePath || !payload.sourceUrl || !payload.bucket || !payload.contentType) {
      throw new Error('Missing required fields');
    }
    return payload;
  } catch (error) {
    console.error('[transcode-bg] Invalid payload:', error);
    return null;
  }
}

export { handler };
