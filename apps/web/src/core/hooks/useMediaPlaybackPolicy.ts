'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type MediaPlaybackContext,
  type MediaPlaybackEnvironment,
  getBrowserMediaPlaybackEnvironment,
  resolveMediaPlaybackPolicy,
} from '@/lib/media';

function readEnvironment(): MediaPlaybackEnvironment {
  if (typeof window === 'undefined') {
    return {};
  }

  return getBrowserMediaPlaybackEnvironment();
}

export function useMediaPlaybackPolicy(context: MediaPlaybackContext) {
  const [environment, setEnvironment] =
    useState<MediaPlaybackEnvironment>(readEnvironment);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateEnvironment = () => {
      setEnvironment(readEnvironment());
    };

    updateEnvironment();

    const reducedMotionQuery = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    );
    const connection = (
      navigator as Navigator & {
        connection?: {
          addEventListener?: (event: 'change', listener: () => void) => void;
          removeEventListener?: (event: 'change', listener: () => void) => void;
        };
      }
    ).connection;

    window.addEventListener('resize', updateEnvironment);
    reducedMotionQuery?.addEventListener?.('change', updateEnvironment);
    connection?.addEventListener?.('change', updateEnvironment);

    return () => {
      window.removeEventListener('resize', updateEnvironment);
      reducedMotionQuery?.removeEventListener?.('change', updateEnvironment);
      connection?.removeEventListener?.('change', updateEnvironment);
    };
  }, []);

  return useMemo(
    () => resolveMediaPlaybackPolicy(environment, context),
    [context, environment]
  );
}
