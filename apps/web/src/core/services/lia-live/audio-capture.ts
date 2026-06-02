'use client';

import { LIA_LIVE_INPUT_SAMPLE_RATE } from './constants';
import { int16ToBase64 } from './pcm-utils';

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext || null;
}

// Worklet que acumula ~128 ms de audio y lo emite como PCM16 (Int16Array).
// Se sirve como Blob URL para no requerir un archivo público adicional.
const CAPTURE_WORKLET_SOURCE = `
class LiaLiveCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._target = 2048; // ~128 ms a 16 kHz
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channel = input[0];
      for (let i = 0; i < channel.length; i++) this._buffer.push(channel[i]);
      while (this._buffer.length >= this._target) {
        const frame = this._buffer.splice(0, this._target);
        const int16 = new Int16Array(frame.length);
        for (let j = 0; j < frame.length; j++) {
          const c = Math.max(-1, Math.min(1, frame[j]));
          int16[j] = c < 0 ? c * 0x8000 : c * 0x7fff;
        }
        this.port.postMessage(int16, [int16.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('lia-live-capture', LiaLiveCaptureProcessor);
`;

let cachedWorkletUrl: string | null = null;
function getCaptureWorkletUrl(): string {
  if (!cachedWorkletUrl) {
    const blob = new Blob([CAPTURE_WORKLET_SOURCE], { type: 'application/javascript' });
    cachedWorkletUrl = URL.createObjectURL(blob);
  }
  return cachedWorkletUrl;
}

/**
 * Captura el micrófono y emite fragmentos PCM16 (base64) a 16 kHz para enviar a
 * Gemini Live. El AudioContext se crea a 16 kHz para que el navegador remuestree
 * la entrada; el worklet solo convierte a PCM16 y NO se conecta a la salida
 * (evita eco).
 */
export class LiaLiveMicCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;

  async start(onChunk: (base64Pcm16: string) => void): Promise<void> {
    const Ctor = getAudioContextCtor();
    if (!Ctor) throw new Error('AudioContext no disponible en este navegador.');

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });

    this.context = new Ctor({ sampleRate: LIA_LIVE_INPUT_SAMPLE_RATE });
    await this.context.audioWorklet.addModule(getCaptureWorkletUrl());

    this.sourceNode = this.context.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.context, 'lia-live-capture');
    this.workletNode.port.onmessage = (event: MessageEvent<Int16Array>) => {
      onChunk(int16ToBase64(event.data));
    };

    this.sourceNode.connect(this.workletNode);
  }

  async stop(): Promise<void> {
    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      try { this.workletNode.disconnect(); } catch { /* ignore */ }
      this.workletNode = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch { /* ignore */ }
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.context) {
      try { await this.context.close(); } catch { /* ignore */ }
      this.context = null;
    }
  }
}
