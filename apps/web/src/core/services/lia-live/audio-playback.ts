'use client';

import { LIA_LIVE_OUTPUT_SAMPLE_RATE } from './constants';
import { base64ToInt16, int16ToFloat32 } from './pcm-utils';

type AudioContextCtor = typeof AudioContext;

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
    source.onended = () => this.activeSources.delete(source);
  }

  /** Corta toda la reproducción pendiente (barge-in / interrupción del modelo). */
  interrupt(): void {
    this.activeSources.forEach((source) => {
      try { source.stop(); } catch { /* ya detenido */ }
    });
    this.activeSources.clear();
    this.nextStartTime = 0;
  }

  async close(): Promise<void> {
    this.interrupt();
    if (this.context) {
      try { await this.context.close(); } catch { /* ignore */ }
      this.context = null;
    }
  }
}
