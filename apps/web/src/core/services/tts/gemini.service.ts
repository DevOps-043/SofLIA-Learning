import type { TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_GEMINI_TTS_MODEL_ID,
  DEFAULT_GEMINI_TTS_VOICE_NAME,
} from './shared';
import { createWavFromPcm } from './audio-format.service';

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

function getGeminiApiKey() {
  return process.env.GEMINI_TTS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

function getGeminiTTSModelId() {
  return process.env.GEMINI_TTS_MODEL || DEFAULT_GEMINI_TTS_MODEL_ID;
}

function getGeminiTTSVoiceName() {
  return process.env.GEMINI_TTS_VOICE || DEFAULT_GEMINI_TTS_VOICE_NAME;
}

function buildSofliaSpeechPrompt(text: string) {
  return [
    'Read the following text as SofLIA.',
    'Voice direction: warm, professional, natural Latin American Spanish when the text is Spanish, clear pacing, friendly but not childish, confident but not exaggerated.',
    'Avoid sounding robotic, theatrical, rushed, or overly excited.',
    '',
    text,
  ].join('\n');
}

function getFirstInlineAudio(response: GeminiGenerateContentResponse) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const inlineData = part.inlineData ?? part.inline_data;
    const data = inlineData?.data;
    if (data) {
      return {
        data,
        mimeType: inlineData.mimeType ?? inlineData.mime_type ?? 'audio/pcm',
      };
    }
  }

  return null;
}

function createAudioResponse(base64Audio: string, mimeType: string) {
  const audioBytes = Buffer.from(base64Audio, 'base64');

  if (mimeType.includes('wav') || mimeType.includes('mpeg') || mimeType.includes('mp3') || mimeType.includes('ogg')) {
    return new Response(audioBytes, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
      },
    });
  }

  const wavBytes = createWavFromPcm(audioBytes);
  return new Response(wavBytes, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
    },
  });
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

export async function synthesizeSpeechWithGemini(payload: TextToSpeechRequestPayload) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('GEMINI_TTS_NOT_CONFIGURED');
  }

  const modelId = getGeminiTTSModelId();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildSofliaSpeechPrompt(payload.text),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: getGeminiTTSVoiceName(),
              },
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
