import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useLiaTurnVoice,
  VOICE_END_OF_TURN_SILENCE_MS,
} from '../hooks/useLiaTurnVoice';

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onresult: ((event: never) => void) | null = null;
  onerror: ((event: never) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() { FakeRecognition.instances.push(this); }
  start() { this.onstart?.(); }
  stop() { this.onend?.(); }
}

describe('useLiaTurnVoice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeRecognition.instances = [];
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeRecognition,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'webkitSpeechRecognition');
  });

  it('espera una pausa suficiente antes de enviar el turno oculto al chat', () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLiaTurnVoice({
      enabled: true,
      isOpen: true,
      language: 'es',
      messages: [],
      isLoading: false,
      isSpeaking: false,
      voiceReveal: { messageId: null, length: 0 },
      pageContext: { currentTab: 'users' },
      sendMessage,
    }));

    act(() => result.current.start());
    expect(result.current.status).toBe('listening');

    const recognition = FakeRecognition.instances[0];
    expect(recognition.continuous).toBe(true);
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: Object.assign([{ 0: { transcript: 'asigna el curso a Ana' }, isFinal: true }], { length: 1 }),
      } as never);
    });

    act(() => vi.advanceTimersByTime(VOICE_END_OF_TURN_SILENCE_MS - 1));
    expect(sendMessage).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(sendMessage).toHaveBeenCalledWith(
      'asigna el curso a Ana',
      false,
      { currentTab: 'users', interactionMode: 'voice-conversation' },
    );
    expect(result.current.status).toBe('processing');
    expect(result.current).not.toHaveProperty('transcript');
  });

  it('conserva lo dicho si el navegador cierra el reconocimiento durante una pausa breve', () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLiaTurnVoice({
      enabled: true,
      isOpen: true,
      language: 'es',
      messages: [],
      isLoading: false,
      isSpeaking: false,
      voiceReveal: { messageId: null, length: 0 },
      pageContext: null,
      sendMessage,
    }));

    act(() => result.current.start());
    const firstRecognition = FakeRecognition.instances[0];
    act(() => {
      firstRecognition.onresult?.({
        resultIndex: 0,
        results: Object.assign([{ 0: { transcript: 'genera el reporte' }, isFinal: true }], { length: 1 }),
      } as never);
      firstRecognition.onend?.();
    });

    expect(sendMessage).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(120));

    const secondRecognition = FakeRecognition.instances[1];
    act(() => {
      secondRecognition.onresult?.({
        resultIndex: 0,
        results: Object.assign([{ 0: { transcript: 'de los últimos treinta días' }, isFinal: true }], { length: 1 }),
      } as never);
      vi.advanceTimersByTime(VOICE_END_OF_TURN_SILENCE_MS);
    });

    expect(sendMessage).toHaveBeenCalledWith(
      'genera el reporte de los últimos treinta días',
      false,
      { interactionMode: 'voice-conversation' },
    );
  });

  it('detiene el reconocimiento y abandona el modo de voz', () => {
    const { result } = renderHook(() => useLiaTurnVoice({
      enabled: true,
      isOpen: true,
      language: 'es',
      messages: [],
      isLoading: false,
      isSpeaking: false,
      voiceReveal: { messageId: null, length: 0 },
      pageContext: null,
      sendMessage: vi.fn().mockResolvedValue(undefined),
    }));

    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(result.current.isActive).toBe(false);
  });
});
