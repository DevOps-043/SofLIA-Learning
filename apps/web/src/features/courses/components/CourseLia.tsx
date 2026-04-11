'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Square, Trash2, Copy, StickyNote, Check, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TourRestartButton } from '../../../core/components/tours/TourRestartButton';
import { SHARED_TOUR_TARGET_IDS } from '../../../core/constants/tourTargets';
import { useThemeStore } from '../../../core/stores/themeStore';
import { useLiaCourse } from '../context/LiaCourseContext';
import { useLiaCourseChat } from '../../../core/hooks/useLiaCourseChat';
import type { CourseLessonContext } from '../../../core/types/lia.types';
import type { LiaImageAttachment } from '../../../core/reporting/report-problem.contract';
import {
  REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES,
} from '../../../core/reporting/report-problem.contract';
import { buildLiaImageAttachment } from '../../../core/reporting/report-problem.client';
import { copyTextToClipboard } from '../../../lib/clipboard';

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
const NAVBAR_HEIGHT = 58; // Ajuste final milimétrico para cubrir totalmente el borde
const MOBILE_BOTTOM_NAV_HEIGHT = 104; // Altura de la barra de navegación inferior móvil (70px base + safe-area)

function parseMarkdownContent(text: string, onLinkClick: (url: string) => void, isDarkMode: boolean = true): React.ReactNode {
  let keyIndex = 0;
  let processedText = text.replace(/^\*\s+/gm, '- ');
  const lines = processedText.split('\n');
  
  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) { // Link
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(e) => { e.preventDefault(); onLinkClick(linkUrl); }}
            style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
          >
            {linkText}
          </a>
        );
      } else if (match[4]) { // Bold
        elements.push(<strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>{match[5]}</strong>);
      } else if (match[6]) { // Italic
        elements.push(<em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>{match[7]}</em>);
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
      {!isOpen ? (
        <div className="hidden md:block">
          <TourRestartButton
            anchor={{
              bottom: COURSE_LIA_BUTTON_BOTTOM_PX,
              right: COURSE_LIA_BUTTON_RIGHT_PX,
              size: COURSE_LIA_BUTTON_SIZE_PX,
            }}
          />
        </div>
      ) : null}

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
                src="/lia-avatar.png"
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

  const themeColors = {
    panelBg: customColors?.panelBg || (isLightTheme ? '#FFFFFF' : '#0a0f14'),
    headerBg: customColors?.panelBg || (isLightTheme ? '#F8FAFC' : '#0a0f14'),
    borderColor: customColors?.borderColor || (isLightTheme ? '#E2E8F0' : '#1e2a35'),
    // Si es custom theme, forzar burbuja asistente oscura/transparente
    messageBubbleAssistant: isCustomTheme ? 'rgba(255,255,255,0.1)' : (isLightTheme ? '#F1F5F9' : '#1e2a35'),
    messageBubbleUser: '#0A2540',
    textPrimary: customColors?.textPrimary || (isLightTheme ? '#1E293B' : '#e5e7eb'),
    textSecondary: customColors?.textSecondary || (isLightTheme ? '#64748B' : '#6b7280'),
    // Si es custom theme, forzar input oscuro
    inputBg: isCustomTheme ? (isLightTheme ? '#F1F5F9' : 'rgba(0,0,0,0.3)') : (isLightTheme ? '#F1F5F9' : 'rgba(255,255,255,0.05)'),
    inputBorder: customColors?.borderColor ? 'transparent' : (isLightTheme ? '#CBD5E1' : '#374151'),
    accentColor: customColors?.accentColor || '#00D4B3',
    primaryAction: customColors?.accentColor || '#0A2540',
  };

  const initialMessage = null;

  const liaChat = useLiaCourseChat(initialMessage);
  const { messages, isLoading, sendMessage, stop, clearHistory } = liaChat;

  // Registrar esta instancia en el contexto para acceso global (modales, etc.)
  useEffect(() => {
    registerLiaChat(liaChat);
    return () => registerLiaChat(null);
  }, [liaChat, registerLiaChat]);

  useEffect(() => {
    setCourseContext(resolvedLessonContext || null);
    return () => setCourseContext(null);
  }, [resolvedLessonContext, setCourseContext]);
  
  const [inputValue, setInputValue] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<LiaImageAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [forceDarkText, setForceDarkText] = useState(false);

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

  const handleLinkClick = useCallback((url: string) => {
    if (url.startsWith('/')) {
      // closeLia(); // Opcional: cerrar al navegar
      router.push(url);
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
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
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAttachment(null);
      setAttachmentError(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
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

  const handleAttachmentSelect = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAttachmentError('Solo puedes adjuntar imágenes.');
      event.target.value = '';
      return;
    }

    if (file.size > REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES) {
      setAttachmentError('La imagen es demasiado grande. Máximo 10MB.');
      event.target.value = '';
      return;
    }

    try {
      const attachment = await buildLiaImageAttachment(file);
      setSelectedAttachment(attachment);
      setAttachmentError(null);
    } catch (error) {
      setAttachmentError(
        error instanceof Error
          ? error.message
          : 'No se pudo procesar la imagen seleccionada.'
      );
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleRemoveAttachment = useCallback(() => {
    setSelectedAttachment(null);
    setAttachmentError(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, []);

  const handleAttachmentButtonClick = useCallback(() => {
    attachmentInputRef.current?.click();
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && !selectedAttachment) || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    const attachmentToSend = selectedAttachment;
    setSelectedAttachment(null);
    setAttachmentError(null);
    
    // Construir contexto del curso
    await sendMessage(
      message,
      resolvedLessonContext,
      undefined,
      false,
      attachmentToSend ? [attachmentToSend] : []
    );
  }, [inputValue, isLoading, resolvedLessonContext, selectedAttachment, sendMessage]);

  const handlePrimaryAction = useCallback(() => {
    if (isLoading) {
      stop();
      return;
    }

    void handleSendMessage();
  }, [handleSendMessage, isLoading, stop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    const wasCopied = await copyTextToClipboard(content);

    if (!wasCopied) {
      alert('No se pudo copiar el mensaje');
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
    ? `calc(100vh - ${NAVBAR_HEIGHT}px - ${MOBILE_BOTTOM_NAV_HEIGHT}px)` 
    : `calc(100vh - ${NAVBAR_HEIGHT}px)`;
  const animationInitial = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { x: 0 };
  const animationExit = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };
  const canSendMessage = Boolean(isLoading || inputValue.trim() || selectedAttachment);

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
                <img src="/lia-avatar.png" alt="SofLIA" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.accentColor}` }} />
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
            {messages.map((message) => (
              <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', backgroundColor: message.role === 'user' ? '#0A2540' : themeColors.messageBubbleAssistant }}>
                  <p className={message.role === 'user' ? 'lia-msg-user-text' : 'lia-msg-assistant-text'} style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {message.role === 'assistant' ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode) : message.content}
                  </p>
                  {message.attachments?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {message.attachments.map((attachment, attachmentIndex) => (
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
                            // Parsear markdown básico a HTML para el WYSIWYG de Notas
                            const htmlContent = message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\n/g, '<br/>');
                            
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
            ))}
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
                   <img src="/lia-avatar.png" alt="Escribiendo..." style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {/* Input */}
          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => void handleAttachmentSelect(event)}
              style={{ display: 'none' }}
            />
            {selectedAttachment ? (
              <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '16px', backgroundColor: isLightTheme ? '#F8FAFC' : 'rgba(255,255,255,0.04)', border: `1px solid ${themeColors.borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img
                  src={selectedAttachment.dataUrl}
                  alt={selectedAttachment.fileName}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: themeColors.textPrimary, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedAttachment.fileName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{ width: '30px', height: '30px', borderRadius: '999px', border: 'none', background: isLightTheme ? '#E2E8F0' : '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLightTheme ? '#475569' : '#CBD5E1' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            ) : null}
            {attachmentError ? (
              <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.12)', color: isLightTheme ? '#B91C1C' : '#FCA5A5', fontSize: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                {attachmentError}
              </div>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: themeColors.inputBg, borderRadius: '24px', padding: '10px 16px', border: `1px solid ${themeColors.inputBorder}` }}>
               <button
                 type="button"
                 onClick={handleAttachmentButtonClick}
                 title="Adjuntar imagen"
                 style={{ width: '36px', height: '36px', borderRadius: '999px', border: 'none', backgroundColor: selectedAttachment ? 'rgba(0,212,179,0.12)' : 'transparent', color: selectedAttachment ? themeColors.accentColor : themeColors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
               >
                 <Paperclip style={{ width: '16px', height: '16px' }} />
               </button>
               <input
                 ref={inputRef}
                 type="text"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder={'Pregunta sobre la lección...'}
                 style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: themeColors.textPrimary, fontSize: '14px' }}
                 id="lia-course-chat-input"
                 className="lia-input-reset lia-chat-input"
               />
               <button 
                 onClick={handlePrimaryAction}
                 disabled={!canSendMessage}
                 title={isLoading ? 'Detener generacion de SofLIA' : 'Enviar mensaje'}
                 aria-label={isLoading ? 'Detener generacion de SofLIA' : 'Enviar mensaje'}
                 style={{ 
                   minWidth: isLoading ? '112px' : '44px', 
                   height: '44px', 
                   padding: isLoading ? '0 14px' : '0',
                   borderRadius: isLoading ? '16px' : '50%', 
                   backgroundColor: isLoading
                     ? (isLightTheme ? '#DC2626' : '#EF4444')
                     : canSendMessage ? themeColors.primaryAction : (isLightTheme ? '#CBD5E1' : '#374151'), 
                   border: 'none', 
                   cursor: canSendMessage ? 'pointer' : 'not-allowed', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   gap: isLoading ? '8px' : '0',
                   transition: 'all 180ms ease'
                 }}
               >
                 {isLoading ? (
                   <>
                     <Square style={{ width: '15px', height: '15px', color: '#FFFFFF', fill: '#FFFFFF' }} />
                     <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, lineHeight: 1 }}>
                       Detener
                     </span>
                   </>
                 ) : (
                   <Send style={{ 
                     width: '16px', 
                     height: '16px', 
                     color: canSendMessage
                       ? (isLightTheme ? '#FFFFFF' : '#0A2540') 
                       : (isLightTheme ? '#6B7280' : '#4B5563')
                   }} />
                 )}
               </button>
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
