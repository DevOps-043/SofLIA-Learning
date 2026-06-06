import { describe, expect, it, vi } from 'vitest';
import { validateAndPrepareUpload } from '../upload/validation.server';

vi.mock('server-only', () => ({}));

// validation.server importa estas dependencias en carga de modulo; se mockean para
// aislar el test aunque sus rutas (antimalware) no se ejerciten aqui.
vi.mock('@/lib/resilience/circuit-breaker', () => ({
  fetchWithCircuitBreaker: vi.fn(),
}));

vi.mock('@/lib/observability/metrics', () => ({
  incrementCounter: vi.fn(),
}));

function makeFile(name: string, type: string, bytes: Uint8Array): File {
  return new File([bytes], name, { type });
}

describe('validateAndPrepareUpload', () => {
  it('rejects SVG payloads with script content even when declared as image', async () => {
    const svgBytes = new TextEncoder().encode('<svg><script>alert(1)</script></svg>');
    const file = makeFile('payload.svg', 'image/png', svgBytes);

    const result = await validateAndPrepareUpload(file, 'community-images');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('firma real');
  });
});
