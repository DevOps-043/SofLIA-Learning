import type { Step, StepTarget } from 'react-joyride';

const DEFAULT_TARGET_READY_TIMEOUT_MS = 1600;
const TARGET_READY_INTERVAL_MS = 80;

export function resolveJoyrideTargetElement(target: StepTarget): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  if (typeof target === 'string') {
    const element = document.querySelector(target);
    return element instanceof HTMLElement ? element : null;
  }

  if (target instanceof HTMLElement) {
    return target;
  }

  if (typeof target === 'function') {
    const element = target();
    return element instanceof HTMLElement ? element : null;
  }

  const maybeRef = target as { current?: unknown } | null;
  return maybeRef?.current instanceof HTMLElement ? maybeRef.current : null;
}

export function isJoyrideTargetReady(target: StepTarget): boolean {
  const element = resolveJoyrideTargetElement(target);

  if (!element) {
    return false;
  }

  if (element === document.body || element === document.documentElement) {
    return true;
  }

  if (element.closest('[hidden], [aria-hidden="true"], .hidden')) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (style.opacity !== '' && Number(style.opacity) === 0)
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export async function waitForJoyrideTargetReady(
  target: StepTarget,
  timeoutMs = DEFAULT_TARGET_READY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isJoyrideTargetReady(target)) {
    return true;
  }

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (isJoyrideTargetReady(target)) {
        window.clearInterval(intervalId);
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(intervalId);
        resolve(false);
      }
    }, TARGET_READY_INTERVAL_MS);
  });
}

export async function waitForJoyrideStepTargetReady(
  step: Step | undefined,
  tourId: string,
): Promise<boolean> {
  if (!step) {
    return false;
  }

  const isReady = await waitForJoyrideTargetReady(step.target);

  if (!isReady) {
    console.warn(
      `[${tourId}] Joyride target not ready; aborting tour start:`,
      step.target,
    );
  }

  return isReady;
}
