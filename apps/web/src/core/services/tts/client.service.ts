import type { MutableRefObject } from 'react';
import type { WebSpeechRequestPayload, TextToSpeechRequestPayload } from './types';
import { DEFAULT_TTS_VOLUME, TTS_API_PATH } from './shared';

type AudioRef = MutableRefObject<HTMLAudioElement | null>;
const FEMALE_VOICE_HINTS = [
  'female',
  'woman',
  'zira',
  'sabina',
  'helena',
  'monica',
  'paulina',
  'paloma',
  'sofia',
  'lucia',
  'maria',
  'carmen',
];
const MALE_VOICE_HINTS = [
  'male',
  'man',
  'jorge',
  'diego',
  'carlos',
  'miguel',
  'david',
  'pablo',
  'antonio',
  'raul',
];

interface PlayAudioBlobOptions {
  volume?: number;
  onFinish?: () => void;
}

function scoreVoiceMatch(voice: SpeechSynthesisVoice, requestedLang: string): number {
  const voiceLang = (voice.lang || '').toLowerCase();
  const normalizedRequestedLang = requestedLang.toLowerCase();
  const requestedBaseLang = normalizedRequestedLang.split('-')[0] || normalizedRequestedLang;
  const searchableName = `${voice.name} ${voice.voiceURI}`.toLowerCase();

  let score = 0;

  if (voiceLang === normalizedRequestedLang) {
    score += 12;
  } else if (voiceLang.startsWith(`${requestedBaseLang}-`) || voiceLang === requestedBaseLang) {
    score += 8;
  }

  if (voice.localService) {
    score += 2;
  }

  if (voice.default) {
    score += 1;
  }

  if (FEMALE_VOICE_HINTS.some((hint) => searchableName.includes(hint))) {
    score += 10;
  }

  if (MALE_VOICE_HINTS.some((hint) => searchableName.includes(hint))) {
    score -= 10;
  }

  return score;
}

export function selectPreferredWebSpeechVoice(
  voices: SpeechSynthesisVoice[],
  requestedLang: string
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  const normalizedRequestedLang = requestedLang.toLowerCase();
  const requestedBaseLang = normalizedRequestedLang.split('-')[0] || normalizedRequestedLang;

  const languageMatches = voices.filter((voice) => {
    const voiceLang = (voice.lang || '').toLowerCase();
    return voiceLang === normalizedRequestedLang
      || voiceLang === requestedBaseLang
      || voiceLang.startsWith(`${requestedBaseLang}-`);
  });

  const candidateVoices = languageMatches.length > 0 ? languageMatches : voices;
  const rankedVoices = [...candidateVoices].sort(
    (left, right) => scoreVoiceMatch(right, requestedLang) - scoreVoiceMatch(left, requestedLang)
  );

  return rankedVoices[0] || null;
}

export async function requestTTSAudio(
  payload: TextToSpeechRequestPayload,
  signal?: AbortSignal
): Promise<Blob | null> {
  const response = await fetch(TTS_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (response.status === 503) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  return response.blob();
}

export async function playAudioBlob(
  blob: Blob,
  audioRef: AudioRef,
  options: PlayAudioBlobOptions = {}
): Promise<void> {
  const volume = options.volume ?? DEFAULT_TTS_VOLUME;
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.volume = volume;
  audioRef.current = audio;

  const cleanup = () => {
    URL.revokeObjectURL(audioUrl);
    if (audioRef.current === audio) {
      audioRef.current = null;
    }
  };

  audio.onended = () => {
    cleanup();
    options.onFinish?.();
  };

  audio.onerror = () => {
    cleanup();
    options.onFinish?.();
  };

  try {
    await audio.play();
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function speakWithWebSpeech(
  text: string,
  utteranceRef: MutableRefObject<SpeechSynthesisUtterance | null>,
  payload: WebSpeechRequestPayload,
  onFinish: () => void
) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = payload.lang;
  utterance.rate = payload.rate;
  utterance.pitch = payload.pitch;
  utterance.volume = payload.volume;
  utterance.onend = () => {
    utteranceRef.current = null;
    onFinish();
  };
  utterance.onerror = () => {
    utteranceRef.current = null;
    onFinish();
  };
  utteranceRef.current = utterance;

  let hasStartedSpeaking = false;

  const startSpeaking = () => {
    if (hasStartedSpeaking || utteranceRef.current !== utterance) {
      return;
    }

    hasStartedSpeaking = true;
    const preferredVoice = selectPreferredWebSpeechVoice(
      window.speechSynthesis.getVoices(),
      payload.lang
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    startSpeaking();
    return;
  }

  const handleVoicesChanged = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    startSpeaking();
  };

  window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  window.setTimeout(() => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    startSpeaking();
  }, 250);
}

export function isTTSAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === 'AbortError' || error.message.includes('aborted');
}
