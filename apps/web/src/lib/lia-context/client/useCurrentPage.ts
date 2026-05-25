'use client';

import { useEffect, useState } from 'react';

export function useCurrentPage() {
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleRouteChange = () => setCurrentPage(window.location.pathname);
    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return currentPage;
}
