import { useCallback } from 'react';
import type React from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { setLiaPanelScrollTop } from './effects';

interface UseLiaSidePanelChatHandlersParams {
  inputValue: string;
  isLoading: boolean;
  pageContext: Record<string, unknown> | null;
  router: AppRouterInstance;
  closePanel: () => void;
  setInputValue: (value: string) => void;
  sendMessage: (
    message: string,
    isSystemMessage?: boolean,
    pageContext?: Record<string, unknown>
  ) => Promise<void>;
  isDictating: boolean;
  stopDictation: () => void;
}

export function useLiaSidePanelChatHandlers({
  inputValue,
  isLoading,
  pageContext,
  router,
  closePanel,
  setInputValue,
  sendMessage,
  isDictating,
  stopDictation,
}: UseLiaSidePanelChatHandlersParams) {
  const handleLinkClick = useCallback((url: string) => {
    if (url.startsWith('/')) {
      closePanel();
      router.push(url);
      return;
    }
    if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
  }, [closePanel, router]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, false, pageContext ?? undefined);
  }, [inputValue, isLoading, pageContext, sendMessage, setInputValue]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (isDictating) stopDictation();
    handleSendMessage();
  };

  const handleChatScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setLiaPanelScrollTop(event.currentTarget.scrollTop);
  };

  return { handleLinkClick, handleSendMessage, handleKeyDown, handleChatScroll };
}
