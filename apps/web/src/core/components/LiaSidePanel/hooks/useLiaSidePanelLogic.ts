'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { HelpCircle, MessageSquare, Lightbulb, Sparkles } from 'lucide-react';
import { useLiaPanel } from '../../../contexts/LiaPanelContext';
import { useLiaGeneralChat } from '../../../hooks/useLiaGeneralChat';
import { useSofLIAPersonalization } from '../../../hooks/useSofLIAPersonalization';
import { useLanguage } from '../../../providers/I18nProvider';
import { useThemeStore } from '../../../../core/stores/themeStore';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '../../../../features/business-panel/contexts/OrganizationStylesContext';
import type { LiaConversationItem, LiaConversationToDelete, LiaQuickAction } from '../types';
import {
  deleteLiaConversation,
  fetchLiaConversationHistory,
  renameLiaConversation,
} from '../services/lia-side-panel-history.service';
import { getLiaThemeColors, isLiaDashboardRoute } from '../services/lia-side-panel-theme.service';
import { useLiaSidePanelVoice } from './useLiaSidePanelVoice';
import { useLiaSidePanelDictation } from './useLiaSidePanelDictation';

let liaPanelScrollTop = -1;

export function useLiaSidePanelLogic() {
  const { t } = useTranslation('common');
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  const isLightTheme = !isDarkMode;

  const orgContext = useOrganizationStylesContext();
  const orgStyles = orgContext?.styles;
  const effectiveStyles = isLiaDashboardRoute(pathname)
    ? orgStyles?.userDashboard || orgStyles?.panel
    : orgStyles?.panel;
  const themeColors = getLiaThemeColors(isLightTheme, effectiveStyles);

  const { messages, isLoading, sendMessage, clearHistory, loadConversation, currentConversationId } =
    useLiaGeneralChat();
  const { settings: liaSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = liaSettings?.voice_enabled ?? true;
  const isDictationEnabled = liaSettings?.dictation_enabled ?? false;
  const { language } = useLanguage();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { isSpeaking } = useLiaSidePanelVoice({
    messages,
    isLoading,
    isOpen,
    isVoiceEnabled,
    language,
    settings: liaSettings,
  });

  const {
    isDictating,
    isProcessingDictation,
    interimTranscript,
    finalTranscript,
    toggleDictation,
    stopDictation,
  } = useLiaSidePanelDictation({
    isOpen,
    isDictationEnabled,
    language,
    inputRef,
    setInputValue,
  });

  const [currentTip, setCurrentTip] = useState('');
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<LiaConversationItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<LiaConversationToDelete | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 20;
  const tips = (t('lia.tips', { returnObjects: true }) as string[]) || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };

    if (isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsMenuOpen]);

  const loadHistory = useCallback(
    async (page: number = 0) => {
      setIsHistoryLoading(true);

      try {
        const historyPage = await fetchLiaConversationHistory(page, limit);
        setHistoryList(historyPage.conversations);
        setTotalConversations(historyPage.totalConversations);
        setHasMore(historyPage.hasMore);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (showHistory) {
      loadHistory(currentPage);
    }
  }, [showHistory, currentPage, loadHistory]);

  useEffect(() => {
    if (isOpen && tips.length > 0) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
    }
  }, [isOpen, tips]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      if (liaPanelScrollTop !== -1) {
        container.scrollTop = liaPanelScrollTop;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = scrollBottom < 150;
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.role === 'user';

    if (isNearBottom || isUserMessage || liaPanelScrollTop === -1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !inputRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((previousPage) => previousPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((previousPage) => previousPage - 1);
    }
  };

  const closeHistory = useCallback(() => {
    setShowHistory(false);
    setCurrentPage(0);
  }, []);

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    closeHistory();
  };

  const handleStartEdit = (conversation: LiaConversationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingConversationId(conversation.conversation_id);
    setEditingTitle(
      conversation.conversation_title || new Date(conversation.started_at).toLocaleDateString()
    );
  };

  const handleSaveEdit = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!editingTitle.trim()) {
      return;
    }

    try {
      const wasSaved = await renameLiaConversation(conversationId, editingTitle);
      if (!wasSaved) {
        return;
      }

      setHistoryList((previousList) =>
        previousList.map((conversation) =>
          conversation.conversation_id === conversationId
            ? { ...conversation, conversation_title: editingTitle }
            : conversation
        )
      );
      setEditingConversationId(null);
    } catch (error) {
      console.error('Error saving title', error);
    }
  };

  const handleCancelEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingConversationId(null);
  };

  const handleDeleteClick = (conversation: LiaConversationItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversationToDelete({
      id: conversation.conversation_id,
      title: conversation.conversation_title || new Date(conversation.started_at).toLocaleDateString(),
    });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) {
      return;
    }

    setDeletingConversationId(conversationToDelete.id);
    setShowDeleteConfirm(false);

    try {
      const result = await deleteLiaConversation(conversationToDelete.id);
      if (!result.ok) {
        alert(`Error al eliminar conversacion: ${result.error || 'Error desconocido'}`);
        return;
      }

      setHistoryList((previousList) =>
        previousList.filter((conversation) => conversation.conversation_id !== conversationToDelete.id)
      );

      if (currentConversationId === conversationToDelete.id) {
        clearHistory();
      }
    } catch (error) {
      console.error('Error eliminando conversacion:', error);
      alert('Error al eliminar conversacion');
    } finally {
      setDeletingConversationId(null);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setConversationToDelete(null);
  };

  const handleLinkClick = useCallback(
    (url: string) => {
      if (url.startsWith('/')) {
        closePanel();
        router.push(url);
        return;
      }

      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [router, closePanel]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, false, pageContext);
  }, [inputValue, isLoading, sendMessage, pageContext]);

  const quickActions: LiaQuickAction[] = [
    {
      id: 'capabilities',
      label: t('lia.quickActions.capabilities'),
      icon: HelpCircle,
      prompt: t('lia.quickActions.capabilities'),
    },
    {
      id: 'courses',
      label: t('lia.quickActions.courses'),
      icon: MessageSquare,
      prompt: t('lia.quickActions.courses'),
    },
    {
      id: 'recommend',
      label: t('lia.quickActions.recommend'),
      icon: Lightbulb,
      prompt: t('lia.quickActions.recommend'),
    },
    {
      id: 'help',
      label: t('lia.quickActions.help'),
      icon: Sparkles,
      prompt: t('lia.quickActions.help'),
    },
  ];

  const handleQuickAction = useCallback(
    async (action: LiaQuickAction) => {
      await sendMessage(action.prompt);
    },
    [sendMessage]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isDictating) {
        stopDictation();
      }
      handleSendMessage();
    }
  };

  const handleChatScroll = (event: React.UIEvent<HTMLDivElement>) => {
    liaPanelScrollTop = event.currentTarget.scrollTop;
  };

  return {
    t,
    user,
    isOpen,
    closePanel,
    isDarkMode,
    isLightTheme,
    themeColors,
    messages,
    isLoading,
    clearHistory,
    currentConversationId,
    inputValue,
    setInputValue,
    inputRef,
    messagesEndRef,
    chatContainerRef,
    handleChatScroll,
    handleSendMessage,
    handleQuickAction,
    handleKeyDown,
    handleLinkClick,
    quickActions,
    currentTip,
    tips,
    isSpeaking,
    isVoiceEnabled,
    isDictationEnabled,
    isDictating,
    isProcessingDictation,
    interimTranscript,
    finalTranscript,
    toggleDictation,
    stopDictation,
    isOptionsMenuOpen,
    setIsOptionsMenuOpen,
    optionsMenuRef,
    isPersonalizationOpen,
    setIsPersonalizationOpen,
    isAvatarExpanded,
    setIsAvatarExpanded,
    showHistory,
    setShowHistory,
    closeHistory,
    historyList,
    isHistoryLoading,
    editingConversationId,
    editingTitle,
    setEditingTitle,
    deletingConversationId,
    showDeleteConfirm,
    conversationToDelete,
    currentPage,
    totalConversations,
    hasMore,
    handleNextPage,
    handlePrevPage,
    handleSelectConversation,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
