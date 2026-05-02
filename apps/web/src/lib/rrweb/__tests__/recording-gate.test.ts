import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RECORDING_GATE_STORAGE_KEYS,
  evaluateRecordingGate,
  shouldRecordSession,
} from '../recording-gate';

type MatchMediaResult = Partial<MediaQueryList> & { matches: boolean };
type ConnectionLike = { saveData?: boolean; effectiveType?: string };
type NavigatorProfile = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
};

const WINDOWS_CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function installLocalStorageMock() {
  const store = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
}

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
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: map['(max-width: 768px)'] ? 768 : 1024,
  });
}

function setConnection(connection: ConnectionLike | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    writable: true,
    value: connection,
  });
}

function setNavigatorProfile(profile: NavigatorProfile = {}) {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: profile.userAgent ?? WINDOWS_CHROME_USER_AGENT,
  });
  Object.defineProperty(navigator, 'platform', {
    configurable: true,
    value: profile.platform ?? 'Win32',
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: profile.maxTouchPoints ?? 0,
  });
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    configurable: true,
    value: profile.hardwareConcurrency ?? 8,
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    configurable: true,
    value: profile.deviceMemory ?? 8,
  });
}

describe('recording-gate', () => {
  beforeEach(() => {
    installLocalStorageMock();
    setMatchMedia({});
    setConnection(undefined);
    setNavigatorProfile();
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

  it('deniega por defecto en iPhone', () => {
    setNavigatorProfile({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('apple-platform');
  });

  it('deniega por defecto en Safari/macOS', () => {
    setNavigatorProfile({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      platform: 'MacIntel',
    });

    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('apple-platform');
  });

  it('deniega por defecto en Chrome/macOS por plataforma Apple', () => {
    setNavigatorProfile({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'MacIntel',
    });

    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('apple-platform');
  });

  it('deniega cuando el dispositivo reporta baja concurrencia de CPU', () => {
    setNavigatorProfile({ hardwareConcurrency: 2 });

    const decision = evaluateRecordingGate();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('low-hardware');
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
