'use client';

import {
  GoogleGenAI,
  Modality,
  type LiveServerMessage,
  type Session,
} from '@google/genai';

import {
  LIA_LIVE_INPUT_MIME_TYPE,
  LIA_LIVE_LANGUAGE_CODE,
  LIA_LIVE_SYSTEM_INSTRUCTION,
} from './constants';

export interface LiaLiveSessionCallbacks {
  /** Audio del modelo (PCM16 24 kHz, base64). */
  onAudio: (base64Pcm: string) => void;
  /** El modelo fue interrumpido (el usuario habló): cortar reproducción. */
  onInterrupted: () => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onTurnComplete?: () => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
}

export interface LiaLiveSessionHandle {
  sendAudioChunk: (base64Pcm16: string) => void;
  sendText: (text: string) => void;
  close: () => void;
}

interface ConnectParams extends LiaLiveSessionCallbacks {
  token: string;
  model: string;
  systemInstruction?: string;
  languageCode?: string;
}

/**
 * Abre una sesión de Gemini Live usando el token efímero (la API key nunca está
 * en el cliente) y enruta los eventos del servidor a los callbacks.
 */
export async function connectLiaLiveSession({
  token,
  model,
  systemInstruction = LIA_LIVE_SYSTEM_INSTRUCTION,
  languageCode = LIA_LIVE_LANGUAGE_CODE,
  onAudio,
  onInterrupted,
  onInputTranscript,
  onOutputTranscript,
  onTurnComplete,
  onError,
  onClose,
}: ConnectParams): Promise<LiaLiveSessionHandle> {
  const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });

  const session: Session = await ai.live.connect({
    model,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      speechConfig: { languageCode },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => { /* conexión abierta */ },
      onmessage: (message: LiveServerMessage) => {
        const audio = message.data;
        if (audio) onAudio(audio);

        const serverContent = message.serverContent;
        if (serverContent?.interrupted) onInterrupted();
        if (serverContent?.inputTranscription?.text) {
          onInputTranscript?.(serverContent.inputTranscription.text);
        }
        if (serverContent?.outputTranscription?.text) {
          onOutputTranscript?.(serverContent.outputTranscription.text);
        }
        if (serverContent?.turnComplete) onTurnComplete?.();
      },
      onerror: (event: ErrorEvent) => onError?.(event),
      onclose: () => onClose?.(),
    },
  });

  return {
    sendAudioChunk: (base64Pcm16: string) => {
      session.sendRealtimeInput({ audio: { data: base64Pcm16, mimeType: LIA_LIVE_INPUT_MIME_TYPE } });
    },
    sendText: (text: string) => {
      session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
    },
    close: () => {
      try { session.close(); } catch { /* ignore */ }
    },
  };
}
