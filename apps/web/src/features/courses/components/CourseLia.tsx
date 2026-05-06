'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Square, Trash2, Copy, StickyNote, Check, Mic, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { SHARED_TOUR_TARGET_IDS } from '../../../core/constants/tourTargets';
import { useBrowserSpeechRecognition } from '../../../core/hooks/useBrowserSpeechRecognition';
import { useLanguage } from '../../../core/providers/I18nProvider';
import { useThemeStore } from '../../../core/stores/themeStore';
import { useLiaCourse } from '../context/LiaCourseContext';
import { useLiaCourseChat } from '../../../core/hooks/useLiaCourseChat';
import type { CourseLessonContext, SofLIAMessage } from '../../../core/types/lia.types';
import type { LiaImageAttachment } from '../../../core/reporting/report-problem.contract';

import { copyTextToClipboard } from '../../../lib/clipboard';
import { convertNoteMarkdownToHtml } from '../../../core/components/NotesModal/shared/notes-markdown-to-html.service';
import { useLessonChatSuggestions } from '../hooks/useLessonChatSuggestions';
import { ChatSuggestionsChips } from './CourseLia/chat-suggestions';
import { normalizeLiaLinkUrl, type NormalizedLiaLink } from './CourseLia/lia-link.utils';
import type { LessonSuggestionsActivityFocus } from '../../../app/api/lia/lesson-suggestions/lesson-suggestions.types';

const VOICE_BAR_SCALES = [0.25, 1, 0.45, 0.8, 0.3, 0.95, 0.5];

function VoiceWaveformBars({ color, count = 4, size = 14 }: { color: string; count?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', height: `${size}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: VOICE_BAR_SCALES }}
          transition={{
            duration: 1.1 + i * 0.09,
            repeat: Infinity,
            delay: i * 0.13,
            ease: 'easeInOut',
          }}
          style={{
            width: '3px',
            height: '100%',
            borderRadius: '2px',
            backgroundColor: color,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}

// Tipos necesarios
interface CourseLiaProps {
  lessonId?: string;
  lessonTitle?: string;
  courseSlug?: string;
  transcriptContent?: string | null;
  summaryContent?: string | null;
  lessonContent?: string | null;
  lessonContext?: CourseLessonContext;
  customColors?: {
    panelBg?: string;
    borderColor?: string;
    accentColor?: string;
    textPrimary?: string;
    textSecondary?: string;
  };
  onSaveNote?: (content: string) => void;
}


const PANEL_WIDTH = 420;
const COURSE_LIA_BUTTON_BOTTOM_PX = 24;
const COURSE_LIA_BUTTON_RIGHT_PX = 24;
const COURSE_LIA_BUTTON_SIZE_PX = 60;
const NAVBAR_HEIGHT = 50; // Ajuste final para cubrir totalmente el borde y el espacio oscuro
const MOBILE_BOTTOM_NAV_HEIGHT = 104; // Altura de la barra de navegación inferior móvil (70px base + safe-area)

function parseMarkdownContent(text: string, onLinkClick: (link: NormalizedLiaLink) => void, isDarkMode: boolean = true): React.ReactNode {
  let keyIndex = 0;
  let processedText = text.replace(/^\*\s+/gm, '- ');
  const lines = processedText.split('\n');
  
  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|((?:https?:\/\/|www\.)[^\s)]+|\/[A-Za-z0-9][^\s)]*)|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1] || match[4]) { // Link
        const linkText = match[2] || match[4];
        const linkUrl = match[3] || match[4];
        const normalizedLink = normalizeLiaLinkUrl(linkUrl);

        if (normalizedLink) {
          elements.push(
            <a
              key={`link-${keyIndex++}`}
              href={normalizedLink.url}
              onClick={(e) => { e.preventDefault(); onLinkClick(normalizedLink); }}
              rel={normalizedLink.kind === 'external' ? 'noopener noreferrer' : undefined}
              style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
            >
              {linkText}
            </a>
          );
        } else {
          elements.push(linkText);
        }
      } else if (match[5]) { // Bold
        elements.push(<strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>{match[6]}</strong>);
      } else if (match[7]) { // Italic
        elements.push(<em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>{match[8]}</em>);
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }
    return elements.length > 0 ? elements : [line];
  };

  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });

  return <>{result}</>;
}

