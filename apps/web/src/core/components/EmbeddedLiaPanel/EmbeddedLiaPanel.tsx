'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Mic, MicOff, Send, X, Loader2, User, ChevronDown, Check, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useLiaChat } from '../../hooks/useLiaChat';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useLanguage } from '../../providers/I18nProvider';
import { useOrganizationStylesContext } from '../../../features/business-panel/contexts/OrganizationStylesContext';
import { useLiaPanel } from '../../contexts/LiaPanelContext';
import type { LiaChatMode } from '../../hooks/useLiaChat';

// Función helper para renderizar texto con enlaces (soporta Markdown y URLs directas)
function renderTextWithLinks(text: string, router: ReturnType<typeof useRouter>): React.ReactNode {
  if (!text) return text;

  // Regex para detectar enlaces Markdown: [texto](url)
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Agregar texto antes del enlace
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    // Agregar el enlace como elemento <a>
    const linkText = match[1];
    const linkUrl = match[2];

    // Verificar si es una URL relativa (empieza con /) o absoluta
    const isRelative = linkUrl.startsWith('/');

    parts.push(
      <a
        key={`link-${key++}`}
        href={linkUrl}
        onClick={(e) => {
          if (isRelative) {
            e.preventDefault();
            // Usar el router para navegación interna
            router.push(linkUrl);
          }
          // Si es URL absoluta, dejar que el navegador maneje el enlace
        }}
        className="text-[#00D4B3] dark:text-[#00D4B3] hover:text-[#00b89a] dark:hover:text-[#00b89a] underline font-medium transition-colors"
        {...(!isRelative && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {linkText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Agregar texto restante después del último enlace
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Si no hay enlaces, retornar el texto original
  return parts.length > 0 ? parts : text;
}

interface OrganizationColors {
  primary?: string;
  accent?: string;
  cardBackground?: string;
  textColor?: string;
}

interface EmbeddedLiaPanelProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string | null;
  organizationColors?: OrganizationColors;
}

export function EmbeddedLiaPanel({
  assistantName = 'SofLIA',
  assistantAvatar = '/lia-avatar.png',
  initialMessage = null,
  organizationColors,
}: EmbeddedLiaPanelProps) {
  const { styles } = useOrganizationStylesContext();
  const themeStyles = styles?.panel;

  // Colores con prioridad: Tema Global > Props > Defaults SOFLIA
  const colors = {
    primary: themeStyles?.accent_color || organizationColors?.primary || '#00D4B3', // Lia = Aqua
    accent: themeStyles?.secondary_button_color || organizationColors?.accent || '#6C757D', // User = Neutral
    cardBg: themeStyles?.card_background || organizationColors?.cardBackground || '#1E2329', // Card/Panel BG
    text: themeStyles?.text_color || organizationColors?.textColor || '#FFFFFF',
  };
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();

  // Detectar qué navbar está activo para ajustar el padding-top del header
  const getNavbarHeight = () => {
    if (!pathname) return '4rem'; // 64px por defecto

    // DashboardNavbar y BusinessNavbar: h-20 (80px = 5rem)
    const isDashboardPage = pathname.startsWith('/dashboard') ||
      pathname.startsWith('/my-courses') ||
      pathname.startsWith('/courses') ||
      pathname.startsWith('/communities') ||
      pathname.startsWith('/news') ||
      pathname.startsWith('/statistics') ||
      pathname.startsWith('/questionnaire') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/subscriptions') ||
      pathname.startsWith('/payment-methods') ||
      pathname.startsWith('/purchase-history') ||
      pathname.startsWith('/account-settings') ||
      pathname.startsWith('/certificates');

    const isBusinessPage = pathname.startsWith('/business');

    if (isDashboardPage || isBusinessPage) {
      return '5rem'; // 80px para DashboardNavbar y BusinessNavbar
    }

    // Navbar regular: h-16 en móvil, h-20 en desktop
    // Usamos 5rem (80px) para cubrir ambos casos
    return '5rem'; // 80px
  };

  const navbarHeight = getNavbarHeight();

  // Usar el contexto para sincronizar el estado del panel
  const { isPanelOpen, setIsPanelOpen, isCollapsed, setIsCollapsed } = useLiaPanel();
  const panelRef = useRef<HTMLDivElement>(null);

  // Estados para el input de mensaje
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook de LIA para manejar mensajes
  const {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    currentConversationId,
    currentMode,
    setMode,
  } = useLiaChat(initialMessage);

  // Ref para reconocimiento de voz
  const recognitionRef = useRef<any>(null);

  // Estado para el dropdown de modos
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);

  // Modos disponibles del agente
  const availableModes: Array<{
    id: LiaChatMode;
    name: string;
    description: string;
    icon: React.ElementType | null;
    color: string;
  }> = [
      {
        id: 'context',
        name: 'PRL-1.0 Mini',
        description: 'Tu asistente inteligente con contexto de página. Resuelve dudas, explica conceptos y te guía en tu aprendizaje.',
        icon: null, // Usaremos el avatar de LIA en lugar de un icono
        color: colors.accent,
      },
    ];

  // Calcular posición del dropdown cuando se abre
  useEffect(() => {
    if (isModeDropdownOpen && modeButtonRef.current) {
      const rect = modeButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isModeDropdownOpen]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(event.target as Node) &&
        modeButtonRef.current &&
        !modeButtonRef.current.contains(event.target as Node)
      ) {
        setIsModeDropdownOpen(false);
      }
    };

    if (isModeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModeDropdownOpen]);

  // Ancho del panel (siempre panel lateral, no fullscreen) - Reducido para menos intrusividad
  const expandedWidth = 'w-[85vw] sm:w-[360px] max-w-[360px]';


  // Scroll automático al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current && isPanelOpen && !isCollapsed) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPanelOpen, isCollapsed]);

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 60)}px`;
    }
  }, [message]);

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const messageToSend = message.trim();
    setMessage('');

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  // Manejar reconocimiento de voz
  const toggleRecording = () => {
    if (typeof window === 'undefined') return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsRecording(false);
        recognitionRef.current.stop();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setIsRecording(false);
        recognitionRef.current.stop();
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Limpiar reconocimiento al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <>
      {/* Overlay semi-transparente (para cerrar al hacer clic fuera) - Sin blur para mejor rendimiento */}
      <AnimatePresence>
        {isPanelOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/10 dark:bg-black/20 z-30"
          />
        )}
      </AnimatePresence>

      {/* Panel Derecho - PRL-1.0 Mini (solo cuando está expandido) */}
      <AnimatePresence>
        {isPanelOpen && !isCollapsed && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed right-0 top-0 h-full z-40 shadow-2xl flex flex-col ${expandedWidth} transition-all duration-300 ease-in-out`}
            style={{
              backgroundColor: colors.cardBg,
              borderLeft: `1px solid ${colors.primary}20`
            }}
          >
            {/* Fondo superior para cubrir el área del navbar */}
            <div
              className="absolute left-0 right-0 top-0"
              style={{
                height: navbarHeight,
                backgroundColor: colors.cardBg
              }}
            />

            {/* Header del Panel de LIA - Rediseñado */}
            <div
              className="absolute left-0 right-0 z-[60] px-3 pb-2"
              style={{ top: navbarHeight, paddingTop: '0.75rem' }}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="backdrop-blur-md rounded-2xl shadow-lg"
                style={{
                  backgroundColor: `${colors.cardBg}F5`,
                  border: `1px solid ${colors.primary}30`
                }}
              >
                {/* Primera fila: Avatar, título (clickeable) y botones */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="relative flex-1 min-w-0">
                    <button
                      ref={modeButtonRef}
                      onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors group"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}15`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Avatar de LIA */}
                      <div
                        className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                        style={{ boxShadow: `0 0 0 2px ${colors.accent}50` }}
                      >
                        <Image
                          src={assistantAvatar}
                          alt={assistantName}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                      {/* Título y modo */}
                      <div className="min-w-0 flex-1 text-left">
                        <h3
                          className="font-semibold text-xs leading-tight"
                          style={{ color: colors.text }}
                        >
                          {assistantName}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const currentModeData = availableModes.find(m => m.id === currentMode);
                            const Icon = currentModeData?.icon || MessageSquare;
                            return (
                              <>
                                <Icon
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ color: currentModeData?.color }}
                                />
                                <span
                                  className="text-[10px] leading-tight truncate"
                                  style={{ color: `${colors.text}80` }}
                                >
                                  {currentModeData?.name || 'PRL-1.0 Mini'}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${isModeDropdownOpen ? 'rotate-180' : ''}`}
                        style={{ color: `${colors.text}80` }}
                      />
                    </button>

                  </div>
                  {/* Botones de acción */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button
                      onClick={() => {
                        clearHistory();
                      }}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{
                        color: `${colors.text}80`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primary}15`;
                        e.currentTarget.style.color = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = `${colors.text}80`;
                      }}
                      title="Limpiar conversación"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{
                        color: `${colors.text}80`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primary}15`;
                        e.currentTarget.style.color = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = `${colors.text}80`;
                      }}
                      title="Colapsar"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Dropdown de modos estilo ChatGPT - Renderizado fuera del contenedor del header */}
            <AnimatePresence>
              {isModeDropdownOpen && (
                <>
                  {/* Overlay para cerrar al hacer clic fuera */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsModeDropdownOpen(false)}
                    className="fixed inset-0 z-[55]"
                  />
                  <motion.div
                    ref={modeDropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                      backgroundColor: colors.cardBg,
                      border: `1px solid ${colors.primary}30`,
                    }}
                    className="rounded-xl shadow-2xl overflow-hidden z-[60]"
                  >
                    {availableModes.map((mode) => {
                      const isActive = currentMode === mode.id;

                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setMode(mode.id);
                            setIsModeDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-3 text-xs transition-colors flex items-start gap-3"
                          style={{
                            backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Avatar de LIA en lugar de icono */}
                            <div
                              className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                              style={{ boxShadow: `0 0 0 2px ${colors.accent}50` }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={assistantAvatar || '/lia-avatar.png'}
                                alt={assistantName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/lia-avatar.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-semibold mb-0.5"
                                style={{ color: colors.text }}
                              >
                                {mode.name}
                              </div>
                              <div
                                className="text-[10px] leading-tight"
                                style={{ color: `${colors.text}70` }}
                              >
                                {mode.description}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Contenido del Panel de LIA - Chat */}
            <div
              className="flex-1 overflow-hidden flex flex-col"
              style={{
                paddingTop: `calc(${navbarHeight} + 5rem)`,
                backgroundColor: colors.cardBg
              }}
            >
              {/* Ãrea de mensajes de LIA */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative">
                {/* Fondo informativo del modo cuando no hay mensajes */}
                {messages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
                    <div className="max-w-sm text-center">
                      {/* Avatar de LIA grande */}
                      <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center">
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundColor: `${colors.accent}15`,
                            border: `3px solid ${colors.accent}`,
                            boxShadow: `0 0 40px ${colors.accent}40, 0 0 80px ${colors.accent}20`
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={assistantAvatar || '/lia-avatar.png'}
                            alt={assistantName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback si la imagen no carga
                              e.currentTarget.src = '/lia-avatar.png';
                            }}
                          />
                        </div>
                      </div>
                      {/* Título del modo */}
                      <h3
                        className="font-bold mb-2 text-xl"
                        style={{ color: colors.text }}
                      >
                        {availableModes.find(m => m.id === currentMode)?.name || 'PRL-1.0 Mini'}
                      </h3>
                      {/* Descripción del modo */}
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: `${colors.text}80` }}
                      >
                        {availableModes.find(m => m.id === currentMode)?.description || 'Tu asistente inteligente con contexto de página. Resuelve dudas, explica conceptos y te guía en tu aprendizaje.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensajes del chat */}
                {messages.length > 0 && (
                  <>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar del mensaje */}
                        {msg.role === 'user' ? (
                          <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 border-[#10B981] relative">
                            {user?.profile_picture_url ? (
                              <Image
                                src={user.profile_picture_url}
                                alt={user.display_name || user.username || 'Usuario'}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                              >
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0A2540]/20 dark:ring-[#00D4B3]/30 relative">
                            <Image
                              src={assistantAvatar}
                              alt={assistantName}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                        )}

                        {/* Contenido del mensaje */}
                        <div
                          className="flex-1 rounded-2xl px-3.5 py-3 shadow-lg"
                          style={{
                            backgroundColor: msg.role === 'user' ? colors.accent : colors.primary,
                            color: '#FFFFFF'
                          }}
                        >
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                            {renderTextWithLinks(msg.content, router)}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Indicador de escritura */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2 items-center"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0A2540]/20 dark:ring-[#00D4B3]/30 relative">
                          <Image
                            src={assistantAvatar}
                            alt={assistantName}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                        <div className="bg-[#0A2540] dark:bg-[#0A2540] rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <motion.div
                              className="w-2 h-2 bg-white rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-white rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-white rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de input flotante estilo Telegram */}
              <div className="px-3 pb-3 pt-2 bg-transparent">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  {/* Campo de texto */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (messageInputRef.current) {
                          messageInputRef.current.style.height = 'auto';
                          messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 60)}px`;
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            handleSendMessage();
                          }
                        }
                      }}
                      placeholder="Escribe tu pregunta..."
                      rows={1}
                      disabled={isLoading}
                      className="w-full resize-none rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md min-h-[44px] text-sm font-normal focus:outline-none transition-all duration-200 max-h-[60px] overflow-y-auto leading-5"
                      style={{
                        minHeight: '44px',
                        lineHeight: '20px',
                        fontFamily: 'Inter, sans-serif',
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.primary}30`,
                        color: colors.text,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}50`;
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = `${colors.primary}30`;
                      }}
                    />
                  </div>

                  {/* Botón de micrófono/enviar */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (message.trim()) {
                        handleSendMessage();
                      } else {
                        toggleRecording();
                      }
                    }}
                    disabled={isLoading && !!message.trim()}
                    className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${isLoading && message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      backgroundColor: message.trim()
                        ? colors.primary
                        : isRecording
                          ? '#EF4444'
                          : 'rgba(255, 255, 255, 0.05)', // Fondo sutil oscuro por defecto
                      color: message.trim() || isRecording ? '#FFFFFF' : colors.primary
                    }}
                    title={message.trim() ? 'Enviar mensaje' : isRecording ? 'Detener grabación' : 'Grabar audio'}
                  >
                    {isLoading && message.trim() ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : message.trim() ? (
                      <Send className="w-5 h-5" />
                    ) : isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burbuja flotante de LIA (cuando está colapsado o cerrado) */}
      <AnimatePresence>
        {(isCollapsed || !isPanelOpen) && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => {
              setIsPanelOpen(true);
              setIsCollapsed(false);
            }}
            className="fixed right-4 bottom-4 z-[100] w-16 h-16 rounded-full shadow-2xl hover:shadow-[#0A2540]/50 dark:hover:shadow-[#00D4B3]/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group overflow-hidden ring-4 ring-[#0A2540]/20 dark:ring-[#00D4B3]/30"
            title={`Abrir ${assistantName}`}
          >
            {/* Avatar de LIA en la burbuja */}
            <div className="relative w-full h-full">
              <Image
                src={assistantAvatar}
                alt={assistantName}
                fill
                className="object-cover group-hover:scale-110 transition-transform"
                sizes="64px"
              />
            </div>
            {/* Indicador de notificación (solo si hay mensajes) */}
            {messages.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-full h-full bg-red-500 rounded-full"
                />
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

