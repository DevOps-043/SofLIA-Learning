'use client';

import { useEffect, useCallback } from 'react';
import { MAX_CONTEXT_MESSAGES } from '../types';
import type { Message } from '../types';

const STORAGE_KEY_CONTEXT_MODE = 'lia-context-mode-enabled';
const STORAGE_KEY_CONTEXT_MESSAGES = 'lia-context-mode-messages';

interface UseAIChatPersistenceParams {
  useContextMode: boolean
  isPromptMode: boolean
  isOpen: boolean
  normalMessages: Message[]
  setUseContextMode: (v: boolean) => void
  setNormalMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
}

export function useAIChatPersistence({
  useContextMode, isPromptMode, isOpen, normalMessages, setUseContextMode, setNormalMessages,
}: UseAIChatPersistenceParams) {
  const saveContextMessages = useCallback((messagesToSave: Message[]) => {
    try {
      const recentMessages = messagesToSave.slice(-MAX_CONTEXT_MESSAGES);
      const serialized = JSON.stringify(recentMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })));
      localStorage.setItem(STORAGE_KEY_CONTEXT_MESSAGES, serialized);
    } catch (error) {
      console.error('Error guardando mensajes en localStorage:', error);
    }
  }, []);

  const loadContextMessages = useCallback((): Message[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTEXT_MESSAGES);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((msg: Record<string, unknown>) => ({ ...msg, timestamp: new Date(msg.timestamp as string) }));
    } catch (error) {
      console.error('Error cargando mensajes desde localStorage:', error);
      return [];
    }
  }, []);

  const clearContextMessages = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES);
      setNormalMessages([]);
    } catch (error) {
      console.error('Error limpiando mensajes de contexto:', error);
    }
  }, [setNormalMessages]);

  // Initial load
  useEffect(() => {
    try {
      const savedContextMode = localStorage.getItem(STORAGE_KEY_CONTEXT_MODE);
      const contextModeEnabled = savedContextMode === 'true';
      const savedMessages = loadContextMessages();
      if (savedMessages.length > 0 || contextModeEnabled) {
        setUseContextMode(true);
        if (savedMessages.length > 0) setNormalMessages(savedMessages);
        localStorage.setItem(STORAGE_KEY_CONTEXT_MODE, 'true');
      }
    } catch (error) {
      console.error('Error cargando estado de contexto desde localStorage:', error);
    }
  }, [loadContextMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist mode flag
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTEXT_MODE, useContextMode.toString());
      if (!useContextMode) {
        localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES);
        if (!isOpen) setNormalMessages([]);
      }
    } catch (error) {
      console.error('Error guardando estado de contexto en localStorage:', error);
    }
  }, [useContextMode, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on normalMessages change
  useEffect(() => {
    if (useContextMode && !isPromptMode && normalMessages.length > 0) {
      saveContextMessages(normalMessages);
    }
  }, [normalMessages, useContextMode, isPromptMode, saveContextMessages]);

  // Save on page unload / visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useContextMode && !isPromptMode && normalMessages.length > 0) saveContextMessages(normalMessages);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && useContextMode && !isPromptMode && normalMessages.length > 0) saveContextMessages(normalMessages);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        const recentMessages = normalMessages.slice(-MAX_CONTEXT_MESSAGES);
        try {
          const serialized = JSON.stringify(recentMessages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })));
          localStorage.setItem(STORAGE_KEY_CONTEXT_MESSAGES, serialized);
        } catch { }
      }
    };
  }, [useContextMode, isPromptMode, normalMessages, saveContextMessages]);

  return { saveContextMessages, clearContextMessages };
}
