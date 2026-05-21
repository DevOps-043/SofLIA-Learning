const WAV_HEADER_BYTES = 44;
const DEFAULT_PCM_SAMPLE_RATE = 24000;
const DEFAULT_PCM_CHANNELS = 1;
const DEFAULT_PCM_BITS_PER_SAMPLE = 16;

export function createWavFromPcm(
  pcmData: Uint8Array,
  options: {
    sampleRate?: number;
    channels?: number;
    bitsPerSample?: number;
  } = {}
) {
  const sampleRate = options.sampleRate ?? DEFAULT_PCM_SAMPLE_RATE;
  const channels = options.channels ?? DEFAULT_PCM_CHANNELS;
  const bitsPerSample = options.bitsPerSample ?? DEFAULT_PCM_BITS_PER_SAMPLE;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  bytes.set(pcmData, WAV_HEADER_BYTES);

  return bytes;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
