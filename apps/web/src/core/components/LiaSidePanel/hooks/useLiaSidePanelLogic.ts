'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLiaPanel } from '../../../contexts/LiaPanelContext';
import { useLiaGeneralChat } from '../../../hooks/useLiaGeneralChat';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '../../../../features/business-panel/contexts/OrganizationStylesContext';
import { useThemeStore } from '../../../../core/stores/themeStore';
import { useTranslation } from 'react-i18next';
import { useSofLIAPersonalization } from '../../../hooks/useSofLIAPersonalization';
import { useLanguage } from '../../../providers/I18nProvider';
import { HelpCircle, MessageSquare, Lightbulb, Sparkles } from 'lucide-react';
import React from 'react';

// Variable global para persistir el scroll
let liaPanelScrollTop = -1;

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

export function useLiaSidePanelLogic() {
  const { t } = useTranslation('common');
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Theme
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';

  // Organization styles
  const orgContext = useOrganizationStylesContext();
  const orgStyles = orgContext?.styles;

  // Determine route context
  const isUserDashboard =
    pathname?.includes('/business-user') ||
    pathname?.includes('/study-planner') ||
    pathname === '/dashboard';

  const effectiveStyles = isUserDashboard
    ? orgStyles?.userDashboard || orgStyles?.panel
    : orgStyles?.panel;

  const isLightTheme = !isDarkMode;

  // Dynamic theme colors
  const themeColors = {
    panelBg: isLightTheme ? '#FFFFFF' : effectiveStyles?.sidebar_background || '#0a0f14',
    headerBg: isLightTheme ? '#F8FAFC' : effectiveStyles?.sidebar_background || '#0a0f14',
    borderColor: isLightTheme ? '#E2E8F0' : effectiveStyles?.border_color || '#1e2a35',
    messageBubbleAssistant: isLightTheme ? '#F1F5F9' : effectiveStyles?.card_background || '#1e2a35',
    messageBubbleUser: effectiveStyles?.primary_button_color || '#0A2540',
    textPrimary: isLightTheme ? '#1E293B' : effectiveStyles?.text_color || '#e5e7eb',
    textSecondary: isLightTheme ? '#64748B' : '#6b7280',
    inputBg: isLightTheme ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
    inputBorder: isLightTheme ? '#CBD5E1' : effectiveStyles?.border_color || '#374151',
    accentColor: '#00D4B3',
  };

  const { messages, isLoading, sendMessage, clearHistory, loadConversation, currentConversationId } =
    useLiaGeneralChat();

  // SofLIA personalization / voice
  const { settings: liaSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = liaSettings?.voice_enabled ?? true;
  const isDictationEnabled = liaSettings?.dictation_enabled ?? false;
  const { language } = useLanguage();

  // Speech synthesis refs / state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);

  const speechLanguageMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
  };

  // Input / scroll refs
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dictation state / refs
  const [isDictating, setIsDictating] = useState(false);
  const [isProcessingDictation, setIsProcessingDictation] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isDictatingRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptTimeRef = useRef<number>(0);
  const dictationTextToApplyRef = useRef<string>('');

  // UI state
  const [currentTip, setCurrentTip] = useState('');
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; title: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Close options menu on outside click
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

  // Load history when panel opens
  useEffect(() => {
    if (showHistory) {
      loadHistory(currentPage);
    }
  }, [showHistory, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Random tip on open
  const tips = (t('lia.tips', { returnObjects: true }) as string[]) || [];
  useEffect(() => {
    if (isOpen && tips.length > 0) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
    }
  }, [isOpen, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position when panel opens
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !isOpen) return;
    const timer = setTimeout(() => {
      if (liaPanelScrollTop !== -1) {
        container.scrollTop = liaPanelScrollTop;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = scrollBottom < 150;
    const lastMsg = messages[messages.length - 1];
    const isUserMsg = lastMsg?.role === 'user';
    if (isNearBottom || isUserMsg || liaPanelScrollTop === -1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // ─── TTS helpers ────────────────────────────────────────────────────────────

  const cleanTextForTTS = useCallback((text: string): string => {
    if (!text) return text;
    let cleaned = text;
    cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
    cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
    cleaned = cleaned.replace(/^>\s+/gm, '');
    cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.trim();
    return cleaned;
  }, []);

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch (e) { /* ignore */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsSpeaking(false);
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!isVoiceEnabled || typeof window === 'undefined') return;
      const cleanedText = cleanTextForTTS(text);
      if (!cleanedText || cleanedText.trim().length === 0) return;
      stopAllAudio();

      try {
        setIsSpeaking(true);
        const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
        const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
        const modelId = 'eleven_turbo_v2_5';

        if (!apiKey || !voiceId) {
          console.warn('⚠️ ElevenLabs credentials not found, using fallback Web Speech API');
          const utterance = new SpeechSynthesisUtterance(cleanedText);
          utterance.lang = speechLanguageMap[language] || 'es-ES';
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
          utterance.onerror = () => { setIsSpeaking(false); utteranceRef.current = null; };
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          return;
        }

        const controller = new AbortController();
        ttsAbortRef.current = controller;

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          signal: controller.signal,
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: cleanedText,
            model_id: modelId,
            voice_settings: { stability: 0.4, similarity_boost: 0.65, style: 0.3, use_speaker_boost: false },
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32',
          }),
        });

        if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);

        const audioBlob = await response.blob();
        if (ttsAbortRef.current && ttsAbortRef.current.signal.aborted) {
          ttsAbortRef.current = null;
          return;
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = 0.8;
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          if (audioRef.current === audio) audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          if (audioRef.current === audio) audioRef.current = null;
        };

        try {
          await audio.play();
          if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
        } catch (playError: any) {
          console.warn('⚠️ [TTS] Error al reproducir audio (puede ser bloqueo de autoplay):', playError);
          setIsSpeaking(false);
        }
      } catch (error: any) {
        if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
          // silenced
        } else {
          console.error('Error en síntesis de voz con ElevenLabs:', error);
        }
        setIsSpeaking(false);
      }
    },
    [isVoiceEnabled, language, stopAllAudio, cleanTextForTTS] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Auto-read new assistant messages
  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0 || isLoading) return;
    const lastAssistantMessage = [...messages].reverse().find(
      (msg) => msg.role === 'assistant' && msg.id !== lastReadMessageIdRef.current && msg.content.trim().length > 0
    );
    if (lastAssistantMessage) {
      const timer = setTimeout(() => {
        speakText(lastAssistantMessage.content);
        lastReadMessageIdRef.current = lastAssistantMessage.id;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, isVoiceEnabled, isLoading, speakText]);

  // Stop audio when panel closes
  useEffect(() => {
    if (!isOpen) stopAllAudio();
    return () => { stopAllAudio(); };
  }, [isOpen, stopAllAudio]);

  // ─── Dictation ──────────────────────────────────────────────────────────────

  const stopDictation = useCallback(() => {
    setFinalTranscript((currentFinal) => {
      setInterimTranscript((currentInterim) => {
        const fullText = (currentFinal + ' ' + currentInterim).trim();
        dictationTextToApplyRef.current = fullText;
        return '';
      });
      return '';
    });

    setIsDictating(false);
    isDictatingRef.current = false;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }

    const textToApply = dictationTextToApplyRef.current;
    if (textToApply) {
      setTimeout(() => {
        setInputValue((prev) => prev + (prev ? ' ' : '') + textToApply);
        dictationTextToApplyRef.current = '';
        setTimeout(() => {
          inputRef.current?.focus();
          if (inputRef.current) {
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
          }
        }, 50);
      }, 0);
    } else {
      dictationTextToApplyRef.current = '';
    }

    lastTranscriptTimeRef.current = 0;
  }, []);

  const applyTranscribedText = useCallback(() => {
    const fullText = (finalTranscript + ' ' + interimTranscript).trim();
    if (fullText) {
      setInputValue((prev) => prev + (prev ? ' ' : '') + fullText);
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
      }, 100);
    }
    setInterimTranscript('');
    setFinalTranscript('');
  }, [finalTranscript, interimTranscript]);

  const toggleDictation = useCallback(async () => {
    if (!isDictationEnabled) {
      console.warn('Dictado no está habilitado en la configuración');
      return;
    }
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.');
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      stopDictation();
      return;
    }

    try {
      setInterimTranscript('');
      setFinalTranscript('');

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const langMap: Record<string, string> = { es: 'es-ES', en: 'en-US', pt: 'pt-BR' };
      recognition.lang = langMap[language || 'es'] || 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const SILENCE_TIMEOUT_MS = 3000;

      const resetSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
          }
          stopDictation();
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        let hasNewText = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
            hasNewText = true;
          } else {
            interim += transcript;
            hasNewText = true;
          }
        }

        if (hasNewText) {
          lastTranscriptTimeRef.current = Date.now();
          resetSilenceTimeout();
        }

        if (final) {
          setFinalTranscript((prev) => (prev + ' ' + final).trim());
        }
        setInterimTranscript(interim);
      };

      recognition.onend = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        stopDictation();
      };

      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        if (event.error === 'no-speech') {
          stopDictation();
        } else if (event.error === 'audio-capture') {
          alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
          stopDictation();
        } else if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
          stopDictation();
        } else {
          console.warn('Error de reconocimiento:', event.error);
          if (event.error === 'network' || event.error === 'aborted') {
            stopDictation();
          }
        }
      };

      recognition.onstart = () => {
        setIsDictating(true);
        isDictatingRef.current = true;
        lastTranscriptTimeRef.current = Date.now();
        resetSilenceTimeout();
      };

      recognition.start();
    } catch (error: any) {
      console.error('Error iniciando dictado:', error);
      setIsDictating(false);
      if (error?.name === 'NotAllowedError' || error?.message?.includes('not allowed')) {
        alert('Se necesita permiso para usar el micrófono. Por favor, permite el acceso al micrófono en la configuración del navegador.');
      } else if (error?.message?.includes('already started')) {
        setIsDictating(true);
        isDictatingRef.current = true;
      } else {
        alert('Error al acceder al micrófono. Por favor, verifica que tu navegador soporte reconocimiento de voz.');
      }
    }
  }, [isDictationEnabled, isDictating, language, stopDictation, applyTranscribedText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop dictation when panel closes
  useEffect(() => {
    if (!isOpen) stopDictation();
    return () => { stopDictation(); };
  }, [isOpen, stopDictation]);

  // ─── History handlers ────────────────────────────────────────────────────────

  const loadHistory = useCallback(
    async (page: number = 0) => {
      setIsHistoryLoading(true);
      try {
        const offset = page * limit;
        const response = await fetch(`/api/lia/conversations?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        if (data.conversations) {
          setHistoryList(data.conversations);
          if (data.pagination) {
            setTotalConversations(data.pagination.total || 0);
            setHasMore(data.pagination.hasMore || false);
          } else {
            setTotalConversations(data.conversations.length);
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [limit]
  );

  const handleNextPage = () => {
    if (hasMore) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  const closeHistory = useCallback(() => {
    setShowHistory(false);
    setCurrentPage(0);
  }, []);

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    closeHistory();
  };

  const handleStartEdit = (conv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conv.conversation_id);
    setEditingTitle(conv.conversation_title || new Date(conv.started_at).toLocaleDateString());
  };

  const handleSaveEdit = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      const response = await fetch('/api/lia/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, title: editingTitle }),
      });
      if (response.ok) {
        setHistoryList((prev) =>
          prev.map((c) => (c.conversation_id === convId ? { ...c, conversation_title: editingTitle } : c))
        );
        setEditingConversationId(null);
      }
    } catch (err) {
      console.error('Error saving title', err);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
  };

  const handleDeleteClick = (conv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete({
      id: conv.conversation_id,
      title: conv.conversation_title || new Date(conv.started_at).toLocaleDateString(),
    });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setDeletingConversationId(conversationToDelete.id);
    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`/api/lia/conversations/${conversationToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setHistoryList((prev) => prev.filter((c) => c.conversation_id !== conversationToDelete.id));
        if (currentConversationId === conversationToDelete.id) clearHistory();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        alert('Error al eliminar conversación: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (err) {
      console.error('Error eliminando conversación:', err);
      alert('Error al eliminar conversación');
    } finally {
      setDeletingConversationId(null);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setConversationToDelete(null);
  };

  // ─── Chat handlers ───────────────────────────────────────────────────────────

  const handleLinkClick = useCallback(
    (url: string) => {
      if (url.startsWith('/')) {
        closePanel();
        router.push(url);
      } else if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [router, closePanel]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, false, pageContext);
  }, [inputValue, isLoading, sendMessage, pageContext]);

  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      await sendMessage(action.prompt);
    },
    [sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isDictating) stopDictation();
      handleSendMessage();
    }
  };

  // ─── Quick actions ───────────────────────────────────────────────────────────

  const quickActions: QuickAction[] = [
    { id: 'capabilities', label: t('lia.quickActions.capabilities'), icon: HelpCircle, prompt: t('lia.quickActions.capabilities') },
    { id: 'courses', label: t('lia.quickActions.courses'), icon: MessageSquare, prompt: t('lia.quickActions.courses') },
    { id: 'recommend', label: t('lia.quickActions.recommend'), icon: Lightbulb, prompt: t('lia.quickActions.recommend') },
    { id: 'help', label: t('lia.quickActions.help'), icon: Sparkles, prompt: t('lia.quickActions.help') },
  ];

  // ─── Scroll persistence ──────────────────────────────────────────────────────

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    liaPanelScrollTop = e.currentTarget.scrollTop;
  };

  return {
    // context / auth
    t,
    user,
    isOpen,
    closePanel,

    // theme
    isDarkMode,
    isLightTheme,
    themeColors,

    // chat
    messages,
    isLoading,
    clearHistory,
    currentConversationId,

    // input
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

    // tips
    currentTip,
    tips,

    // voice / TTS
    isSpeaking,
    isVoiceEnabled,

    // dictation
    isDictationEnabled,
    isDictating,
    isProcessingDictation,
    interimTranscript,
    finalTranscript,
    toggleDictation,
    stopDictation,

    // options menu
    isOptionsMenuOpen,
    setIsOptionsMenuOpen,
    optionsMenuRef,

    // personalization
    isPersonalizationOpen,
    setIsPersonalizationOpen,

    // avatar
    isAvatarExpanded,
    setIsAvatarExpanded,

    // history
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
