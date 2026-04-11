'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import { useResponsiveLiaLayout } from '@/core/hooks/useResponsiveLiaLayout';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { contentOffsetPx } = useResponsiveLiaLayout();

  const isCustomThemedRoute =
    pathname?.includes('/business-panel') || pathname?.includes('/business-user');
  const isAdminRoute = pathname?.startsWith('/admin');
  const bgClass = isCustomThemedRoute ? '' : 'bg-[var(--color-bg-dark)]';
  const contentStyle =
    !isAdminRoute && !isCustomThemedRoute && contentOffsetPx > 0
      ? ({ paddingRight: `${contentOffsetPx}px` } satisfies React.CSSProperties)
      : undefined;

  return (
    <div
      className={`${bgClass} min-h-full max-w-full overflow-x-clip transition-all duration-300 ease-in-out`}
      style={contentStyle}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
