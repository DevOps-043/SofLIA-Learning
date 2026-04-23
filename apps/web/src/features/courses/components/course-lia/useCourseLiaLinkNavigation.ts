import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useCourseLiaLinkNavigation() {
  const router = useRouter();

  return useCallback(
    (url: string) => {
      if (url.startsWith('/')) {
        router.push(url);
      } else if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [router],
  );
}
