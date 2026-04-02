import type { TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
} from './shared';

function getElevenLabsApiKey() {
  return process.env.ELEVENLABS_API_KEY || null;
}

function getElevenLabsVoiceId(voiceId?: string) {
  return (
    voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ||
    DEFAULT_ELEVENLABS_VOICE_ID
  );
}

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

export async function synthesizeSpeechWithElevenLabs(payload: TextToSpeechRequestPayload) {
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    throw new Error('ELEVENLABS_NOT_CONFIGURED');
  }

  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${getElevenLabsVoiceId(payload.voiceId)}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: payload.text,
      model_id: payload.modelId || DEFAULT_ELEVENLABS_MODEL_ID,
      voice_settings: payload.voiceSettings,
      speed: payload.speed,
      optimize_streaming_latency: payload.optimizeStreamingLatency ?? DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
      output_format: payload.outputFormat || DEFAULT_TTS_OUTPUT_FORMAT,
    }),
  });
}
