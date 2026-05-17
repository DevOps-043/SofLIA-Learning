import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { NormalizedLiaLink } from '../lia-link.utils';

export function useCourseLiaNavigationAction(router: AppRouterInstance) {
  return useCallback((link: NormalizedLiaLink) => {
    if (link.kind === 'internal') {
      router.push(link.url);
      return;
    }

    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [router]);
}
