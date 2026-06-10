import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { playAudioBlob } from '../client/audio-blob-player.service';
import { StreamingSpeechPlayer } from '../client/streaming-speech-player';
import { requestTTSAudio } from '../client/tts-api.service';

vi.mock('../client/audio-blob-player.service', () => ({
  playAudioBlob: vi.fn(),
}));

vi.mock('../client/tts-api.service', () => ({
  requestTTSAudio: vi.fn(),
}));

const requestTTSAudioMock = vi.mocked(requestTTSAudio);
const playAudioBlobMock = vi.mocked(playAudioBlob);

async function flushMicrotasks(times = 20): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve();
  }
}

describe('StreamingSpeechPlayer', () => {
  beforeEach(() => {
    requestTTSAudioMock.mockReset();
    playAudioBlobMock.mockReset();
    playAudioBlobMock.mockImplementation(async (_blob, _audioRef, options) => {
      options?.onFinish?.();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('speaks long answers beyond four chunks instead of cutting off', async () => {
    // Antes existía un tope duro de 4 fragmentos por respuesta: en respuestas
    // largas el audio se cortaba. Ahora una respuesta troceada en muchos
    // fragmentos se sintetiza completa (el throttle real es la concurrencia).
    requestTTSAudioMock.mockResolvedValue(new Blob(['audio']));
    const player = new StreamingSpeechPlayer();

    for (let i = 0; i < 12; i += 1) {
      expect(player.enqueue(`Fragmento ${i}.`)).toBe(true);
    }

    await flushMicrotasks(80);

    expect(requestTTSAudioMock).toHaveBeenCalledTimes(12);
    expect(requestTTSAudioMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ context: 'chat' }),
      expect.any(AbortSignal),
    );
    expect(requestTTSAudioMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ context: 'chat_continuation' }),
      expect.any(AbortSignal),
    );

    player.stop();
  });

  it('rejects chunks past the per-turn safety ceiling', async () => {
    requestTTSAudioMock.mockResolvedValue(new Blob(['audio']));
    const player = new StreamingSpeechPlayer();

    // El tope de seguridad (48) evita encolar sin límite en casos patológicos.
    let accepted = 0;
    for (let i = 0; i < 60; i += 1) {
      if (player.enqueue(`Fragmento ${i}.`)) accepted += 1;
    }

    expect(accepted).toBe(48);
    expect(player.enqueue('Uno más.')).toBe(false);

    await flushMicrotasks(120);
    player.stop();
  });
});
