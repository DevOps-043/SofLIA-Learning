import type { TextToSpeechRequestPayload } from './types';
import {
  DEFAULT_GEMINI_TTS_MODEL_ID,
  DEFAULT_GEMINI_TTS_READING_VOICE_NAME,
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
  // Aoede: breezy, natural female voice — ideal for educational narration.
  // Override via env var if a different voice is preferred.
  return process.env.GEMINI_TTS_READING_VOICE || DEFAULT_GEMINI_TTS_READING_VOICE_NAME;
}

// ─── Audio tag injection ──────────────────────────────────────────────────────
//
// Gemini TTS interprets bracketed tags embedded in text to shift delivery.
// Strategy: rotate through an expressive palette for EVERY paragraph so the
// voice never sounds flat across consecutive blocks.
//
// Rotation sequence (body paragraphs):
//   1 → [warm]        gentle, welcoming opener
//   2 → [engaged]     more animated, pulls listener in
//   3 → (no tag)      natural rest — avoids over-tagging
//   4 → [thoughtful]  slows down, contemplative
//   5 → [warm]        cycle repeats
//
// Plus inline overrides:
//   - Section headings   → [sighs]   (natural breath before new topic)
//   - Questions (?)      → [curious] (rising intonation, not flat)
//   - Exclamation (!)    → [excited] (emphasis without shouting)
//
// Tags must be in English even for Spanish content (Gemini docs requirement).

const BODY_TAG_CYCLE = ['[warm]', '[engaged]', '', '[thoughtful]'] as const;

function addNarrationTags(text: string): string {
  const blocks = text.split(/\n\n+/);
  let bodyCount = 0;

  const tagged = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';

    const isHeading =
      trimmed.length < 100 &&
      !/[.!?,;:]$/.test(trimmed) &&
      !/^\d+$/.test(trimmed) &&
      !/^[-*•]/.test(trimmed);

    if (isHeading && bodyCount > 0) {
      return `[sighs] ${trimmed}`;
    }

    const cycleTag = BODY_TAG_CYCLE[bodyCount % BODY_TAG_CYCLE.length];
    bodyCount++;

    const inlined = injectInlineTags(trimmed);
    return cycleTag ? `${cycleTag} ${inlined}` : inlined;
  });

  return tagged.filter(Boolean).join('\n\n');
}

function injectInlineTags(paragraph: string): string {
  return paragraph
    // Questions → curious rising intonation
    .replace(/([^.!?]*\?)/g, (m) => { const s = m.trim(); return s ? `[curious] ${s}` : m; })
    // Exclamations → brief excitement
    .replace(/([^.!?]*!)/g, (m) => { const s = m.trim(); return s && s.length > 4 ? `[excited] ${s}` : m; });
}

// Continuation chunks: only inline question/exclamation tags.
// No structural overhead → fewer tokens → faster synthesis.
function addContinuationTags(text: string): string {
  return injectInlineTags(text);
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSofliaSpeechPrompt(text: string) {
  return [
    'Read the following text as SofLIA.',
    'Voice direction: warm, professional, natural Latin American Spanish when the text is Spanish, clear pacing, friendly but not childish, confident but not exaggerated.',
    'Avoid sounding robotic, theatrical, rushed, or overly excited.',
    '',
    text,
  ].join('\n');
}

function buildReadingSpeechPrompt(text: string) {
  // Short prompt = fewer tokens = faster first-chunk synthesis.
  // Explicitly request expressive variation to avoid monotone delivery.
  return `Sweet, expressive female narrator. Vary your energy and tone across sentences — warm, curious, engaged, reflective. Never monotone. Latin American Spanish rhythm when applicable.\n\n${addNarrationTags(text)}`;
}

function buildContinuationSpeechPrompt(text: string) {
  return `Same sweet voice, keep varying your expression:\n\n${addContinuationTags(text)}`;
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

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

export async function synthesizeSpeechWithGemini(payload: TextToSpeechRequestPayload) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('GEMINI_TTS_NOT_CONFIGURED');
  }

  const isReading = payload.context === 'reading';
  const isContinuation = payload.context === 'reading_continuation';
  const modelId = getGeminiTTSModelId();
  const voiceName = (isReading || isContinuation) ? getGeminiReadingVoiceName() : getGeminiTTSVoiceName();
  const prompt = isContinuation
    ? buildContinuationSpeechPrompt(payload.text)
    : isReading
      ? buildReadingSpeechPrompt(payload.text)
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
