'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../providers/I18nProvider';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { useThemeStore } from '../../../stores/themeStore';
import { getPlatformContext } from '../../../../lib/lia/page-metadata';
import { IntentDetectionService } from '../../../services/intent-detection.service';
import { sessionRecorder } from '../../../../lib/rrweb/session-recorder';
import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../../lib/nanobana/templates';
import type { PromptDraft } from '../PromptPreviewPanel';
import {
  Message,
  GeneratedPrompt,
  AIChatAgentProps,
  LiaMode,
  MAX_CONTEXT_MESSAGES,
} from '../types';
import {
  detectContextFromURL,
  getPageContextInfo,
  extractPageContent,
} from '../AIChatAgent.utils';
import { useAIChatDrag } from './useAIChatDrag';
import { useAIChatVoice } from './useAIChatVoice';

const STORAGE_KEY_CONTEXT_MODE = 'lia-context-mode-enabled';
const STORAGE_KEY_CONTEXT_MESSAGES = 'lia-context-mode-messages';

export function useAIChatAgentLogic({
  assistantName = 'SofLIA',
  context = 'general',
  initialMessage,
  promptPlaceholder,
}: AIChatAgentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { t: tCommon } = useTranslation('common');
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuth();

  // ── Translated strings ──────────────────────────────────────────────────────
  const translatedInitialMessage = initialMessage ?? tCommon('aiChat.initialMessage');
  const responseFallback = tCommon('aiChat.responseFallback');
  const errorGeneric = tCommon('aiChat.errorGeneric');
  const helpPrompt = tCommon('aiChat.helpPrompt');
  const helpFallback = tCommon('aiChat.helpFallback');
  const helpError = tCommon('aiChat.helpError');
  const clearConversationLabel = tCommon('aiChat.clearConversation');
  const changeModeLabel = tCommon('aiChat.changeMode');
  const clearContextLabel = tCommon('aiChat.clearContext');
  const clearContextConfirmLabel = tCommon('aiChat.clearContextConfirm');
  const reportProblemLabel = tCommon('aiChat.reportProblem');
  const promptModeTitle = tCommon('aiChat.promptMode.title');
  const promptModeDesc = tCommon('aiChat.promptMode.description');
  const promptModeEmptyDesc = tCommon('aiChat.promptMode.emptyDescription');
  const nanobanaTitle = tCommon('aiChat.nanobanaMode.title');
  const nanobanaDesc = tCommon('aiChat.nanobanaMode.description');
  const nanobanaEmptyDesc = tCommon('aiChat.nanobanaMode.emptyDescription');
  const nanobanaWelcome = tCommon('aiChat.nanobanaMode.welcome');
  const contextModeTitle = tCommon('aiChat.contextMode.title');
  const contextModeDesc = tCommon('aiChat.contextMode.description', { count: MAX_CONTEXT_MESSAGES });
  const contextModeEmptyDesc = tCommon('aiChat.contextMode.emptyDescription', { count: MAX_CONTEXT_MESSAGES });
  const assistantModeTitle = tCommon('aiChat.assistantMode.title');
  const assistantModeEmptyDesc = tCommon('aiChat.assistantMode.emptyDescription');
  const voiceListening = tCommon('aiChat.voice.listening');
  const voiceProcessing = tCommon('aiChat.voice.processing');
  const onlineLabel = tCommon('aiChat.online');
  const pressEnterLabel = tCommon('aiChat.pressEnter');
  const clickToSendLabel = tCommon('aiChat.clickToSend');
  const clickToDictateLabel = tCommon('aiChat.clickToDictate');

  // ── Mode state ───────────────────────────────────────────────────────────────
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isNanoBananaMode, setIsNanoBananaMode] = useState(false);
  const [useContextMode, setUseContextMode] = useState(true);

  // ── Open/minimize ────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [areButtonsExpanded, setAreButtonsExpanded] = useState(false);

  // ── Prompt mode state ────────────────────────────────────────────────────────
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
  const [selectedPromptMessageId, setSelectedPromptMessageId] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // ── NanoBanana state ─────────────────────────────────────────────────────────
  const [nanoBananaSchema, setNanoBananaSchema] = useState<NanoBananaSchema | null>(null);
  const [nanoBananaJsonString, setNanoBananaJsonString] = useState<string>('');
  const [nanoBananaDomain, setNanoBananaDomain] = useState<NanoBananaDomain>('ui');
  const [nanoBananaFormat, setNanoBananaFormat] = useState<OutputFormat>('wireframe');
  const [isNanoBananaPanelOpen, setIsNanoBananaPanelOpen] = useState(false);
  const [nanoBananaMessages, setNanoBananaMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ── Menus ────────────────────────────────────────────────────────────────────
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // ── Messages ─────────────────────────────────────────────────────────────────
  const [normalMessages, setNormalMessages] = useState<Message[]>([]);
  const [promptMessages, setPromptMessages] = useState<Message[]>([]);

  const messages = isNanoBananaMode ? nanoBananaMessages : isPromptMode ? promptMessages : normalMessages;

  // ── Input ────────────────────────────────────────────────────────────────────
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Page context ─────────────────────────────────────────────────────────────
  const [pageContent, setPageContent] = useState<{
    title: string; metaDescription: string; headings: string[]; mainText: string;
  } | null>(null);
  const [availableLinks, setAvailableLinks] = useState<string>('');

  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;
  const pageContextInfo = getPageContextInfo(pathname);
  const isCommunitiesPage = pathname?.includes('/communities');

  const prevPathnameRef = useRef<string>('');
  const hasOpenedRef = useRef<boolean>(false);

  // ── Sub-hooks ────────────────────────────────────────────────────────────────
  const drag = useAIChatDrag(isOpen, isMinimized);

  const voice = useAIChatVoice(language, tCommon);

  const placeholderText = isPromptMode
    ? tCommon('aiChat.promptMode.placeholder')
    : (promptPlaceholder ?? tCommon('aiChat.placeholder'));

  // ── Layout ───────────────────────────────────────────────────────────────────
  const [isDesktop, setIsDesktop] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState<string | null>(null);
  const [windowHeight, setWindowHeight] = useState(600);

  const hasDashboardNavbar = useMemo(() => {
    if (!pathname) return false;
    const dashboardPrefixes = [
      '/dashboard', '/my-courses', '/courses', '/prompt-directory', '/apps-directory',
      '/communities', '/news', '/statistics', '/questionnaire', '/account-settings', '/certificates',
    ];
    return dashboardPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  const bottomPosition = isCommunitiesPage && !isDesktop
    ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(1.5rem + env(safe-area-inset-bottom, 0px))';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === 'undefined') return;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const topGap = hasDashboardNavbar ? (!isDesktop ? 78 : 72) + 8 : 24;
      const bottomGap = isCommunitiesPage && !isDesktop ? 88 : 24;
      const computed = Math.max(viewportHeight - topGap - bottomGap, 360);
      setWidgetHeight(`${computed}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const promptModalHeight = useMemo(() => {
    if (!isPromptMode || !generatedPrompt || !isPromptPanelOpen) return 0;
    return isDesktop ? 450 : 380;
  }, [isPromptMode, generatedPrompt, isPromptPanelOpen, isDesktop]);

  const calculateMaxHeight = useMemo(() => {
    if (widgetHeight) return widgetHeight;
    if (isCommunitiesPage && !isDesktop) return 'calc(100vh - 5.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
    if (hasDashboardNavbar) {
      const navbarHeight = !isDesktop ? '4.875rem' : '4.5rem';
      return `calc(100vh - ${navbarHeight} - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)`;
    }
    return 'calc(100vh - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop, widgetHeight]);

  const chatHeightValue = useMemo(() => {
    if (widgetHeight) return parseFloat(widgetHeight.replace('px', ''));
    if (isCommunitiesPage && !isDesktop) return windowHeight - 88 - 24;
    if (hasDashboardNavbar) {
      const navbarHeight = !isDesktop ? 78 : 72;
      return windowHeight - navbarHeight - 24;
    }
    return windowHeight - 24;
  }, [widgetHeight, windowHeight, isCommunitiesPage, isDesktop, hasDashboardNavbar]);

  const chatBottomPosition = bottomPosition;

  const promptBottomPosition = useMemo(() => {
    if (isPromptMode && generatedPrompt && isPromptPanelOpen && isOpen) return chatBottomPosition;
    return bottomPosition;
  }, [chatBottomPosition, isPromptMode, generatedPrompt, isPromptPanelOpen, isOpen, bottomPosition]);

  // ── Mode theme ───────────────────────────────────────────────────────────────
  const currentMode: LiaMode = isNanoBananaMode ? 'nanobana' : useContextMode ? 'analysis' : (isPromptMode ? 'prompt' : 'normal');

  const theme = useMemo(() => {
    switch (currentMode) {
      case 'nanobana':
        return {
          header: 'bg-[#0A2540]', accent: 'amber', bubbleUser: 'from-[#0A2540] to-[#00D4B3]',
          ring: 'focus:ring-amber-500', borderUser: 'border-[#00D4B3]',
          chipBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          chipActive: 'bg-amber-500 text-white border-transparent',
        };
      case 'prompt':
        return {
          header: 'bg-[#0A2540]', accent: 'purple', bubbleUser: 'from-[#0A2540] to-[#00D4B3]',
          ring: 'focus:ring-purple-500', borderUser: 'border-[#00D4B3]',
          chipBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
          chipActive: 'bg-purple-500 text-white border-transparent',
        };
      case 'analysis':
        return {
          header: 'bg-[#0A2540]', accent: '[#00D4B3]', bubbleUser: 'from-[#0A2540] to-[#00D4B3]',
          ring: 'focus:ring-[#00D4B3]', borderUser: 'border-[#00D4B3]',
          chipBg: 'bg-[#00D4B3]/15 text-[#00D4B3] border border-[#00D4B3]/30',
          chipActive: 'bg-[#00D4B3] text-white border-transparent',
        };
      default:
        return {
          header: 'bg-[#0A2540]', accent: '[#00D4B3]', bubbleUser: 'from-[#0A2540] to-[#00D4B3]',
          ring: 'focus:ring-[#00D4B3]', borderUser: 'border-[#00D4B3]',
          chipBg: 'bg-[#00D4B3]/15 text-[#00D4B3] border border-[#00D4B3]/30',
          chipActive: 'bg-[#00D4B3] text-white border-transparent',
        };
    }
  }, [currentMode]);

  // ── Persistence helpers ──────────────────────────────────────────────────────
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
      return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
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
  }, []);

  // ── Persistence effects ──────────────────────────────────────────────────────
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
  }, [loadContextMessages]);

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
  }, [useContextMode, isOpen]);

  useEffect(() => {
    if (useContextMode && !isPromptMode && normalMessages.length > 0) {
      saveContextMessages(normalMessages);
    }
  }, [normalMessages, useContextMode, isPromptMode, saveContextMessages]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        const recentMessages = normalMessages.slice(-MAX_CONTEXT_MESSAGES);
        try {
          const serialized = JSON.stringify(recentMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })));
          localStorage.setItem(STORAGE_KEY_CONTEXT_MESSAGES, serialized);
        } catch (error) {
          console.error('Error guardando al desmontar:', error);
        }
      }
    };
  }, [useContextMode, isPromptMode, normalMessages, saveContextMessages]);

  // ── Page context effects ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      const content = extractPageContent();
      setPageContent(content);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname, isOpen]);

  useEffect(() => {
    const fetchAvailableLinks = async () => {
      try {
        const response = await fetch('/api/lia/available-links');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.linksForLIA) setAvailableLinks(data.linksForLIA);
        }
      } catch (error) {
        console.error('Error obteniendo links disponibles:', error);
      }
    };
    fetchAvailableLinks();
  }, []);

  // ── Page change effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (prevPathnameRef.current === '') {
      prevPathnameRef.current = pathname;
      return;
    }
    if (prevPathnameRef.current !== pathname) {
      const wasOpen = isOpen;
      if (useContextMode && !isPromptMode && normalMessages.length > 0) {
        saveContextMessages(normalMessages);
      }
      if (!isPromptMode && !useContextMode) setNormalMessages([]);
      setPageContent(null);
      prevPathnameRef.current = pathname;

      if (wasOpen) {
        hasOpenedRef.current = true;
        const timer = setTimeout(() => {
          const currentPageContent = extractPageContent();
          setPageContent(currentPageContent);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        hasOpenedRef.current = false;
      }
    }
  }, [pathname, useContextMode, isPromptMode, isOpen, normalMessages, saveContextMessages]);

  useEffect(() => {
    if (isOpen && !hasOpenedRef.current && !isPromptMode) {
      hasOpenedRef.current = true;
      const timer = setTimeout(() => {
        const currentPageContent = extractPageContent();
        setPageContent(currentPageContent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPromptMode]);

  // ── Menu close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    if (isOptionsMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOptionsMenuOpen]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!modeMenuRef.current) return;
      if (!modeMenuRef.current.contains(e.target as Node)) setModeMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // ── Navigation event listener ────────────────────────────────────────────────
  useEffect(() => {
    const handleLiaNavigate = (event: CustomEvent) => {
      const { url } = event.detail;
      if (url) router.push(url);
    };
    window.addEventListener('lia-navigate', handleLiaNavigate as EventListener);
    return () => window.removeEventListener('lia-navigate', handleLiaNavigate as EventListener);
  }, [router]);

  // ── Auto-scroll on new messages ──────────────────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Input height ──────────────────────────────────────────────────────────────
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const computedStyle = window.getComputedStyle(inputRef.current);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 12;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 12;
      const singleLineHeight = lineHeight + paddingTop + paddingBottom;
      const maxHeight = singleLineHeight * 3;
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => adjustTextareaHeight(), 100);
    }
  }, [isOpen, adjustTextareaHeight]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleToggle = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (drag.isDragging || drag.hasMoved.current) return;

    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsPromptMode(false);
      setGeneratedPrompt(null);
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnreadMessages(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setAreButtonsExpanded(false);
    hasOpenedRef.current = false;
    voice.stopAllAudio();
  };

  const handleOpenPromptMode = () => {
    setIsPromptMode(true);
    setGeneratedPrompt(null);
    setAreButtonsExpanded(false);
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnreadMessages(false);
  };

  const executeClearConversation = () => {
    if (isPromptMode) {
      setPromptMessages([]);
    } else {
      setNormalMessages([]);
      if (useContextMode) {
        try { localStorage.removeItem(STORAGE_KEY_CONTEXT_MESSAGES); } catch { }
      }
    }
    setGeneratedPrompt(null);
    setIsPromptPanelOpen(false);
    setSelectedPromptMessageId(null);
    setShowClearConfirm(false);
  };

  const handleClearConversation = () => {
    if (useContextMode && normalMessages.length > 0 && !isPromptMode) {
      setShowClearConfirm(true);
      return;
    }
    executeClearConversation();
  };

  const handleDownloadPrompt = () => {
    if (!generatedPrompt) return;
    const promptContent = `# ${generatedPrompt.title}\n\n## Descripción\n${generatedPrompt.description}\n\n${'='.repeat(80)}\n\n## PROMPT LISTO PARA USAR\n\nCopia y pega el siguiente prompt en tu herramienta de IA preferida:\n\n${generatedPrompt.content}\n\n${'='.repeat(80)}\n\n## Información Adicional\n\n### Tags\n${generatedPrompt.tags.join(', ')}\n\n### Nivel de Dificultad\n${generatedPrompt.difficulty_level}\n\n### Casos de Uso\n${generatedPrompt.use_cases.map(uc => `- ${uc}`).join('\n')}\n\n### Consejos\n${generatedPrompt.tips.map(tip => `- ${tip}`).join('\n')}\n\n---\n\nGenerado por SofLIA - Asistente de IA para Creación de Prompts\nFecha: ${new Date().toLocaleString()}`;
    const blob = new Blob([promptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedPrompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePrompt = useCallback(async (draft: PromptDraft) => {
    if (!user) { alert(tCommon('aiChat.promptMode.loginRequired')); return; }
    setIsSavingPrompt(true);
    try {
      const response = await fetch('/api/ai-directory/prompts/save-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, conversation_id: conversationId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al guardar el prompt');
      }
      const data = await response.json();
      alert(`✅ Prompt guardado exitosamente: "${draft.title}"`);
      setIsPromptPanelOpen(false);
      if (data.redirectUrl) {
        const shouldNavigate = confirm('¿Quieres ver el prompt en el directorio?');
        if (shouldNavigate) router.push(data.redirectUrl);
      }
    } catch (error) {
      console.error('Error guardando prompt:', error);
      alert(`❌ Error al guardar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSavingPrompt(false);
    }
  }, [user, conversationId, router, tCommon]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping) return;

    voice.stopAllAudio();

    let shouldActivatePromptMode = false;
    let shouldDeactivatePromptMode = false;
    let shouldActivateNanoBananaMode = false;
    let shouldDeactivateNanoBananaMode = false;
    let detectedNanoBananaDomain: NanoBananaDomain = 'ui';
    let detectedNanoBananaFormat: OutputFormat = 'wireframe';

    try {
      const intentResult = await IntentDetectionService.detectIntent(inputMessage);

      if (!isNanoBananaMode && !isPromptMode && intentResult.intent === 'nanobana' && intentResult.confidence >= 0.65) {
        shouldActivateNanoBananaMode = true;
        if (intentResult.entities?.nanobananaDomain) detectedNanoBananaDomain = intentResult.entities.nanobananaDomain;
        if (intentResult.entities?.outputFormat) detectedNanoBananaFormat = intentResult.entities.outputFormat;
        setIsNanoBananaMode(true);
        setNanoBananaDomain(detectedNanoBananaDomain);
        setNanoBananaFormat(detectedNanoBananaFormat);
      } else if (isNanoBananaMode) {
        const messageLower = inputMessage.toLowerCase().trim();

        if (intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
          shouldDeactivateNanoBananaMode = true;
          shouldActivatePromptMode = true;
          setIsNanoBananaMode(false);
          setIsPromptMode(true);
          const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "✨ He cambiado al Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?", timestamp: new Date() };
          setPromptMessages(prev => [...prev, systemMessage]);
        } else if (intentResult.intent === 'navigate') {
          shouldDeactivateNanoBananaMode = true;
          setIsNanoBananaMode(false);
          const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte con la navegación.", timestamp: new Date() };
          setNormalMessages(prev => [...prev, systemMessage]);
        } else if (intentResult.intent === 'general' || intentResult.intent === 'question') {
          const nonNanoBananaKeywords = ['comunidad', 'comunidades', 'noticias', 'noticia', 'dashboard', 'perfil', 'configuración', 'ajustes', 'cuenta', 'talleres', 'taller', 'workshops', 'directorio', 'prompts', 'apps', 'aplicaciones', 'plataforma', 'sitio', 'web', 'página', 'sección', 'menú', 'navegación', 'link', 'enlace', 'ayuda', 'soporte', 'funciona', 'qué es', 'cómo', 'curso', 'cursos', 'lección', 'leccion', 'módulo', 'modulo', 'módulos', 'modulos', 'tema', 'contenido', 'video', 'transcripción', 'transcripcion', 'resumen', 'actividad', 'actividades', 'ejercicio', 'ejercicios', 'tarea', 'tareas', 'cuántos', 'cuantos', 'cuántas', 'cuantas', 'aprendo', 'aprender', 'enseña', 'material', 'materiales', 'duración', 'duracion'];
          const generalQuestionPatterns = [/\bcuántos?\b/i, /\bcuantos?\b/i, /\bqué\s+(es|son|tiene|hay)\b/i, /\bque\s+(es|son|tiene|hay)\b/i, /\bcómo\s+(funciona|puedo|hago)\b/i, /\bcomo\s+(funciona|puedo|hago)\b/i, /\bdónde\s+(está|encuentro)\b/i, /\bdonde\s+(esta|encuentro)\b/i];
          const isNonNanoBananaQuestion = nonNanoBananaKeywords.some(keyword => messageLower.includes(keyword)) || generalQuestionPatterns.some(p => p.test(messageLower));
          if (isNonNanoBananaQuestion) {
            shouldDeactivateNanoBananaMode = true;
            setIsNanoBananaMode(false);
            const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para responder tu pregunta.", timestamp: new Date() };
            setNormalMessages(prev => [...prev, systemMessage]);
          }
        } else {
          const explicitExitPatterns = [/\b(ll[eé]vame|llevame|llévame)\b/i, /\b(ir\s+a|navegar\s+a|abrir)\b/i, /\b(salir|salte|terminar|cancelar)\b.*\b(nanobana|modo|json)\b/i, /\b(no\s+quiero|ya\s+no)\b.*\b(nanobana|json|imagen)\b/i, /\bdame\s+(el\s+)?(link|enlace)\b/i, /\bquiero\s+(ir|ver|acceder)\s+a\b/i];
          if (explicitExitPatterns.some(p => p.test(messageLower))) {
            shouldDeactivateNanoBananaMode = true;
            setIsNanoBananaMode(false);
            const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte.", timestamp: new Date() };
            setNormalMessages(prev => [...prev, systemMessage]);
          }
        }
      } else if (!isPromptMode && !isNanoBananaMode && intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
        shouldActivatePromptMode = true;
        const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "✨ He detectado que quieres crear un prompt. He activado el Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?", timestamp: new Date() };
        setPromptMessages(prev => [...prev, systemMessage]);
        setIsPromptMode(true);
      } else if (isPromptMode && intentResult.intent !== 'create_prompt') {
        const messageLower = inputMessage.toLowerCase().trim();
        const explicitExitPatterns = [/\b(ll[eé]vame|llevame|llévame)\b/i, /\b(ir\s+a|navegar\s+a|abrir)\b/i, /\b(mu[eé]strame|muestrame|muéstrame)\b.*\b(página|pagina|sección|seccion)\b/i, /\bdame\s+(el\s+)?(link|enlace)\b/i, /\bquiero\s+(ir|ver|acceder)\s+a\b/i, /\b(salir|salte|terminar|cancelar)\b.*\b(prompt|modo)\b/i, /\b(no\s+quiero|ya\s+no)\b.*\bprompt\b/i];
        const nanoBananaKeywords = [/\bnanobana(na)?\b/i, /\b(wireframe|mockup|ui|interfaz|diagrama)\b.*\b(json|generar|crear|diseñar)\b/i, /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(imagen|visual|wireframe|mockup|ui|interfaz|diagrama|app|pantalla)\b/i, /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup)\b/i, /\b(diseña(r|me)?|dibuja(r|me)?)\b.*\b(una?\s*)?(app|aplicación|pantalla|interfaz)\b/i, /\b(foto|imagen)\b.*\b(producto|marketing)\b/i];
        const wantsNanoBanana = nanoBananaKeywords.some(p => p.test(messageLower));
        const isExplicitExit = explicitExitPatterns.some(p => p.test(messageLower));
        if (wantsNanoBanana) {
          shouldDeactivatePromptMode = true;
          shouldActivateNanoBananaMode = true;
          setIsPromptMode(false);
          setIsNanoBananaMode(true);
        } else if (isExplicitExit) {
          shouldDeactivatePromptMode = true;
          const systemMessage: Message = { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte.", timestamp: new Date() };
          setNormalMessages(prev => [...prev, systemMessage]);
          setIsPromptMode(false);
        }
      }
    } catch (error) {
      console.error('[LIA Agent] ❌ Error detectando intención:', error);
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage, timestamp: new Date() };
    const effectivePromptMode = (isPromptMode || shouldActivatePromptMode) && !shouldDeactivatePromptMode && !shouldActivateNanoBananaMode;
    const effectiveNanoBananaMode = (isNanoBananaMode || shouldActivateNanoBananaMode) && !shouldDeactivateNanoBananaMode;
    const shouldWaitForDescription = shouldActivateNanoBananaMode || shouldActivatePromptMode;

    if (shouldWaitForDescription) {
      if (effectiveNanoBananaMode) setNanoBananaMessages(prev => [...prev, userMessage]);
      else if (effectivePromptMode) setPromptMessages(prev => [...prev, userMessage]);
      else setNormalMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setTimeout(() => {
        if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; }
      }, 0);
      return;
    }

    if (effectiveNanoBananaMode) setNanoBananaMessages(prev => [...prev, userMessage]);
    else if (effectivePromptMode) setPromptMessages(prev => [...prev, userMessage]);
    else setNormalMessages(prev => [...prev, userMessage]);

    setInputMessage('');
    setTimeout(() => {
      if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; }
    }, 0);
    setIsTyping(true);

    try {
      if (effectiveNanoBananaMode) {
        const response = await fetch('/api/ai-directory/generate-nanobana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            preferredDomain: nanoBananaDomain,
            preferredFormat: nanoBananaFormat,
            conversationHistory: nanoBananaMessages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content, timestamp: m.timestamp.toLocaleTimeString() })),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || responseFallback, timestamp: new Date() };
        if (data.generatedSchema) {
          const jsonStr = data.jsonString || JSON.stringify(data.generatedSchema, null, 2);
          const domainValue = data.domain || 'ui';
          const formatValue = data.outputFormat || 'wireframe';
          assistantMessage.generatedNanoBanana = { schema: data.generatedSchema, jsonString: jsonStr, domain: domainValue, outputFormat: formatValue };
          setNanoBananaSchema(data.generatedSchema);
          setNanoBananaJsonString(jsonStr);
          setNanoBananaDomain(domainValue);
          setNanoBananaFormat(formatValue);
          setIsNanoBananaPanelOpen(true);
        }
        setNanoBananaMessages(prev => [...prev, assistantMessage]);
        if (voice.isVoiceEnabled && assistantMessage.content) voice.speakText(assistantMessage.content);
      } else if (effectivePromptMode) {
        const response = await fetch('/api/ai-directory/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage.content, conversationHistory: promptMessages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content, timestamp: m.timestamp.toLocaleTimeString() })) }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        let messageContent = data.response || responseFallback;
        if (data.generatedPrompt) {
          const promptTitle = data.generatedPrompt.title || 'Tu prompt';
          messageContent = `¡Listo! He generado el prompt "${promptTitle}". Puedes verlo, copiarlo o guardarlo en tu biblioteca usando el panel que aparece arriba. ¿Necesitas algún ajuste o tienes otra idea de prompt?`;
        }
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: messageContent, timestamp: new Date() };
        if (data.generatedPrompt) {
          assistantMessage.generatedPrompt = data.generatedPrompt;
          setGeneratedPrompt(data.generatedPrompt);
          setIsPromptPanelOpen(true);
          setSelectedPromptMessageId(assistantMessage.id);
        }
        setPromptMessages(prev => [...prev, assistantMessage]);
        if (voice.isVoiceEnabled && assistantMessage.content) voice.speakText(assistantMessage.content);
      } else {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            context: activeContext,
            language,
            isPromptMode: false,
            conversationId: conversationId,
            pageContext: {
              pathname, description: pageContextInfo, detectedArea: detectedContext,
              pageTitle: pageContent?.title || '', metaDescription: pageContent?.metaDescription || '',
              headings: pageContent?.headings || [], mainText: pageContent?.mainText || '',
              platformContext: getPlatformContext(), availableLinks,
            },
            conversationHistory: normalMessages.map(m => ({ role: m.role, content: m.content })),
            userName: user?.display_name || user?.username || user?.first_name,
            userInfo: user ? { display_name: user.display_name, first_name: user.first_name, last_name: user.last_name, username: user.username, type_rol: (user as any).type_rol } : undefined,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.conversationId && !conversationId) setConversationId(data.conversationId);
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || responseFallback, timestamp: new Date() };
        setNormalMessages(prev => [...prev, assistantMessage]);
        if (voice.isVoiceEnabled && assistantMessage.content) voice.speakText(assistantMessage.content);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error en el chat:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorGeneric, timestamp: new Date() };
      if (isPromptMode) setPromptMessages(prev => [...prev, errorMessage]);
      else setNormalMessages(prev => [...prev, errorMessage]);
      if (voice.isVoiceEnabled && errorMessage.content) voice.speakText(errorMessage.content);
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, normalMessages, promptMessages, nanoBananaMessages, activeContext, pathname, pageContextInfo, detectedContext, user, language, responseFallback, errorGeneric, isPromptMode, isNanoBananaMode, pageContent, availableLinks, voice, conversationId, nanoBananaDomain, nanoBananaFormat]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleRequestHelp = useCallback(async (overridePageContent?: { title: string; metaDescription: string; headings: string[]; mainText: string; } | null) => {
    let currentPageContent = overridePageContent ?? pageContent;
    if (!currentPageContent || !currentPageContent.title) {
      currentPageContent = extractPageContent();
      setPageContent(currentPageContent);
    }
    const helpMessageContent = helpPrompt;
    setIsTyping(true);
    try {
      const currentMessages = normalMessages;
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: helpMessageContent, context: activeContext, language,
          pageContext: { pathname, description: pageContextInfo, detectedArea: detectedContext, pageTitle: currentPageContent?.title || '', metaDescription: currentPageContent?.metaDescription || '', headings: currentPageContent?.headings || [], mainText: currentPageContent?.mainText || '', platformContext: getPlatformContext(), availableLinks },
          conversationHistory: currentMessages.map(m => ({ role: m.role, content: m.content })),
          userName: user?.display_name || user?.username || user?.first_name,
          isSystemMessage: true,
        }),
      });
      if (!response.ok) throw new Error('Error al obtener ayuda');
      const data = await response.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || helpFallback, timestamp: new Date() };
      setNormalMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: helpError, timestamp: new Date() };
      setNormalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [activeContext, pathname, pageContextInfo, detectedContext, pageContent, user, language, helpPrompt, helpFallback, helpError, normalMessages, availableLinks]);

  const handleToggleRecording = useCallback(() => {
    return voice.toggleRecording((transcript: string) => {
      setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
    });
  }, [voice]);

  return {
    // Theme / layout
    isDark, theme, currentMode, bottomPosition, chatBottomPosition, promptBottomPosition, calculateMaxHeight, widgetHeight, hasDashboardNavbar, isDesktop, isCommunitiesPage,
    // Open/mode state
    isOpen, isMinimized, isPromptMode, isNanoBananaMode, useContextMode, setUseContextMode, setIsNanoBananaMode, setIsPromptMode,
    hasUnreadMessages, areButtonsExpanded, setAreButtonsExpanded,
    // Messages
    messages, normalMessages, promptMessages, nanoBananaMessages, MAX_CONTEXT_MESSAGES,
    // NanoBanana
    nanoBananaSchema, setNanoBananaSchema, nanoBananaJsonString, setNanoBananaJsonString,
    nanoBananaDomain, setNanoBananaDomain, nanoBananaFormat, setNanoBananaFormat,
    isNanoBananaPanelOpen, setIsNanoBananaPanelOpen,
    // Prompt
    generatedPrompt, setGeneratedPrompt, isPromptPanelOpen, setIsPromptPanelOpen, selectedPromptMessageId, setSelectedPromptMessageId, isSavingPrompt,
    // Input
    inputMessage, setInputMessage, isTyping, inputRef, messagesEndRef, adjustTextareaHeight, placeholderText,
    // Menus
    isPersonalizationOpen, setIsPersonalizationOpen,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    modeMenuOpen, setModeMenuOpen, modeMenuRef,
    showClearConfirm, setShowClearConfirm,
    isReportOpen, setIsReportOpen,
    // Voice
    isSpeaking: voice.isSpeaking, isRecording: voice.isRecording, isVoiceEnabled: voice.isVoiceEnabled,
    // Drag
    position: drag.position, isDragging: drag.isDragging, containerRef: drag.containerRef, hasMoved: drag.hasMoved,
    handleMouseDown: drag.handleMouseDown, handleTouchStart: drag.handleTouchStart,
    // Handlers
    handleToggle, handleClose, handleOpenPromptMode,
    handleClearConversation, executeClearConversation, clearContextMessages,
    handleDownloadPrompt, handleSavePrompt,
    handleSendMessage, handleKeyPress, handleRequestHelp, handleToggleRecording,
    // Strings
    translatedInitialMessage, onlineLabel: tCommon('aiChat.online'), pressEnterLabel: tCommon('aiChat.pressEnter'),
    clickToSendLabel: tCommon('aiChat.clickToSend'), clickToDictateLabel: tCommon('aiChat.clickToDictate'),
    clearConversationLabel, changeModeLabel, clearContextLabel, clearContextConfirmLabel, reportProblemLabel,
    promptModeTitle, promptModeDesc, promptModeEmptyDesc, nanobanaTitle, nanobanaDesc, nanobanaEmptyDesc, nanobanaWelcome,
    contextModeTitle, contextModeDesc, contextModeEmptyDesc, assistantModeTitle, assistantModeEmptyDesc,
    voiceListening: tCommon('aiChat.voice.listening'), voiceProcessing: tCommon('aiChat.voice.processing'),
  };
}

export type AIChatAgentLogic = ReturnType<typeof useAIChatAgentLogic>;
