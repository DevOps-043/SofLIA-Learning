'use client';

import { LIA_LIVE_OUTPUT_SAMPLE_RATE } from './constants';
import { base64ToInt16, int16ToFloat32 } from './pcm-utils';

type AudioContextCtor = typeof AudioContext;

interface LiaLiveAudioPlayerOptions {
  onPlaybackStart?: () => void;
  onPlaybackIdle?: () => void;
}

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext || null;
}

/**
 * Reproduce los fragmentos PCM16 (24 kHz) que llegan de Gemini Live, encolados
 * para que suenen de forma continua. `interrupt()` corta todo (barge-in cuando
 * el usuario vuelve a hablar).
 */
export class LiaLiveAudioPlayer {
  private context: AudioContext | null = null;
  private nextStartTime = 0;
  private readonly activeSources = new Set<AudioBufferSourceNode>();
  private readonly startTimers = new Map<AudioBufferSourceNode, ReturnType<typeof globalThis.setTimeout>>();
  private isPlaying = false;

  constructor(private readonly options: LiaLiveAudioPlayerOptions = {}) {}

  private async ensureContext(): Promise<AudioContext | null> {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume();
      return this.context;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    this.context = new Ctor({ sampleRate: LIA_LIVE_OUTPUT_SAMPLE_RATE });
    return this.context;
  }

  async enqueue(base64Pcm: string): Promise<void> {
    const context = await this.ensureContext();
    if (!context) return;

    const float32 = int16ToFloat32(base64ToInt16(base64Pcm));
    if (float32.length === 0) return;

    const buffer = context.createBuffer(1, float32.length, LIA_LIVE_OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startAt = Math.max(context.currentTime, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.activeSources.add(source);
    const delayMs = Math.max(0, (startAt - context.currentTime) * 1000);
    const startTimer = globalThis.setTimeout(() => {
      this.startTimers.delete(source);
      this.markPlaybackStart();
    }, delayMs);
    this.startTimers.set(source, startTimer);

    source.onended = () => {
      const pendingStartTimer = this.startTimers.get(source);
      if (pendingStartTimer) {
        globalThis.clearTimeout(pendingStartTimer);
        this.startTimers.delete(source);
      }
      this.activeSources.delete(source);
      this.markPlaybackIdleIfNeeded();
    };
  }

  private markPlaybackStart(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.options.onPlaybackStart?.();
  }

  private markPlaybackIdleIfNeeded(): void {
    if (this.activeSources.size > 0 || !this.isPlaying) return;
    this.isPlaying = false;
    this.options.onPlaybackIdle?.();
  }

  /** Corta toda la reproducción pendiente (barge-in / interrupción del modelo). */
  interrupt(): void {
    this.startTimers.forEach((timer) => globalThis.clearTimeout(timer));
    this.startTimers.clear();
    this.activeSources.forEach((source) => {
      try { source.stop(); } catch { /* ya detenido */ }
    });
    this.activeSources.clear();
    this.nextStartTime = 0;
    if (this.isPlaying) {
      this.isPlaying = false;
      this.options.onPlaybackIdle?.();
    }
  }

  async close(): Promise<void> {
    this.interrupt();
    if (this.context) {
      try { await this.context.close(); } catch { /* ignore */ }
      this.context = null;
    }
  }
}
