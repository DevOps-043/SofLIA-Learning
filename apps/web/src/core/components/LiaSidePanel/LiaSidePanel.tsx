'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LiaSidePanelContent } from './LiaSidePanelContent';

const PANEL_WIDTH = 420;

// Exportar constante para uso en ContentWrapper
export const LIA_PANEL_WIDTH = PANEL_WIDTH;

export function LiaSidePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaSidePanelContent />, document.body);
}
