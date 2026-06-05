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

  it('keeps all accepted speech chunks on Gemini TTS and caps the turn at four chunks', async () => {
    requestTTSAudioMock.mockResolvedValue(new Blob(['audio']));
    const player = new StreamingSpeechPlayer();

    expect(player.enqueue('Primer fragmento.')).toBe(true);
    expect(player.enqueue('Segundo fragmento.')).toBe(true);
    expect(player.enqueue('Tercer fragmento.')).toBe(true);
    expect(player.enqueue('Cuarto fragmento.')).toBe(true);
    expect(player.enqueue('Quinto fragmento.')).toBe(false);

    await flushMicrotasks();

    expect(requestTTSAudioMock).toHaveBeenCalledTimes(4);
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
    expect(requestTTSAudioMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ context: 'chat_continuation' }),
      expect.any(AbortSignal),
    );
    expect(requestTTSAudioMock).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ context: 'chat_continuation' }),
      expect.any(AbortSignal),
    );

    player.stop();
  });
});
