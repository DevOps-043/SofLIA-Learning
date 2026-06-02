// Conversión PCM16 ↔ base64 ↔ Float32 para el audio de Gemini Live.
// Funciones puras (sin estado) usadas por captura y reproducción.

export function int16ToBase64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let binary = '';
  const chunkSize = 0x8000; // evita "Maximum call stack" en arrays grandes
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  // El búfer puede no estar alineado a 2 bytes si la longitud es impar; lo
  // recortamos a un múltiplo de 2 para construir Int16Array con seguridad.
  const usableLength = bytes.length - (bytes.length % 2);
  return new Int16Array(bytes.buffer, 0, usableLength / 2);
}

export function int16ToFloat32(samples: Int16Array): Float32Array {
  const float = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    float[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
  }
  return float;
}

export function float32ToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}
