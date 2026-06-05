'use client';

import { useLiaSidePanelChatHandlers } from './useLiaSidePanelLogic/chat-handlers';
import { useLiaSidePanelEffects } from './useLiaSidePanelLogic/effects';
import { useLiaSidePanelEnvironment } from './useLiaSidePanelLogic/environment';
import { useLiaSidePanelHistory } from './useLiaSidePanelLogic/history';
import { useLiaSidePanelQuickActions } from './useLiaSidePanelLogic/quick-actions';
import { useLiaSidePanelSpeech } from './useLiaSidePanelLogic/speech';
import { useLiaSidePanelState } from './useLiaSidePanelLogic/state';

export function useLiaSidePanelLogic() {
  const environment = useLiaSidePanelEnvironment();
  const state = useLiaSidePanelState();
  const speech = useLiaSidePanelSpeech({
    messages: environment.messages,
    isLoading: environment.isLoading,
    isOpen: environment.isOpen,
    language: environment.language,
    pageContext: environment.pageContext,
    currentConversationId: environment.currentConversationId,
    settings: environment.liaSettings,
    inputRef: state.inputRef,
    setInputValue: state.setInputValue,
  });
  const history = useLiaSidePanelHistory(
    environment.loadConversation,
    environment.clearHistory,
    environment.currentConversationId
  );
  const quickActions = useLiaSidePanelQuickActions(
    environment.t,
    environment.sendMessage
  );
  const chatHandlers = useLiaSidePanelChatHandlers({
    inputValue: state.inputValue,
    isLoading: environment.isLoading,
    pageContext: environment.pageContext,
    router: environment.router,
    closePanel: environment.closePanel,
    setInputValue: state.setInputValue,
    sendMessage: environment.sendMessage,
    isDictating: speech.isDictating,
    stopDictation: speech.stopDictation,
  });

  useLiaSidePanelEffects({
    isOpen: environment.isOpen,
    isOptionsMenuOpen: state.isOptionsMenuOpen,
    optionsMenuRef: state.optionsMenuRef,
    chatContainerRef: state.chatContainerRef,
    messagesEndRef: state.messagesEndRef,
    inputRef: state.inputRef,
    messages: environment.messages,
    tips: environment.tips,
    setIsOptionsMenuOpen: state.setIsOptionsMenuOpen,
    setCurrentTip: state.setCurrentTip,
  });

  return {
    ...environment,
    ...state,
    ...speech,
    ...history,
    ...quickActions,
    ...chatHandlers,
  };
}
