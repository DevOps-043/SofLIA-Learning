import type { TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_GEMINI_TTS_MODEL_ID,
  DEFAULT_GEMINI_TTS_READING_VOICE_NAME,
  DEFAULT_GEMINI_TTS_VOICE_NAME,
} from './shared';
import { createWavFromPcm } from './audio-format.service';
import {
  buildContinuationSpeechPrompt,
  buildReadingSpeechPrompt,
  buildSofliaContinuationSpeechPrompt,
  buildSofliaSpeechPrompt,
} from './gemini-tts-prompts';

interface GeminiInlineDataPart {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
  inline_data?: {
    data?: string;
    mime_type?: string;
  };
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiInlineDataPart[];
    };
  }>;
}

// ─── Config helpers ───────────────────────────────────────────────────────────

function getGeminiApiKey() {
  return process.env.GEMINI_TTS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

function getGeminiTTSModelId() {
  return process.env.GEMINI_TTS_MODEL || DEFAULT_GEMINI_TTS_MODEL_ID;
}

function getGeminiTTSVoiceName() {
  return process.env.GEMINI_TTS_VOICE || DEFAULT_GEMINI_TTS_VOICE_NAME;
}

function getGeminiReadingVoiceName() {
  // Voz por defecto: Zephyr (femenina, clara) — ver DEFAULT_GEMINI_TTS_READING_VOICE_NAME.
  // Configurable con GEMINI_TTS_READING_VOICE si una voz suena mejor en es-MX.
  return process.env.GEMINI_TTS_READING_VOICE || DEFAULT_GEMINI_TTS_READING_VOICE_NAME;
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

function getFirstInlineAudio(response: GeminiGenerateContentResponse) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    // La API devuelve el audio como `inlineData` (camelCase) o `inline_data`
    // (snake_case) según la versión; normalizamos ambas formas.
    const camel = part.inlineData;
    const snake = part.inline_data;
    const data = camel?.data ?? snake?.data;
    if (data) {
      return {
        data,
        mimeType: camel?.mimeType ?? snake?.mime_type ?? 'audio/pcm',
      };
    }
  }

  return null;
}

function createAudioResponse(base64Audio: string, mimeType: string) {
  const audioBytes = Buffer.from(base64Audio, 'base64');

  if (
    mimeType.includes('wav') ||
    mimeType.includes('mpeg') ||
    mimeType.includes('mp3') ||
    mimeType.includes('ogg')
  ) {
    return new Response(audioBytes, {
      status: 200,
      headers: { 'Content-Type': mimeType },
    });
  }

  // Default: raw PCM → wrap in WAV container for broad browser support
  const wavBytes = createWavFromPcm(audioBytes);
  return new Response(wavBytes, {
    status: 200,
    headers: { 'Content-Type': 'audio/wav' },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

/**
 * Voz y modelo que se usarán realmente para un contexto dado. Lo usa la clave
 * del caché de audio para reflejar fielmente lo que se sintetiza.
 */
export function resolveGeminiVoiceAndModel(context?: string) {
  const isReadingContext = context === 'reading' || context === 'reading_continuation';
  return {
    model: getGeminiTTSModelId(),
    voice: isReadingContext ? getGeminiReadingVoiceName() : getGeminiTTSVoiceName(),
  };
}

export async function synthesizeSpeechWithGemini(payload: TextToSpeechRequestPayload) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('GEMINI_TTS_NOT_CONFIGURED');
  }

  const isReading = payload.context === 'reading';
  const isContinuation = payload.context === 'reading_continuation';
  const isChatContinuation = payload.context === 'chat_continuation';
  const modelId = getGeminiTTSModelId();
  const voiceName = (isReading || isContinuation) ? getGeminiReadingVoiceName() : getGeminiTTSVoiceName();
  const prompt = isContinuation
    ? buildContinuationSpeechPrompt(payload.text)
    : isReading
      ? buildReadingSpeechPrompt(payload.text)
      : isChatContinuation
        ? buildSofliaContinuationSpeechPrompt(payload.text)
        : buildSofliaSpeechPrompt(payload.text);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Hard timeout so the server never hangs indefinitely on a slow/broken model
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    return response;
  }

  const responsePayload = (await response.json()) as GeminiGenerateContentResponse;
  const audio = getFirstInlineAudio(responsePayload);

  if (!audio) {
    return Response.json(
      {
        error: 'Gemini TTS response did not include audio data',
        code: 'GEMINI_TTS_AUDIO_MISSING',
      },
      { status: 502 }
    );
  }

  return createAudioResponse(audio.data, audio.mimeType);
}
