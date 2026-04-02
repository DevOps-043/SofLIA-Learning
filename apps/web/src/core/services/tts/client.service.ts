import type { MutableRefObject } from 'react';
import type { WebSpeechRequestPayload, TextToSpeechRequestPayload } from './types';
import { DEFAULT_TTS_VOLUME, TTS_API_PATH } from './shared';

type AudioRef = MutableRefObject<HTMLAudioElement | null>;

interface PlayAudioBlobOptions {
  volume?: number;
  onFinish?: () => void;
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
  window.speechSynthesis.speak(utterance);
}

export function isTTSAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === 'AbortError' || error.message.includes('aborted');
}
