import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RECORDING_GATE_STORAGE_KEYS,
  evaluateRecordingGate,
  shouldRecordSession,
} from '../recording-gate';

type MatchMediaResult = Partial<MediaQueryList> & { matches: boolean };
type ConnectionLike = { saveData?: boolean; effectiveType?: string };

function setMatchMedia(map: Record<string, boolean>) {
  const impl = (query: string): MatchMediaResult => ({
    matches: map[query] ?? false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: impl,
  });
}

function setConnection(connection: ConnectionLike | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    writable: true,
    value: connection,
  });
}

describe('recording-gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setMatchMedia({});
    setConnection(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deniega cuando el viewport es mobile (<= 768px)', () => {
    setMatchMedia({ '(max-width: 768px)': true });
    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('mobile-viewport');
  });

  it('deniega cuando prefers-reduced-motion está activo', () => {
    setMatchMedia({ '(prefers-reduced-motion: reduce)': true });
    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('reduced-motion');
  });

  it('deniega cuando el navegador reporta save-data', () => {
    setConnection({ saveData: true });
    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('save-data');
  });

  it('deniega cuando effectiveType es 2g o 3g', () => {
    setConnection({ effectiveType: '2g' });
    expect(evaluateRecordingGate().reason).toBe('slow-connection');

    setConnection({ effectiveType: 'slow-2g' });
    expect(evaluateRecordingGate().reason).toBe('slow-connection');

    setConnection({ effectiveType: '3g' });
    expect(evaluateRecordingGate().reason).toBe('slow-connection');
  });

  it('deniega cuando el usuario tiene el flag de opt-out activado', () => {
    window.localStorage.setItem(RECORDING_GATE_STORAGE_KEYS.disable, '1');
    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('disabled-by-flag');
  });

  it('permite siempre cuando existe el flag de force-enable (QA/soporte)', () => {
    window.localStorage.setItem(RECORDING_GATE_STORAGE_KEYS.forceEnable, '1');
    setMatchMedia({ '(max-width: 768px)': true });
    setConnection({ effectiveType: '2g', saveData: true });

    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('force-enabled');
  });

  it('permite cuando desktop, red rápida y sin flags', () => {
    setMatchMedia({ '(max-width: 768px)': false, '(prefers-reduced-motion: reduce)': false });
    setConnection({ effectiveType: '4g', saveData: false });
    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('allowed');
    expect(shouldRecordSession()).toBe(true);
  });
});