// Botón Flotante - Solo visible en tablets/desktop (md:), en móviles se integra en la barra inferior
function CourseLiaFloatingButton() {
  const { isOpen, toggleLia } = useLiaCourse();
  
  return (
    <>


      <AnimatePresence>
        {!isOpen && (
          <div
            id={SHARED_TOUR_TARGET_IDS.liaTrigger}
            data-tour="lia-button"
            className="hidden md:block"
            style={{
              position: 'fixed',
              bottom: `${COURSE_LIA_BUTTON_BOTTOM_PX}px`,
              right: `${COURSE_LIA_BUTTON_RIGHT_PX}px`,
              width: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
              height: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.01)',
              borderRadius: '50%',
            }}
          >
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLia}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#1E2329',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                overflow: 'hidden',
              }}
              aria-label="Abrir asistente SofLIA"
            >
              <img
                src="/lia-avatar.webp"
                alt="SofLIA"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Panel Principal
function CourseLiaPanelContent({
  lessonId,
  lessonTitle,
  courseSlug,
  customColors,
  transcriptContent,
  summaryContent,
  lessonContent,
  lessonContext,
  onSaveNote,
}: CourseLiaProps) {
  const { t } = useTranslation('learn');
  const { language } = useLanguage();
  const {
    isOpen,
    closeLia,
    currentActivity,
    registerLiaChat,
    setCourseContext,
  } = useLiaCourse();
  const prevActivityTriggerRef = useRef<number | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  const isLightTheme = !isDarkMode;
  const resolvedLessonContext = useMemo<CourseLessonContext | undefined>(() => {
    const hasLegacyContext = Boolean(
      lessonId ||
        lessonTitle ||
        courseSlug ||
        transcriptContent ||
        summaryContent ||
        lessonContent,
    );

    if (!lessonContext && !hasLegacyContext) {
      return undefined;
    }

    return {
      ...lessonContext,
      lessonId: lessonContext?.lessonId ?? lessonId,
      lessonTitle: lessonContext?.lessonTitle ?? lessonTitle,
      courseSlug: lessonContext?.courseSlug ?? courseSlug,
      transcriptContent:
        lessonContext?.transcriptContent ?? transcriptContent ?? undefined,
      summaryContent:
        lessonContext?.summaryContent ?? summaryContent ?? undefined,
      lessonDescription:
        lessonContext?.lessonDescription ?? lessonContent ?? undefined,
    };
  }, [
    courseSlug,
    lessonContent,
    lessonContext,
    lessonId,
    lessonTitle,
    summaryContent,
    transcriptContent,
  ]);
  // Detectar si es móvil para ajustar el layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Detectar si estamos usando un tema personalizado (generalmente oscuro en esta empresa)
  const isCustomTheme = !!customColors?.panelBg;

  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [forceDarkText, setForceDarkText] = useState(false);

  const computedTextPrimary = forceDarkText ? '#1E293B' : (customColors?.textPrimary || (isLightTheme ? '#1E293B' : '#e5e7eb'));
  const computedTextSecondary = forceDarkText ? '#64748B' : (customColors?.textSecondary || (isLightTheme ? '#64748B' : '#6b7280'));
  const computedInputBg = forceDarkText ? '#F1F5F9' : (isCustomTheme ? (isLightTheme ? '#F1F5F9' : 'rgba(0,0,0,0.3)') : (isLightTheme ? '#F1F5F9' : 'rgba(255,255,255,0.05)'));
  const computedBorderColor = forceDarkText ? '#E2E8F0' : (customColors?.borderColor || (isLightTheme ? '#E2E8F0' : '#1e2a35'));
  const computedMessageBubbleAssistant = forceDarkText ? '#F1F5F9' : (isCustomTheme ? 'rgba(255,255,255,0.1)' : (isLightTheme ? '#F1F5F9' : '#1e2a35'));
  const computedInputBorder = forceDarkText ? '#CBD5E1' : (customColors?.borderColor ? 'transparent' : (isLightTheme ? '#CBD5E1' : '#374151'));

  const themeColors = {
    panelBg: customColors?.panelBg || (isLightTheme ? '#FFFFFF' : '#0a0f14'),
    headerBg: customColors?.panelBg || (isLightTheme ? '#F8FAFC' : '#0a0f14'),
    borderColor: computedBorderColor,
    messageBubbleAssistant: computedMessageBubbleAssistant,
    messageBubbleUser: '#0A2540',
    textPrimary: computedTextPrimary,
    textSecondary: computedTextSecondary,
    inputBg: computedInputBg,
    inputBorder: computedInputBorder,
    accentColor: customColors?.accentColor || '#00D4B3',
    primaryAction: customColors?.accentColor || '#0A2540',
  };

  const initialMessage = null;

  const liaChat = useLiaCourseChat(initialMessage);
  const {
    messages,
    isLoading,
    sendMessage,
    editMessageAndRegenerate,
    stop,
    clearHistory,
  } = liaChat;
  const speechRecognitionLang = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';
  const {
    isListening,
    toggleListening,
    voiceError,
    setVoiceError,
  } = useBrowserSpeechRecognition({
    disabled: isLoading,
    lang: speechRecognitionLang,
    messages: {
      notAllowed: t('lia.voice.permissionError'),
      notSupported: t('lia.voice.notSupported'),
      startError: t('lia.voice.startError'),
    },
    onTranscript: (transcript) => {
      setInputValue((currentValue) => {
        const trimmedCurrent = currentValue.trim();
        return trimmedCurrent ? `${trimmedCurrent} ${transcript}` : transcript;
      });
      inputRef.current?.focus();
    },
  });

  const resizeTextArea = useCallback(
    (textarea: HTMLTextAreaElement | null, maxHeight = 128) => {
      if (!textarea) {
        return;
      }

      textarea.style.height = '0px';
      const nextHeight = Math.min(Math.max(textarea.scrollHeight, 20), maxHeight);
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    },
    [],
  );

  useEffect(() => {
    resizeTextArea(inputRef.current);
  }, [inputValue, resizeTextArea]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    setTimeout(() => {
      resizeTextArea(editInputRef.current, 160);
      editInputRef.current?.focus();
    }, 0);
  }, [editingMessageId, editingValue, resizeTextArea]);

  const suggestionActivityFocus = useMemo<
    LessonSuggestionsActivityFocus | undefined
  >(() => {
    if (!currentActivity?.title || !currentActivity.type) {
      return undefined;
    }

    return {
      title: currentActivity.title,
      type: currentActivity.type,
      description: currentActivity.description || undefined,
    };
  }, [currentActivity]);

  const resolvedLessonId = resolvedLessonContext?.lessonId;
  const resolvedCourseSlug = resolvedLessonContext?.courseSlug;

  const {
    suggestions: lessonSuggestions,
    isLoading: isLoadingSuggestions,
    markUsed: markSuggestionUsed,
    reset: resetSuggestions,
  } = useLessonChatSuggestions({
    lessonId: resolvedLessonId,
    courseSlug: resolvedCourseSlug,
    enabled: isOpen && Boolean(resolvedLessonId && resolvedCourseSlug),
    activityFocus: suggestionActivityFocus,
  });

  useEffect(() => {
    if (!isOpen) {
      resetSuggestions();
    }
  }, [isOpen, resetSuggestions]);

  const handleSuggestionClick = useCallback(
    (suggestion: { id: string; text: string }) => {
      if (isLoading) {
        return;
      }
      markSuggestionUsed(suggestion.id);
      void sendMessage(suggestion.text, resolvedLessonContext);
    },
    [isLoading, markSuggestionUsed, resolvedLessonContext, sendMessage],
  );

  // Registrar esta instancia en el contexto para acceso global (modales, etc.)
  useEffect(() => {
    registerLiaChat(liaChat);
    return () => registerLiaChat(null);
  }, [liaChat, registerLiaChat]);

  useEffect(() => {
    setCourseContext(resolvedLessonContext || null);
    return () => setCourseContext(null);
  }, [resolvedLessonContext, setCourseContext]);
  

  useEffect(() => {
    const checkContrast = () => {
      if (panelRef.current) {
        const bg = window.getComputedStyle(panelRef.current).backgroundColor;
        const rgb = bg.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
          if (brightness > 200) { // Umbral alto para asegurar que es fondo claro
            setForceDarkText(true);
          }
        }
      }
    };
    
    // Verificar inmediatamente y despues de renderizado
    checkContrast();
    const timer = setTimeout(checkContrast, 500);
    return () => clearTimeout(timer);
  }, [themeColors.panelBg, isLightTheme]);

  const handleLinkClick = useCallback((link: NormalizedLiaLink) => {
    if (link.kind === 'internal') {
      // closeLia(); // Opcional: cerrar al navegar
      router.push(link.url);
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  }, [router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, [t]);

  useEffect(() => {
    if (!isOpen) {
      setCopiedMessageId(null);
      setEditingMessageId(null);
      setEditingValue('');
    }
  }, [isOpen]);

  // 🚀 EFECTO: Detectar inicio de actividad y detonar bienvenida de LIA
  useEffect(() => {
    // Usamos el timestamp para arrancar siempre que se invoque, sin importar que sea la misma de antes.
    if (isOpen && currentActivity && currentActivity.timestamp !== prevActivityTriggerRef.current) {
      prevActivityTriggerRef.current = currentActivity.timestamp || null;
      
      // Lógica para detonar el mensaje inicial
      const triggerWelcomeByActivity = async () => {
         // Borramos el historial primero para tener la conversacion limpia (la previa se persiste implícitamente por el hook base / backend en background)
         clearHistory();

         const baseActivitiesContext = resolvedLessonContext?.activitiesContext;
         const context: CourseLessonContext = {
            ...resolvedLessonContext,
            activitiesContext: {
                totalActivities: baseActivitiesContext?.totalActivities ?? 0,
                requiredActivities: baseActivitiesContext?.requiredActivities ?? 0,
                completedActivities: baseActivitiesContext?.completedActivities ?? 0,
                pendingRequiredCount: baseActivitiesContext?.pendingRequiredCount ?? 0,
                pendingRequiredTitles: baseActivitiesContext?.pendingRequiredTitles,
                activityTypes: baseActivitiesContext?.activityTypes,
                currentActivityFocus: {
                    title: currentActivity.title,
                    type: currentActivity.type,
                    isRequired:
                      baseActivitiesContext?.currentActivityFocus?.isRequired ??
                      false,
                    isCompleted:
                      baseActivitiesContext?.currentActivityFocus?.isCompleted ??
                      false,
                    description: currentActivity.description || currentActivity.title,
                    prompts: currentActivity.prompts,
                }
            }
         };

         // Prompt interno oculto para forzar a SofLIA a hablar primero
         const systemTrigger = `[SYSTEM_EVENT: USER_STARTED_ACTIVITY]
         Actividad: "${currentActivity.title}"
         Descripción: "${currentActivity.description}"
         
         Instrucción para SofLIA:
         El usuario acaba de hacer clic en "Interactuar con SofLIA" para esta actividad.
         1. Salúdalo por su nombre y menciona explícitamente que estás lista para guiarlo en "${currentActivity.title}".
         2. Explica brevemente el objetivo (1 frase).
         3. Haz la primera pregunta o da la primera instrucción para empezar.
         NO esperes a que el usuario hable. TOMA LA INICIATIVA AHORA.`;

         await sendMessage(systemTrigger, context, undefined, true);
      };

      triggerWelcomeByActivity();
    }
  }, [isOpen, currentActivity, resolvedLessonContext, sendMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    
    // Construir contexto del curso
    await sendMessage(
      message,
      resolvedLessonContext,
      undefined,
      false
    );
  }, [inputValue, isLoading, resolvedLessonContext, sendMessage]);

  const handlePrimaryAction = useCallback(() => {
    if (isLoading) {
      stop();
      return;
    }

    if (!inputValue.trim()) {
      void toggleListening();
      return;
    }

    if (isListening) {
      void toggleListening();
    }

    void handleSendMessage();
  }, [handleSendMessage, inputValue, isListening, isLoading, stop, toggleListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartEditingMessage = useCallback((message: SofLIAMessage) => {
    if (isLoading || message.role !== 'user') {
      return;
    }

    setEditingMessageId(message.id);
    setEditingValue(message.content);
  }, [isLoading]);

  const handleCancelEditingMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditingValue('');
  }, []);

  const handleSubmitEditedMessage = useCallback(async () => {
    if (!editingMessageId || !editingValue.trim() || isLoading) {
      return;
    }

    const messageId = editingMessageId;
    const nextMessage = editingValue.trim();
    setEditingMessageId(null);
    setEditingValue('');

    await editMessageAndRegenerate(
      messageId,
      nextMessage,
      resolvedLessonContext,
      undefined,
    );
  }, [
    editMessageAndRegenerate,
    editingMessageId,
    editingValue,
    isLoading,
    resolvedLessonContext,
  ]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmitEditedMessage();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditingMessage();
    }
  };

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    const wasCopied = await copyTextToClipboard(content);

    if (!wasCopied) {
      console.warn('No se pudo copiar el mensaje');
      return;
    }

    if (copyFeedbackTimeoutRef.current !== null) {
      clearTimeout(copyFeedbackTimeoutRef.current);
    }

    setCopiedMessageId(messageId);
    copyFeedbackTimeoutRef.current = setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  }, []);

  // Calcular dimensiones responsive
  const panelWidth = isMobile ? '100%' : `${PANEL_WIDTH}px`;
  const panelHeight = isMobile 
    ? `calc(100vh - ${NAVBAR_HEIGHT}px - calc(70px + max(env(safe-area-inset-bottom), 8px)))` 
    : `calc(100vh - ${NAVBAR_HEIGHT}px)`;
  const animationInitial = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { x: 0 };
  const animationExit = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };
  const hasInputText = Boolean(inputValue.trim());
  const primaryActionMode = isLoading ? 'stop' : hasInputText ? 'send' : 'voice';
  const primaryActionLabel = isLoading
    ? t('lia.stopGeneration')
    : hasInputText
    ? t('lia.send')
    : isListening
    ? t('lia.voice.stopDictation')
    : t('lia.voice.startDictation');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={panelRef}
          initial={animationInitial}
          animate={animationAnimate}
          exit={animationExit}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: `${NAVBAR_HEIGHT}px`,
            right: 0,
            width: panelWidth,
            height: panelHeight,
            backgroundColor: themeColors.panelBg,
            borderLeft: isMobile ? 'none' : `1px solid ${themeColors.borderColor}`,
            borderTop: 'none', 
            borderTopLeftRadius: isMobile ? '20px' : 0,
            borderTopRightRadius: isMobile ? '20px' : 0,
            zIndex: 45, // Menor que la barra inferior (z-50) para que sea clickeable
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile 
              ? '0 -8px 32px rgba(0, 0, 0, 0.3)' 
              : `-4px 0 20px rgba(0, 0, 0, 0.1), 0 -2px 0 ${themeColors.panelBg}`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${themeColors.borderColor}`, backgroundColor: themeColors.headerBg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <img src="/lia-avatar.webp" alt="SofLIA" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.accentColor}` }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', backgroundColor: '#22c55e', borderRadius: '50%', border: `2px solid ${themeColors.panelBg}` }} />
              </div>
              <div>
                <h2 className="lia-header-title" style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>SofLIA</h2>
              </div>
            </div>
            
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={clearHistory} 
                title="Borrar conversación"
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 style={{ width: '18px', height: '18px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
              </button>
              <button onClick={closeLia} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: '18px', height: '18px' }} color={isLightTheme ? '#1E293B' : themeColors.textSecondary} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((message) => {
              const isEditingThisMessage =
                editingMessageId === message.id && message.role === 'user';

              return (
                <div key={message.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', gap: '6px' }}>
                  {message.role === 'user' && !isEditingThisMessage && !isLoading ? (
                    <button
                      type="button"
                      onClick={() => handleStartEditingMessage(message)}
                      title={t('lia.editMessage')}
                      aria-label={t('lia.editMessage')}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', background: isLightTheme ? '#F1F5F9' : 'rgba(255,255,255,0.08)', border: `1px solid ${isLightTheme ? '#CBD5E1' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLightTheme ? '#475569' : 'rgba(255,255,255,0.75)', flexShrink: 0 }}
                    >
                      <Pencil style={{ width: '13px', height: '13px' }} />
                    </button>
                  ) : null}
                  <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', backgroundColor: message.role === 'user' ? '#0A2540' : themeColors.messageBubbleAssistant }}>
                    {isEditingThisMessage ? (
                      <>
                        <textarea
                          ref={editInputRef}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          rows={1}
                          className="lia-input-reset lia-chat-edit-input"
                          style={{ width: '100%', minWidth: '220px', maxWidth: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '14px', lineHeight: 1.5, padding: 0 }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => void handleSubmitEditedMessage()}
                            disabled={!editingValue.trim() || isLoading}
                            title={t('lia.saveEdit')}
                            aria-label={t('lia.saveEdit')}
                            style={{ background: 'transparent', border: 'none', cursor: editingValue.trim() && !isLoading ? 'pointer' : 'not-allowed', padding: '4px', display: 'flex', alignItems: 'center', color: editingValue.trim() && !isLoading ? themeColors.accentColor : 'rgba(255,255,255,0.5)' }}
                          >
                            <Check style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditingMessage}
                            title={t('lia.cancelEdit')}
                            aria-label={t('lia.cancelEdit')}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.75)' }}
                          >
                            <X style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className={message.role === 'user' ? 'lia-msg-user-text' : 'lia-msg-assistant-text'} style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', color: message.role === 'user' ? '#ffffff' : themeColors.textPrimary }}>
                        {message.role === 'assistant' ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode) : message.content}
                      </p>
                    )}
                    {message.attachments?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        {message.attachments.map((attachment: LiaImageAttachment, attachmentIndex: number) => (
                          <img
                            key={`${message.id}-attachment-${attachmentIndex}`}
                            src={attachment.dataUrl}
                            alt={attachment.fileName}
                            style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                        ))}
                      </div>
                    ) : null}
                    {message.role === 'assistant' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end', opacity: 0.7 }}>
                        <button 
                          onClick={() => void handleCopyMessage(message.id, message.content)}
                          title={copiedMessageId === message.id ? 'Texto copiado' : 'Copiar texto'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: copiedMessageId === message.id
                              ? themeColors.accentColor
                              : isLightTheme
                              ? '#64748B'
                              : themeColors.textSecondary
                          }}
                        >
                          {copiedMessageId === message.id ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                        {onSaveNote && (
                          <button
                            onClick={() => {
                              const htmlContent = convertNoteMarkdownToHtml(message.content);
                              onSaveNote(htmlContent);
                            }}
                            title="Guardar como nota"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: isLightTheme ? '#64748B' : themeColors.textSecondary }}
                          >
                             <StickyNote style={{ width: '14px', height: '14px' }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
               <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px' }}>
                 <div 
                   className="animate-pulse"
                   style={{ 
                     width: '32px', 
                     height: '32px', 
                     borderRadius: '50%', 
                     overflow: 'hidden',
                     border: `2px solid ${themeColors.accentColor}`
                  }}
                 >
                   <img src="/lia-avatar.webp" alt="Escribiendo..." style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
                 <button 
                   onClick={() => stop()}
                   title="Detener generación"
                  style={{ display: 'none' }}
                 >
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="10"></circle>
                     <rect x="9" y="9" width="6" height="6"></rect>
                   </svg>
                 </button>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatSuggestionsChips
            suggestions={lessonSuggestions}
            isLoading={isLoadingSuggestions}
            isLightTheme={isLightTheme || forceDarkText}
            theme={{
              accentColor: themeColors.accentColor,
              borderColor: themeColors.borderColor,
              inputBg: themeColors.inputBg,
              textPrimary: themeColors.textPrimary,
              textSecondary: themeColors.textSecondary,
            }}
            onSuggestionClick={handleSuggestionClick}
            forceCollapse={currentActivity?.timestamp || false}
          />

          {/* Input */}
          <div style={{ padding: isMobile ? '8px 3% 10px' : '10px 16px 12px', borderTop: `1px solid ${themeColors.borderColor}` }}>

            {voiceError ? (
              <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.12)', color: isLightTheme ? '#92400E' : '#FCD34D', fontSize: '12px', border: '1px solid rgba(245,158,11,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span>{voiceError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                  aria-label={t('actions.close', { ns: 'common' })}
                >
                  ×
                </button>
              </div>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2%' : '9px', backgroundColor: themeColors.inputBg, borderRadius: '20px', padding: isMobile ? '5px 3%' : '5px 9px 5px 14px', border: `1px solid ${themeColors.inputBorder}`, overflow: 'hidden', minWidth: 0 }}>

               {isListening && !inputValue && (
                 <div style={{ flexShrink: 0 }}>
                   <VoiceWaveformBars color={themeColors.accentColor} count={5} size={18} />
                 </div>
               )}

               <textarea
                 ref={inputRef}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder={t('lia.coursePlaceholder')}
                 rows={1}
                 style={{ flex: 1, minHeight: '20px', maxHeight: '120px', resize: 'none', backgroundColor: 'transparent', border: 'none', outline: 'none', color: themeColors.textPrimary, fontSize: '14px', lineHeight: '20px', padding: 0, overflowY: 'hidden', display: 'block' }}
                 id="lia-course-chat-input"
                 className="lia-input-reset lia-chat-input"
               />
               <motion.button
                 type="button"
                 onClick={handlePrimaryAction}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 title={primaryActionLabel}
                 aria-label={primaryActionLabel}
                 style={{
                   width: '34px',
                   height: '34px',
                   borderRadius: '50%',
                   backgroundColor: primaryActionMode === 'stop'
                     ? (isLightTheme ? '#DC2626' : '#EF4444')
                     : primaryActionMode === 'send'
                     ? themeColors.primaryAction
                     : isListening
                     ? 'rgba(16,185,129,0.16)'
                     : (isLightTheme ? '#CBD5E1' : '#374151'),
                   border: 'none',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   flexShrink: 0,
                   transition: 'all 180ms ease'
                 }}
               >
                 <AnimatePresence mode="wait">
                   {primaryActionMode === 'stop' ? (
                     <motion.span key="stop" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                       <Square style={{ width: '15px', height: '15px', color: '#FFFFFF', fill: '#FFFFFF' }} />
                     </motion.span>
                   ) : primaryActionMode === 'send' ? (
                     <motion.span key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                       <Send style={{ width: '16px', height: '16px', color: isLightTheme ? '#FFFFFF' : '#0A2540' }} />
                     </motion.span>
                   ) : isListening ? (
                     <motion.span key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                       <VoiceWaveformBars color="#10B981" count={4} size={14} />
                     </motion.span>
                   ) : (
                     <motion.span key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                       <Mic style={{ width: '16px', height: '16px', color: isLightTheme ? '#6B7280' : '#9CA3AF' }} />
                     </motion.span>
                   )}
                 </AnimatePresence>
               </motion.button>
             </div>
          </div>
          {/* CSS con máxima especificidad para garantizar visibilidad */}
          <style>{`
            @keyframes liaPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
            
            /* Corrección DEFINITIVA para el input de LIA usando ID para máxima especificidad */
            #lia-course-chat-input {
              background-color: transparent !important;
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
              color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
              caret-color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
              -webkit-text-fill-color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
            }
            
            #lia-course-chat-input::placeholder {
              color: ${isLightTheme ? '#64748B' : themeColors.textSecondary} !important;
              opacity: 1 !important;
              -webkit-text-fill-color: ${isLightTheme ? '#64748B' : themeColors.textSecondary} !important;
            }

            /* Header de LIA */
            .lia-header-title {
              color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
            }

            /* Clases forzadas para texto de mensajes */
            .lia-msg-user-text {
              color: white !important;
              -webkit-text-fill-color: white !important;
            }
            .lia-msg-assistant-text {
              color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
              -webkit-text-fill-color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
            }
            
            /* Input forzado */
            .lia-chat-input {
              color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
              caret-color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
              -webkit-text-fill-color: ${isLightTheme ? '#1E293B' : themeColors.textPrimary} !important;
            }
            .lia-chat-input::placeholder {
              color: ${isLightTheme ? '#64748B' : themeColors.textSecondary} !important;
              opacity: 1 !important;
              -webkit-text-fill-color: ${isLightTheme ? '#64748B' : themeColors.textSecondary} !important;
            }

            /* OVERRIDE DE EMERGENCIA SI SE DETECTA FONDO CLARO */
            ${forceDarkText ? `
              .lia-msg-assistant-text, 
              .lia-chat-input, 
              #lia-course-chat-input {
                 color: #0F172A !important;
                 caret-color: #0F172A !important;
                 -webkit-text-fill-color: #0F172A !important;
              }
              .lia-chat-input::placeholder,
              #lia-course-chat-input::placeholder {
                 color: #64748B !important;
                 -webkit-text-fill-color: #64748B !important;
              }
              .lia-header-title {
                 color: #0F172A !important;
              }
            ` : ''}
          `}</style>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function CourseLia(props: CourseLiaProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <CourseLiaPanelContent {...props} />
      <CourseLiaFloatingButton />
    </>,
    document.body
  );
}
