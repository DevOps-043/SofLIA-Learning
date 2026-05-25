import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { ReactGridLayoutModule, ResponsiveLayoutComponent } from './types';

let ResponsiveLayoutWithWidth: ResponsiveLayoutComponent | null = null;

export function getResponsiveLayoutWithWidth() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (ResponsiveLayoutWithWidth) {
    return ResponsiveLayoutWithWidth;
  }

  try {
    const ReactGridLayout = require('react-grid-layout') as ReactGridLayoutModule;
    const ResponsiveGridLayout = ReactGridLayout.Responsive || ReactGridLayout.default;

    if (ResponsiveGridLayout && ReactGridLayout.WidthProvider) {
      ResponsiveLayoutWithWidth = ReactGridLayout.WidthProvider(ResponsiveGridLayout);
    }
  } catch (error) {
    techDebtLogger.error('Error loading react-grid-layout:', error);
  }

  return ResponsiveLayoutWithWidth;
}
