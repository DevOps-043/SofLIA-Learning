'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

import type { UseLiaCourseChatReturn } from '../../../core/hooks/useLiaCourseChat';
import type { CourseLessonContext } from '../../../core/types/lia.types';

interface LiaCourseContextType {
  isOpen: boolean;
  openLia: () => void;
  closeLia: () => void;
  toggleLia: () => void;
  // Contexto de actividad interactiva
  currentActivity: ActivityContextType | null;
  setActivity: (activity: ActivityContextType | null) => void;
  courseContext: CourseLessonContext | null;
  setCourseContext: (context: CourseLessonContext | null) => void;
  // Instancia compartida del chat (para invocar desde modales, etc.)
  liaChat: UseLiaCourseChatReturn | null;
  registerLiaChat: (chat: UseLiaCourseChatReturn | null) => void;
}

export interface ActivityContextType {
  id: string;
  title: string;
  type: string; // 'reflection', 'quiz', 'prompt', etc.
  description: string;
  prompts?: string[]; // Prompts sugeridos específicos de esta actividad
  isCompleted?: boolean;
  timestamp?: number;
}

const LiaCourseContext = createContext<LiaCourseContextType | undefined>(undefined);

export function LiaCourseProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLia = useCallback(() => setIsOpen(true), []);
  const closeLia = useCallback(() => setIsOpen(false), []);
  const toggleLia = useCallback(() => setIsOpen(prev => !prev), []);

  // Estado para la actividad actual
  const [currentActivity, setCurrentActivity] = useState<ActivityContextType | null>(null);
  const [courseContext, setCourseContext] = useState<CourseLessonContext | null>(null);
  
  // Estado para la instancia del chat
  const [liaChat, setLiaChat] = useState<UseLiaCourseChatReturn | null>(null);

  const setActivity = useCallback((activity: ActivityContextType | null) => {
    setCurrentActivity(activity);
  }, []);

  const registerLiaChat = useCallback((chat: UseLiaCourseChatReturn | null) => {
    setLiaChat(chat);
  }, []);

  return (
    <LiaCourseContext.Provider value={{ 
      isOpen, openLia, closeLia, toggleLia, 
      currentActivity, setActivity,
      courseContext, setCourseContext,
      liaChat, registerLiaChat 
    }}>
      {children}
    </LiaCourseContext.Provider>
  );
}

export function useLiaCourse() {
  const context = useContext(LiaCourseContext);
  if (!context) {
    throw new Error('useLiaCourse must be used within LiaCourseProvider');
  }
  return context;
}

// Ancho del panel de LIA
export const LIA_PANEL_WIDTH = 420;
