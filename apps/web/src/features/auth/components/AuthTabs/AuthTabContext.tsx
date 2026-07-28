'use client';

import React, { createContext, useContext, useState } from 'react';
import { AuthTab } from '../../types/auth.types';

interface AuthTabContextType {
  activeTab: AuthTab;
  setActiveTab: (tab: AuthTab) => void;
}

const AuthTabContext = createContext<AuthTabContextType | undefined>(undefined);

export function AuthTabProvider({ 
  children,
  initialTab 
}: { 
  children: React.ReactNode;
  initialTab?: AuthTab;
}) {
  // AuthTabs already resolves the URL once. Keeping a second search-param
  // subscription here caused a duplicate render before the form became usable.
  const [activeTab, setActiveTabState] = useState<AuthTab>(initialTab ?? 'login');

  const setActiveTab = (tab: AuthTab) => {
    setActiveTabState(tab);
    // Actualizar URL sin recargar usando window.history
    const newUrl = tab === 'register' ? '/auth?tab=register' : '/auth';
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };

  return (
    <AuthTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AuthTabContext.Provider>
  );
}

export function useAuthTab() {
  const context = useContext(AuthTabContext);
  if (context === undefined) {
    throw new Error('useAuthTab must be used within an AuthTabProvider');
  }
  return context;
}
