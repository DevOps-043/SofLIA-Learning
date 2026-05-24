// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import type { Step } from 'react-joyride';

import {
  normalizeJoyrideSteps,
  toJoyrideV3Props,
  type JoyrideClientProps,
} from '../JoyrideClient';

const steps: Step[] = [
  {
    target: 'body',
    title: 'Title',
    content: 'Content',
  },
];

describe('JoyrideClient', () => {
  it('normalizes steps to skip Joyride V3 beacons by default', () => {
    expect(normalizeJoyrideSteps(steps)[0]).toMatchObject({
      skipBeacon: true,
    });
  });

  it('preserves explicit beacon opt-out overrides', () => {
    const normalized = normalizeJoyrideSteps([
      {
        target: 'body',
        title: 'Title',
        content: 'Content',
        skipBeacon: false,
      },
    ]);

    expect(normalized[0].skipBeacon).toBe(false);
  });

  it('removes legacy SVG-incompatible spotlight styles from steps', () => {
    const normalized = normalizeJoyrideSteps([
      {
        target: 'body',
        title: 'Title',
        content: 'Content',
        styles: {
          spotlight: {
            borderRadius: 16,
            zIndex: 1000,
          },
        },
      },
    ]);

    expect(normalized[0].styles?.spotlight).toBeUndefined();
  });

  it('maps legacy Joyride props to the V3 public API', () => {
    const callback = vi.fn();
    const props: JoyrideClientProps = {
      callback,
      continuous: true,
      disableCloseOnEsc: true,
      disableOverlayClose: true,
      disableScrolling: true,
      floaterProps: {
        hideArrow: true,
        offset: 15,
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
          },
        },
      },
      run: true,
      scrollOffset: 120,
      showProgress: true,
      showSkipButton: true,
      spotlightPadding: 8,
      steps,
      styles: {
        options: {
          arrowColor: '#1E2329',
          primaryColor: 'var(--color-accent)',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 16,
        },
      },
    };

    const mappedProps = toJoyrideV3Props(props, true, normalizeJoyrideSteps(steps));

    expect(mappedProps.onEvent).toBe(callback);
    expect(mappedProps.floatingOptions?.hideArrow).toBe(true);
    expect(mappedProps.options).toMatchObject({
      arrowColor: '#1E2329',
      buttons: ['back', 'primary', 'close', 'skip'],
      dismissKeyAction: false,
      offset: 15,
      overlayClickAction: false,
      primaryColor: 'var(--color-accent)',
      scrollOffset: 120,
      showProgress: true,
      skipScroll: true,
      spotlightPadding: 8,
      spotlightRadius: 16,
      targetWaitTimeout: 1600,
      zIndex: 10000,
    });
    expect(mappedProps.styles?.floater).toMatchObject({
      filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
      zIndex: 10002,
    });
    expect(mappedProps.styles?.tooltip).toMatchObject({
      zIndex: 10002,
    });
    expect(mappedProps.steps[0].skipBeacon).toBe(true);
  });

  it('does not pass undefined option overrides to Joyride V3 defaults', () => {
    const mappedProps = toJoyrideV3Props(
      {
        run: true,
        steps,
        styles: {
          options: {
            arrowColor: '#1E2329',
          },
        },
      },
      true,
      normalizeJoyrideSteps(steps),
    );

    expect(mappedProps.options).toMatchObject({
      arrowColor: '#1E2329',
    });
    expect(Object.prototype.hasOwnProperty.call(mappedProps.options, 'primaryColor')).toBe(false);
  });
});
