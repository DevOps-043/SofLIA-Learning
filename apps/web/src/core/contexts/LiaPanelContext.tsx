'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LiaPanelContextType {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  pageContext: Record<string, unknown> | null;
  setPageContext: (data: Record<string, unknown> | null) => void;
}

export const LiaPanelContext = createContext<LiaPanelContextType | undefined>(undefined);

export function LiaPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageContext, setPageContext] = useState<Record<string, unknown> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <LiaPanelContext.Provider value={{ isOpen, openPanel, closePanel, togglePanel, pageContext, setPageContext }}>
      {children}
    </LiaPanelContext.Provider>
  );
}

export function useLiaPanel() {
  const context = useContext(LiaPanelContext);
  if (context === undefined) {
    throw new Error('useLiaPanel must be used within a LiaPanelProvider');
  }
  return context;
}
