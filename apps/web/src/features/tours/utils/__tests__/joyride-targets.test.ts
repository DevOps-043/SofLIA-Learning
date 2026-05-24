// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isJoyrideTargetReady,
  resolveJoyrideTargetElement,
  waitForJoyrideStepTargetReady,
} from '../joyride-targets';

function appendTarget(id: string, rect: Partial<DOMRect> = {}): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: 140,
    height: 100,
    left: 20,
    right: 220,
    toJSON: () => '',
    top: 40,
    width: 200,
    x: 20,
    y: 40,
    ...rect,
  }));
  document.body.appendChild(element);
  return element;
}

describe('joyride-targets', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('resolves selector, HTMLElement, function, and ref targets', () => {
    const element = appendTarget('target');
    const ref = { current: element };

    expect(resolveJoyrideTargetElement('#target')).toBe(element);
    expect(resolveJoyrideTargetElement(element)).toBe(element);
    expect(resolveJoyrideTargetElement(() => element)).toBe(element);
    expect(resolveJoyrideTargetElement(ref)).toBe(element);
  });

  it('requires visible targets with dimensions before launching a tour', () => {
    appendTarget('ready');
    appendTarget('empty', { height: 0, width: 0 });

    expect(isJoyrideTargetReady('#ready')).toBe(true);
    expect(isJoyrideTargetReady('#empty')).toBe(false);
    expect(isJoyrideTargetReady('#missing')).toBe(false);
  });

  it('waits briefly and returns false instead of allowing stuck overlays', async () => {
    vi.useFakeTimers();
    const readyPromise = waitForJoyrideStepTargetReady(
      {
        target: '#missing',
        title: 'Missing target',
        content: 'Missing target content',
      },
      'test-tour',
    );

    await vi.advanceTimersByTimeAsync(1700);

    await expect(readyPromise).resolves.toBe(false);
  });
});
