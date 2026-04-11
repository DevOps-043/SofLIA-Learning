'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { LIA_PANEL_WIDTH } from '@/core/hooks/useResponsiveLiaLayout';

import { LiaSidePanelContent } from './LiaSidePanelContent';

export { LIA_PANEL_WIDTH };

export function LiaSidePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaSidePanelContent />, document.body);
}
