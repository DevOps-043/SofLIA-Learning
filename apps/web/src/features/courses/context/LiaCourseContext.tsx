'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  // API compartida del chat para invocar desde modales y actividades sin
  // propagar todo el estado del hook a traves del contexto.
  liaChat: Pick<
    UseLiaCourseChatReturn,
    'sendMessage' | 'stop' | 'clearHistory' | 'loadConversation'
  > | null;
  isLiaChatLoading: boolean;
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
  const [isLiaChatLoading, setIsLiaChatLoading] = useState(false);
  const liaChatRef = useRef<LiaCourseContextType['liaChat']>(null);

  const setActivity = useCallback((activity: ActivityContextType | null) => {
    setCurrentActivity(activity);
  }, []);

  const registerLiaChat = useCallback((chat: UseLiaCourseChatReturn | null) => {
    liaChatRef.current = chat
      ? {
          sendMessage: chat.sendMessage,
          stop: chat.stop,
          clearHistory: chat.clearHistory,
          loadConversation: chat.loadConversation,
        }
      : null;

    setIsLiaChatLoading((previous) => {
      const nextValue = chat?.isLoading ?? false;
      return previous === nextValue ? previous : nextValue;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      isOpen,
      openLia,
      closeLia,
      toggleLia,
      currentActivity,
      setActivity,
      courseContext,
      setCourseContext,
      liaChat: liaChatRef.current,
      isLiaChatLoading,
      registerLiaChat,
    }),
    [
      closeLia,
      courseContext,
      currentActivity,
      isLiaChatLoading,
      isOpen,
      openLia,
      registerLiaChat,
      setActivity,
      toggleLia,
    ],
  );

  return (
    <LiaCourseContext.Provider value={contextValue}>
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
