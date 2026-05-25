import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { validateAndPrepareUpload } from '../upload/validation.server';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/resilience/circuit-breaker', () => ({
  fetchWithCircuitBreaker: vi.fn(),
}));

vi.mock('@/lib/observability/metrics', () => ({
  incrementCounter: vi.fn(),
}));

const mockedFetchWithCircuitBreaker = vi.mocked(fetchWithCircuitBreaker);

function makeFile(name: string, type: string, bytes: Uint8Array): File {
  return new File([bytes], name, { type });
}

describe('validateAndPrepareUpload', () => {
  beforeEach(() => {
    mockedFetchWithCircuitBreaker.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects SVG payloads with script content even when declared as image', async () => {
    const svgBytes = new TextEncoder().encode('<svg><script>alert(1)</script></svg>');
    const file = makeFile('payload.svg', 'image/png', svgBytes);

    const result = await validateAndPrepareUpload(file, 'community-images');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('firma real');
  });

  it('requires antimalware for SCORM zip packages', async () => {
    const zip = new JSZip();
    zip.file('imsmanifest.xml', '<manifest />');
    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    const file = makeFile('course.zip', 'application/zip', zipBytes);

    const result = await validateAndPrepareUpload(file, 'scorm-packages');

    expect(result.valid).toBe(false);
    expect(result.antimalwareRequired).toBe(true);
  });

  it('accepts antimalware-protected buckets after a clean provider response', async () => {
    vi.stubEnv('UPLOAD_ANTIMALWARE_PROVIDER', 'clamav-http');
    vi.stubEnv('CLAMAV_SCAN_URL', 'http://clamav.internal/scan');
    mockedFetchWithCircuitBreaker.mockResolvedValue(new Response(null, { status: 204 }));
    const zip = new JSZip();
    zip.file('imsmanifest.xml', '<manifest />');
    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    const file = makeFile('course.zip', 'application/zip', zipBytes);

    const result = await validateAndPrepareUpload(file, 'scorm-packages');

    expect(result.valid).toBe(true);
    expect(mockedFetchWithCircuitBreaker).toHaveBeenCalledWith(
      'clamav-http',
      new URL('http://clamav.internal/scan'),
      expect.objectContaining({ method: 'POST' }),
      expect.objectContaining({ maxRetries: 0 }),
    );
  });
});
