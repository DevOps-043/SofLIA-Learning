import { ONBOARDING_AUTO_OPEN_PATH, ONBOARDING_STORAGE_KEY } from './constants';

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter {
  setItem(key: string, value: string): void;
}

interface StorageRemover {
  removeItem(key: string): void;
}

export function hasSeenOnboarding(storage?: StorageReader | null): boolean {
  return storage?.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

export function markOnboardingAsSeen(storage?: StorageWriter | null) {
  storage?.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export function clearOnboardingSeen(storage?: StorageRemover | null) {
  storage?.removeItem(ONBOARDING_STORAGE_KEY);
}

export function shouldAutoOpenOnboarding(pathname: string, storage?: StorageReader | null): boolean {
  return pathname === ONBOARDING_AUTO_OPEN_PATH && !hasSeenOnboarding(storage);
}
