'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createWavFromPcm } from '@/core/services/tts/audio-format.service';

interface UseLiaLiveVoiceOptions {
  isEnabled: boolean;
  isOpen: boolean;
}

interface InlineAudioPart {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
  inline_data?: {
    data?: string;
    mime_type?: string;
  };
}

const MEDIA_RECORDER_INTERVAL_MS = 300;

function buildLiveWebSocketUrl() {
  if (process.env.NEXT_PUBLIC_LIA_LIVE_WS_URL) {
    return process.env.NEXT_PUBLIC_LIA_LIVE_WS_URL;
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
    .replace(/\/$/, '');
  const liveHttpUrl = apiBase.endsWith('/api')
    ? `${apiBase}/v1/lia/live`
    : apiBase.endsWith('/api/v1')
      ? `${apiBase}/lia/live`
      : `${apiBase}/api/v1/lia/live`;

  return liveHttpUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read audio blob'));
    reader.readAsDataURL(blob);
  });
}

function base64ToBytes(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function extractInlineAudio(value: unknown): Array<{ data: string; mimeType: string }> {
  const found: Array<{ data: string; mimeType: string }> = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const maybePart = node as InlineAudioPart;
    const data = maybePart.inlineData?.data ?? maybePart.inline_data?.data;
    if (data) {
      found.push({
        data,
        mimeType:
          maybePart.inlineData?.mimeType ??
          maybePart.inline_data?.mime_type ??
          'audio/pcm;rate=24000',
      });
    }

    for (const child of Object.values(node as Record<string, unknown>)) {
      if (Array.isArray(child)) {
        child.forEach(visit);
      } else {
        visit(child);
      }
    }
  };

  visit(value);
  return found;
}

function resolveRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

export function useLiaLiveVoice({ isEnabled, isOpen }: UseLiaLiveVoiceOptions) {
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [isLiveVoiceConnecting, setIsLiveVoiceConnecting] = useState(false);
  const [liveVoiceError, setLiveVoiceError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingQueueRef = useRef(false);

  const playNextAudioChunk = useCallback(() => {
    if (isPlayingQueueRef.current) {
      return;
    }

    const next = audioQueueRef.current.shift();
    if (!next) {
      return;
    }

    isPlayingQueueRef.current = true;
    const url = URL.createObjectURL(next);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingQueueRef.current = false;
      playNextAudioChunk();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      isPlayingQueueRef.current = false;
      playNextAudioChunk();
    };
    void audio.play().catch(() => {
      URL.revokeObjectURL(url);
      isPlayingQueueRef.current = false;
      playNextAudioChunk();
    });
  }, []);

  const enqueueBase64Audio = useCallback((data: string, mimeType: string) => {
    const bytes = base64ToBytes(data);
    const blob = mimeType.includes('pcm')
      ? new Blob([createWavFromPcm(bytes)], { type: 'audio/wav' })
      : new Blob([bytes], { type: mimeType || 'audio/mpeg' });
    audioQueueRef.current.push(blob);
    playNextAudioChunk();
  }, [playNextAudioChunk]);

  const stopLiveVoice = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop' }));
      socketRef.current.close();
    } else {
      socketRef.current?.close();
    }
    socketRef.current = null;

    setIsLiveVoiceActive(false);
    setIsLiveVoiceConnecting(false);
  }, []);

  const startLiveVoice = useCallback(async () => {
    if (!isEnabled || typeof window === 'undefined' || !navigator.mediaDevices) {
      setLiveVoiceError('LIVE_VOICE_UNAVAILABLE');
      return;
    }

    setLiveVoiceError(null);
    setIsLiveVoiceConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const socket = new WebSocket(buildLiveWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        const mimeType = resolveRecorderMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (!event.data.size || socket.readyState !== WebSocket.OPEN) {
            return;
          }

          void blobToBase64(event.data).then((data) => {
            if (data && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'audio',
                data,
                mimeType: recorder.mimeType || mimeType || 'audio/webm',
              }));
            }
          });
        };

        recorder.start(MEDIA_RECORDER_INTERVAL_MS);
        setIsLiveVoiceConnecting(false);
        setIsLiveVoiceActive(true);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as unknown;
          const audioParts = extractInlineAudio(payload);
          audioParts.forEach((part) => enqueueBase64Audio(part.data, part.mimeType));
        } catch {
          // Non-JSON frames are ignored; the proxy forwards upstream payloads.
        }
      };

      socket.onerror = () => {
        setLiveVoiceError('LIVE_VOICE_CONNECTION_ERROR');
        stopLiveVoice();
      };

      socket.onclose = () => {
        stopLiveVoice();
      };
    } catch {
      setLiveVoiceError('LIVE_VOICE_PERMISSION_ERROR');
      stopLiveVoice();
    }
  }, [enqueueBase64Audio, isEnabled, stopLiveVoice]);

  const toggleLiveVoice = useCallback(() => {
    if (isLiveVoiceActive || isLiveVoiceConnecting) {
      stopLiveVoice();
      return;
    }

    void startLiveVoice();
  }, [isLiveVoiceActive, isLiveVoiceConnecting, startLiveVoice, stopLiveVoice]);

  useEffect(() => {
    if (!isOpen) {
      stopLiveVoice();
    }

    return () => stopLiveVoice();
  }, [isOpen, stopLiveVoice]);

  return {
    isLiveVoiceActive,
    isLiveVoiceConnecting,
    liveVoiceError,
    toggleLiveVoice,
    stopLiveVoice,
  };
}
