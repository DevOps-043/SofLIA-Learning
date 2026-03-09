'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, Lightbulb, HelpCircle, Trash2, Clock, Edit2, Check, MoreVertical, Settings, Mic, MicOff, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';
import { useLiaGeneralChat } from '../../hooks/useLiaGeneralChat';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '../../../features/business-panel/contexts/OrganizationStylesContext';
import { useThemeStore } from '../../../core/stores/themeStore';
import { useTranslation } from 'react-i18next';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSofLIAPersonalization } from '../../hooks/useSofLIAPersonalization';
import { useLanguage } from '../../providers/I18nProvider';

// Función para parsear Markdown completo y convertirlo a elementos React
function parseMarkdownContent(text: string, onLinkClick: (url: string) => void, isDarkMode: boolean = false): React.ReactNode {
  let keyIndex = 0;
  
  // Primero convertir listas con asterisco a guiones
  let processedText = text.replace(/^\*\s+/gm, '- ');
  
  // Dividir por líneas para procesar cada una
  const lines = processedText.split('\n');
  
  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';
  
  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    
    // Regex combinado para encontrar negritas, cursivas y enlaces
    // Orden: enlaces primero, luego negritas, luego cursivas
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = inlineRegex.exec(line)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Es un enlace [texto](url)
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              onLinkClick(linkUrl);
            }}
            style={{
              color: linkColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {linkText}
          </a>
        );
      } else if (match[4]) {
        // Es negrita **texto**
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[5]}
          </strong>
        );
      } else if (match[6]) {
        // Es cursiva *texto*
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[7]}
          </em>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Texto después del último match
    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }
    
    return elements.length > 0 ? elements : [line];
  };
  
  // Procesar cada línea y agregar saltos de línea
  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });
  
  return <>{result}</>;
}

// Altura del navbar (AdminHeader = 64px / h-16, DashboardNavbar = ~80px)
// Usamos 64px como valor base para el admin panel
const NAVBAR_HEIGHT = 64;
const PANEL_WIDTH = 420; // Mismo ancho que ARIA en IRIS

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

// Variable global para persistir el scroll
let liaPanelScrollTop = -1;

function LiaSidePanelContent() {
  const { t } = useTranslation('common');
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Obtener estilos de la organización para modo claro/oscuro
  const orgContext = useOrganizationStylesContext();
  const orgStyles = orgContext?.styles;

  // Determinar si estamos en el dashboard de usuario o planner
  const isUserDashboard = pathname?.includes('/business-user') || pathname?.includes('/study-planner') || pathname === '/dashboard';
  
  // Seleccionar los estilos activos según la ruta
  const effectiveStyles = isUserDashboard 
    ? (orgStyles?.userDashboard || orgStyles?.panel) 
    : orgStyles?.panel;
  
  // Determinar si es tema claro
  const isLightTheme = !isDarkMode;
  
  // Colores dinámicos basados en el tema
  const themeColors = {
    panelBg: isLightTheme ? '#FFFFFF' : (effectiveStyles?.sidebar_background || '#0a0f14'),
    headerBg: isLightTheme ? '#F8FAFC' : (effectiveStyles?.sidebar_background || '#0a0f14'),
    borderColor: isLightTheme ? '#E2E8F0' : (effectiveStyles?.border_color || '#1e2a35'),
    messageBubbleAssistant: isLightTheme ? '#F1F5F9' : (effectiveStyles?.card_background || '#1e2a35'),
    messageBubbleUser: effectiveStyles?.primary_button_color || '#0A2540',
    // Forzar texto oscuro en modo claro, ignorando el tema de la organización si este es 'SOFLIA-predeterminado' (oscuro)
    textPrimary: isLightTheme ? '#1E293B' : (effectiveStyles?.text_color || '#e5e7eb'),
    textSecondary: isLightTheme ? '#64748B' : '#6b7280',
    inputBg: isLightTheme ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
    inputBorder: isLightTheme ? '#CBD5E1' : (effectiveStyles?.border_color || '#374151'),
    accentColor: '#00D4B3', // Siempre usar Aqua para identidad de LIA
  };
  
  const { messages, isLoading, sendMessage, clearHistory, loadConversation, currentConversationId } = useLiaGeneralChat();
  
  // ðŸŽ™ï¸ Configuración de personalización de LIA para voz
  const { settings: liaSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = liaSettings?.voice_enabled ?? true; // Por defecto activado
  const isDictationEnabled = liaSettings?.dictation_enabled ?? false; // Por defecto desactivado
  const { language } = useLanguage();
  
  // ðŸŽ™ï¸ Estados y refs para síntesis de voz
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  
  // ðŸŽ™ï¸ Mapeo de idiomas para reconocimiento de voz
  const speechLanguageMap: Record<string, string> = {
    'es': 'es-ES',
    'en': 'en-US',
    'pt': 'pt-BR'
  };
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // ðŸŽ™ï¸ Estados para dictado
  const [isDictating, setIsDictating] = useState(false);
  const [isProcessingDictation, setIsProcessingDictation] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState(''); // Texto temporal mientras se habla
  const [finalTranscript, setFinalTranscript] = useState(''); // Texto final confirmado
  const recognitionRef = useRef<any>(null); // Web Speech API Recognition
  const isDictatingRef = useRef<boolean>(false); // Ref para verificar estado actual en callbacks
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout para detectar silencio
  const lastTranscriptTimeRef = useRef<number>(0); // Timestamp del último texto detectado
  const dictationTextToApplyRef = useRef<string>(''); // Ref para almacenar texto a aplicar al finalizar dictado
  const [currentTip, setCurrentTip] = useState('');
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de opciones al hacer clic fuera
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

  // History State
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

  const loadHistory = useCallback(async (page: number = 0) => {
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
          // Si no hay información de paginación, asumir que no hay más
          setTotalConversations(data.conversations.length);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (showHistory) {
      loadHistory(currentPage);
    }
  }, [showHistory, currentPage, loadHistory]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const closeHistory = useCallback(() => {
    setShowHistory(false);
    setCurrentPage(0); // Resetear página al cerrar historial
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
            body: JSON.stringify({ conversationId: convId, title: editingTitle })
        });
        
        if (response.ok) {
            setHistoryList(prev => prev.map(c => 
                c.conversation_id === convId ? { ...c, conversation_title: editingTitle } : c
            ));
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
      title: conv.conversation_title || new Date(conv.started_at).toLocaleDateString()
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
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Remover de la lista local
        setHistoryList(prev => prev.filter(c => c.conversation_id !== conversationToDelete.id));
        
        // Si la conversación eliminada es la actual, limpiar el chat
        if (currentConversationId === conversationToDelete.id) {
          clearHistory();
        }
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

  const quickActions: QuickAction[] = [
    {
      id: 'capabilities',
      label: t('lia.quickActions.capabilities'),
      icon: HelpCircle,
      prompt: t('lia.quickActions.capabilities')
    },
    {
      id: 'courses',
      label: t('lia.quickActions.courses'),
      icon: MessageSquare,
      prompt: t('lia.quickActions.courses')
    },
    {
      id: 'recommend',
      label: t('lia.quickActions.recommend'),
      icon: Lightbulb,
      prompt: t('lia.quickActions.recommend')
    },
    {
      id: 'help',
      label: t('lia.quickActions.help'),
      icon: Sparkles,
      prompt: t('lia.quickActions.help')
    }
  ];

  // Cast tips to string array just to be safe with unknown return type of returnObjects
  const tips = (t('lia.tips', { returnObjects: true }) as string[]) || [];

  // Seleccionar tip aleatorio al abrir el panel
  useEffect(() => {
    if (isOpen && tips.length > 0) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
    }
  }, [isOpen, t]); // Re-run if language changes (t changes)

  // Función para manejar clicks en enlaces del chat
  const handleLinkClick = useCallback((url: string) => {
    // Si es una URL interna (comienza con /), navegar con router
    if (url.startsWith('/')) {
      closePanel();
      router.push(url);
    } else if (url.startsWith('http')) {
      // Si es una URL externa, abrir en nueva pestaña
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [router, closePanel]);

  // Scroll Logic: Restore position on open, sticky scroll on new messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !isOpen) return;

    // Si acabamos de abrir el panel
    // Usamos setTimeout para asegurar que el layout esté listo
    const timer = setTimeout(() => {
        // Si tenemos una posición guardada, restaurarla
        if (liaPanelScrollTop !== -1) {
            container.scrollTop = liaPanelScrollTop;
        } else {
            // Si es la primera vez, ir al fondo
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Efecto para auto-scroll cuando llegan mensajes nuevos (solo si estamos abajo)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Si no hay posición guardada (primera carga) o estamos cerca del fondo, hacer scroll
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // Umbral de 150px para considerar que está "abajo"
    const isNearBottom = scrollBottom < 150;
    
    // Si el último mensaje es del usuario, siempre scroll
    const lastMsg = messages[messages.length - 1];
    const isUserMsg = lastMsg?.role === 'user';

    // Hacer scroll si estamos abajo, es mensaje del usuario, o es la primera vez (-1)
    if (isNearBottom || isUserMsg || liaPanelScrollTop === -1) {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // ðŸŽ™ï¸ Función para limpiar texto antes de leerlo (eliminar markdown, enlaces, etc.)
  const cleanTextForTTS = useCallback((text: string): string => {
    if (!text) return text;

    let cleaned = text;

    // Eliminar bloques de código (```código```)
    cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, '');
    
    // Eliminar títulos Markdown (# ## ###)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Eliminar negritas (**texto** o __texto__)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    
    // Eliminar cursivas (*texto* o _texto_)
    cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
    cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
    
    // Eliminar código en línea (`código`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Eliminar enlaces [texto](url) - reemplazar solo con el texto
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Eliminar imágenes ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
    
    // Eliminar bloques de citas (>)
    cleaned = cleaned.replace(/^>\s+/gm, '');
    
    // Eliminar líneas horizontales (--- o ***)
    cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
    
    // Limpiar espacios múltiples y saltos de línea excesivos
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    // Limpiar espacios al inicio y final
    cleaned = cleaned.trim();
    
    return cleaned;
  }, []);

  // ðŸŽ™ï¸ Función para detener todo audio/voz en reproducción
  const stopAllAudio = useCallback(() => {
    try {
      // Abort any in-flight TTS fetch
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort(); } catch (e) { /* ignore */ }
        ttsAbortRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Cancelar cualquier utterance en curso
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }

      setIsSpeaking(false);
    } catch (err) {
      console.warn('Error deteniendo audio:', err);
    }
  }, []);

  // ðŸŽ™ï¸ Función para síntesis de voz con ElevenLabs
  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') {
      console.log('ðŸ”‡ [TTS] Voz deshabilitada o no disponible en el navegador', { isVoiceEnabled, isWindow: typeof window !== 'undefined' });
      return;
    }

    // Limpiar el texto antes de leerlo
    const cleanedText = cleanTextForTTS(text);
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      console.log('ðŸ”‡ [TTS] Texto vacío después de limpiar');
      return;
    }

    console.log('ðŸ”Š [TTS] Iniciando lectura de texto:', { 
      originalLength: text.length, 
      cleanedLength: cleanedText.length,
      preview: cleanedText.substring(0, 100) + '...'
    });

    // Asegurar que no haya audio superpuesto
    stopAllAudio();

    try {
      setIsSpeaking(true);

      const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'ay4iqk10DLwc8KGSrf2t';
      const modelId = 'eleven_turbo_v2_5';

      if (!apiKey || !voiceId) {
        console.warn('âš ï¸ ElevenLabs credentials not found, using fallback Web Speech API');
        
        // Fallback a Web Speech API
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = speechLanguageMap[language] || 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      }

      // Setup abort controller so we can cancel in-flight TTS requests
      const controller = new AbortController();
      ttsAbortRef.current = controller;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: cleanedText,
            model_id: modelId,
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.65,
              style: 0.3,
              use_speaker_boost: false
            },
            optimize_streaming_latency: 4,
            output_format: 'mp3_22050_32'
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      // If the request was aborted, do not proceed
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

      // Intentar reproducir el audio
      try {
        await audio.play();
        console.log('✅ [TTS] Audio reproducido exitosamente');
        // Playback started successfully; clear abort controller
        if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
      } catch (playError: any) {
        // Autoplay bloqueado por el navegador - esto es normal y esperado
        console.warn('âš ï¸ [TTS] Error al reproducir audio (puede ser bloqueo de autoplay):', playError);
        setIsSpeaking(false);
      }
    } catch (error: any) {
      // Si la petición fue abortada, lo manejamos como info
      if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        // Silenciar errores de abort
      } else {
        console.error('Error en síntesis de voz con ElevenLabs:', error);
      }
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, language, stopAllAudio, cleanTextForTTS]);

  // ðŸŽ™ï¸ Detectar cuando llega un nuevo mensaje del asistente y leerlo
  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0 || isLoading) return;

    // Buscar el último mensaje del asistente que no haya sido leído
    const lastAssistantMessage = [...messages].reverse().find(
      msg => msg.role === 'assistant' && msg.id !== lastReadMessageIdRef.current && msg.content.trim().length > 0
    );

    if (lastAssistantMessage) {
      // Esperar un poco para que el mensaje termine de renderizarse (especialmente si es streaming)
      const timer = setTimeout(() => {
        console.log('ðŸ”Š [TTS] Nuevo mensaje del asistente detectado, leyendo...', {
          messageId: lastAssistantMessage.id,
          contentLength: lastAssistantMessage.content.length,
          preview: lastAssistantMessage.content.substring(0, 50) + '...'
        });
        
        speakText(lastAssistantMessage.content);
        lastReadMessageIdRef.current = lastAssistantMessage.id;
      }, 1000); // Esperar 1 segundo para que termine el streaming

      return () => clearTimeout(timer);
    }
  }, [messages, isVoiceEnabled, isLoading, speakText]);

  // Limpiar audio al desmontar o cerrar el panel
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, stopAllAudio]);

  // ðŸŽ™ï¸ Función para detener dictado y limpiar recursos
  const stopDictation = useCallback(() => {
    // IMPORTANTE: Capturar el texto ANTES de cambiar isDictating y limpiar estados
    // Esto evita que el input muestre el texto duplicado
    setFinalTranscript(currentFinal => {
      setInterimTranscript(currentInterim => {
        // Guardar el texto en el ref antes de limpiar
        const fullText = (currentFinal + ' ' + currentInterim).trim();
        dictationTextToApplyRef.current = fullText;
        
        // Limpiar estados INMEDIATAMENTE para evitar duplicación en el render
        return '';
      });
      return '';
    });

    // Cambiar isDictating a false ANTES de agregar el texto al input
    // Esto asegura que el input no muestre finalTranscript/interimTranscript cuando agregamos el texto
    setIsDictating(false);
    isDictatingRef.current = false;

    // Limpiar timeout de silencio
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Detener reconocimiento de voz
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar errores al detener
      }
      recognitionRef.current = null;
    }

    // Agregar el texto capturado al input DESPUÉS de limpiar estados y cambiar isDictating
    const textToApply = dictationTextToApplyRef.current;
    if (textToApply) {
      // Usar setTimeout para asegurar que los estados se hayan actualizado y React haya re-renderizado
      setTimeout(() => {
        setInputValue(prev => {
          const newValue = prev + (prev ? ' ' : '') + textToApply;
          return newValue;
        });
        
        // Limpiar el ref
        dictationTextToApplyRef.current = '';
        
        // Enfocar el input
        setTimeout(() => {
          inputRef.current?.focus();
          // Mover cursor al final
          if (inputRef.current) {
            inputRef.current.setSelectionRange(
              inputRef.current.value.length,
              inputRef.current.value.length
            );
          }
        }, 50);
      }, 0);
    } else {
      // Limpiar el ref si no hay texto
      dictationTextToApplyRef.current = '';
    }

    // Limpiar timestamp
    lastTranscriptTimeRef.current = 0;
  }, []);

  // ðŸŽ™ï¸ Función para aplicar el texto transcrito al input
  const applyTranscribedText = useCallback(() => {
    const fullText = (finalTranscript + ' ' + interimTranscript).trim();
    if (fullText) {
      setInputValue(prev => {
        const newValue = prev + (prev ? ' ' : '') + fullText;
        return newValue;
      });
      // Enfocar el input
      setTimeout(() => {
        inputRef.current?.focus();
        // Mover cursor al final
        if (inputRef.current) {
          inputRef.current.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }
      }, 100);
    }
    // Limpiar transcripciones
    setInterimTranscript('');
    setFinalTranscript('');
  }, [finalTranscript, interimTranscript]);

  // ðŸŽ™ï¸ Función para iniciar/detener dictado usando Web Speech API
  const toggleDictation = useCallback(async () => {
    if (!isDictationEnabled) {
      console.warn('Dictado no está habilitado en la configuración');
      return;
    }

    // Verificar soporte del navegador
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.');
      return;
    }

    if (isDictating) {
      // Detener manualmente
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorar errores
        }
      }
      // Detener dictado (aplicará el texto automáticamente)
      stopDictation();
      return;
    }

    // Iniciar reconocimiento de voz
    try {
      // Limpiar transcripciones anteriores
      setInterimTranscript('');
      setFinalTranscript('');

      // Crear instancia de reconocimiento
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configuración
      const langMap: Record<string, string> = {
        'es': 'es-ES',
        'en': 'en-US',
        'pt': 'pt-BR',
      };
      recognition.lang = langMap[language || 'es'] || 'es-ES';
      recognition.continuous = true; // Continuar escuchando
      recognition.interimResults = true; // Mostrar resultados intermedios (tiempo real)
      recognition.maxAlternatives = 1;

      // Configuración de timeout para detección de silencio
      const SILENCE_TIMEOUT_MS = 3000; // 3 segundos sin nuevas palabras = detener

      // Función para reiniciar el timeout de silencio
      const resetSilenceTimeout = () => {
        // Limpiar timeout anterior
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // Crear nuevo timeout
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('ðŸ”‡ No se detectaron nuevas palabras por 3 segundos, deteniendo dictado...');
          
          // Detener reconocimiento
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Ignorar errores
            }
          }
          
          // Detener dictado (aplicará el texto automáticamente)
          stopDictation();
        }, SILENCE_TIMEOUT_MS);
      };

      // Evento: resultados intermedios (texto en tiempo real)
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        let hasNewText = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Resultado final (confirmado)
            final += transcript + ' ';
            hasNewText = true;
          } else {
            // Resultado intermedio (temporal, puede cambiar)
            interim += transcript;
            hasNewText = true;
          }
        }

        // Si hay nuevo texto, actualizar timestamp y reiniciar timeout
        if (hasNewText) {
          lastTranscriptTimeRef.current = Date.now();
          resetSilenceTimeout();
          console.log('ðŸ”Š Nuevo texto detectado, reiniciando timeout de silencio');
        }

        // Actualizar estados
        if (final) {
          setFinalTranscript(prev => (prev + ' ' + final).trim());
        }
        setInterimTranscript(interim);

        // Actualizar input en tiempo real
        const currentFinal = finalTranscript + (finalTranscript ? ' ' : '') + final;
        const displayText = (currentFinal + ' ' + interim).trim();
        
        // Mostrar en el input mientras se habla (solo visual, no se guarda hasta que termine)
        if (inputRef.current && displayText) {
          const currentValue = inputValue;
          const newValue = currentValue + (currentValue ? ' ' : '') + displayText;
          // No actualizamos el estado directamente para evitar conflictos
          // Solo mostramos visualmente
        }
      };

      // Evento: cuando termina el reconocimiento (silencio detectado automáticamente)
      recognition.onend = () => {
        console.log('ðŸŽ™ï¸ Reconocimiento de voz finalizado');
        
        // Limpiar timeout si existe
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        // Detener dictado (aplicará el texto automáticamente)
        stopDictation();
      };

      // Evento: errores
      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        
        if (event.error === 'no-speech') {
          // No se detectó habla, pero esto es normal, solo detener
          console.log('No se detectó habla, deteniendo...');
          stopDictation();
        } else if (event.error === 'audio-capture') {
          alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
          stopDictation();
        } else if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
          stopDictation();
        } else {
          // Otros errores, intentar continuar o detener según el caso
          console.warn('Error de reconocimiento:', event.error);
          if (event.error === 'network' || event.error === 'aborted') {
            stopDictation();
          }
        }
      };

      // Evento: cuando comienza el reconocimiento
      recognition.onstart = () => {
        console.log('ðŸŽ™ï¸ Reconocimiento de voz iniciado');
        setIsDictating(true);
        isDictatingRef.current = true;
        lastTranscriptTimeRef.current = Date.now();
        
        // Iniciar timeout de silencio (por si no se detecta nada al inicio)
        resetSilenceTimeout();
      };

      // Iniciar reconocimiento
      recognition.start();
      console.log('ðŸŽ™ï¸ Dictado iniciado con transcripción en tiempo real');
    } catch (error: any) {
      console.error('Error iniciando dictado:', error);
      setIsDictating(false);
      
      if (error?.name === 'NotAllowedError' || error?.message?.includes('not allowed')) {
        alert('Se necesita permiso para usar el micrófono. Por favor, permite el acceso al micrófono en la configuración del navegador.');
      } else if (error?.message?.includes('already started')) {
        // Ya está iniciado, solo actualizar estado
        setIsDictating(true);
        isDictatingRef.current = true;
      } else {
        alert('Error al acceder al micrófono. Por favor, verifica que tu navegador soporte reconocimiento de voz.');
      }
    }
  }, [isDictationEnabled, isDictating, language, stopDictation, applyTranscribedText, finalTranscript, inputValue]);

  // Limpiar recursos de dictado al desmontar o cerrar
  useEffect(() => {
    if (!isOpen) {
      stopDictation();
    }
    return () => {
      stopDictation();
    };
  }, [isOpen, stopDictation]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message, false, pageContext);
  }, [inputValue, isLoading, sendMessage, pageContext]);

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    await sendMessage(action.prompt);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: `${PANEL_WIDTH}px`,
            height: '100vh',
            backgroundColor: themeColors.panelBg,
            borderLeft: `1px solid ${themeColors.borderColor}`,
            borderBottomLeftRadius: '30px',
            overflow: 'hidden',
            zIndex: 130,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isLightTheme ? '-4px 0 24px rgba(0, 0, 0, 0.08)' : '-4px 0 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header del panel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${themeColors.borderColor}`,
              backgroundColor: themeColors.headerBg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar de LIA */}
              <div style={{ position: 'relative' }}>
                <motion.img
                  layoutId="lia-avatar-header"
                  src="/lia-avatar.png"
                  alt="SofLIA"
                  onClick={() => setIsAvatarExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${themeColors.accentColor}`,
                    cursor: 'zoom-in'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                    border: `2px solid ${themeColors.panelBg}`,
                  }}
                />
              </div>
              
              <div>
                <h2 style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  {t('lia.header.title')}
                </h2>
                <p style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
                  {t('lia.header.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Contenedor de acciones (Menú de opciones + Cerrar) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Botón de historial (mantener visible) */}
              <button
                onClick={() => {
                  if (showHistory) {
                    closeHistory();
                  } else {
                    setShowHistory(true);
                  }
                }}
                title={showHistory ? "Volver al chat" : "Historial"}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent'}
              >
                <Clock style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>

              {/* Menú de opciones (3 puntos) */}
              <div ref={optionsMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                  title="Opciones"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isOptionsMenuOpen ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOptionsMenuOpen) {
                      e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOptionsMenuOpen) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <MoreVertical style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
                </button>

                {/* Menú desplegable */}
                {isOptionsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '8px',
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#1E2329',
                      border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: '12px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      zIndex: 100000,
                      minWidth: '200px',
                    }}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {/* Opción: Personalización */}
                      <button
                        onClick={() => {
                          setIsPersonalizationOpen(true);
                          setIsOptionsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          color: isLightTheme ? '#0A2540' : '#FFFFFF',
                          fontSize: '14px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Settings style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#6C757D' : '#9CA3AF'} />
                        <span>Personalización</span>
                      </button>

                      {/* Opción: Borrar chat */}
                      <button
                        onClick={() => {
                          clearHistory();
                          setIsOptionsMenuOpen(false);
                        }}
                        disabled={messages.length === 0}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          color: isLightTheme ? '#ef4444' : '#f87171',
                          fontSize: '14px',
                          opacity: messages.length > 0 ? 1 : 0.5,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (messages.length > 0) {
                            e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
                        <span>{t('lia.chat.cleanHistory')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={closePanel}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            onScroll={(e) => { liaPanelScrollTop = e.currentTarget.scrollTop; }}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: 0,
            }}
          >
            {messages.length === 0 ? (
               // Empty State / Loading Screen Style
               <div
                 style={{
                   flex: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   textAlign: 'center',
                   opacity: 0.8,
                   padding: '0 20px'
                 }}
               >
                 <motion.div
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ duration: 0.5 }}
                   style={{ marginBottom: '24px', position: 'relative' }}
                 >
                   {/* Glow effect behind avatar */}
                   <div style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     width: '120px',
                     height: '120px',
                     borderRadius: '50%',
                     backgroundColor: themeColors.accentColor,
                     filter: 'blur(40px)',
                     opacity: 0.2,
                     zIndex: 0
                   }} />
                   
                   <img
                    src="/lia-avatar.png"
                    alt="SofLIA"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${themeColors.accentColor}`,
                      boxShadow: `0 0 20px ${themeColors.accentColor}40`,
                      position: 'relative',
                      zIndex: 1
                    }}
                   />
                 </motion.div>

                 <motion.div
                   key={currentTip} // Animate when tip changes
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2, duration: 0.5 }}
                 >
                   <h3 style={{ 
                     color: themeColors.textPrimary, 
                     fontSize: '18px', 
                     fontWeight: 600, 
                     marginBottom: '8px' 
                   }}>
                     SofLIA
                   </h3>
                   <p style={{ 
                     color: themeColors.textSecondary, 
                     fontSize: '14px', 
                     lineHeight: 1.5,
                     maxWidth: '280px',
                     margin: '0 auto'
                   }}>
                     {currentTip}
                   </p>
                 </motion.div>
               </div>
            ) : (
              // Chat Messages
              messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: message.role === 'user' ? themeColors.messageBubbleUser : themeColors.messageBubbleAssistant,
                    color: message.role === 'user' ? 'white' : themeColors.textPrimary,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  <p style={{ 
                    fontSize: '14px', 
                    lineHeight: 1.5, 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}>
                    {message.role === 'assistant' 
                      ? parseMarkdownContent(message.content, handleLinkClick, isDarkMode)
                      : message.content
                    }
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      marginTop: '6px',
                      marginBottom: 0,
                      color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
            )}
            
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: themeColors.messageBubbleAssistant,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.2s' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeColors.accentColor, animation: 'liaPulse 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div style={{ padding: '0 20px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: themeColors.inputBg,
                        border: `1px solid ${themeColors.borderColor}`,
                        color: themeColors.textPrimary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#2d3a47';
                        e.currentTarget.style.borderColor = themeColors.accentColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.inputBg;
                        e.currentTarget.style.borderColor = themeColors.borderColor;
                      }}
                    >
                      <Icon style={{ width: '14px', height: '14px' }} color={themeColors.accentColor} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: themeColors.inputBg,
                borderRadius: '24px',
                padding: '10px 16px',
                border: `1px solid ${themeColors.inputBorder}`,
              }}
            >

              
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue + (isDictating ? (inputValue ? ' ' : '') + finalTranscript + (finalTranscript && interimTranscript ? ' ' : '') + interimTranscript : '')}
                  onChange={(e) => {
                    // Solo permitir edición si no está dictando
                    if (!isDictating) {
                      setInputValue(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Si está dictando, detener primero
                      if (isDictating) {
                        // Detener dictado (aplicará el texto automáticamente)
                        stopDictation();
                      }
                      handleSendMessage();
                    }
                  }}
                  placeholder={isDictating ? 'Escuchando...' : t('lia.chat.inputPlaceholder')}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: themeColors.textPrimary,
                    fontSize: '14px',
                  }}
                />
                {/* Indicador visual de texto temporal (debajo del input) */}
                {isDictating && interimTranscript && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-18px',
                      left: 0,
                      fontSize: '11px',
                      color: themeColors.accentColor,
                      fontStyle: 'italic',
                      pointerEvents: 'none',
                      opacity: 0.7,
                    }}
                  >
                    {interimTranscript}
                  </div>
                )}
              </div>
              
              {/* ðŸŽ™ï¸ Botón de dictado (solo si está habilitado) */}
              {isDictationEnabled && (
                <button
                  onClick={toggleDictation}
                  disabled={isProcessingDictation}
                  title={isDictating ? 'Detener dictado' : 'Iniciar dictado'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isDictating 
                      ? '#EF4444' 
                      : isProcessingDictation 
                        ? (isLightTheme ? '#CBD5E1' : '#374151')
                        : 'transparent',
                    border: `1px solid ${isDictating ? '#EF4444' : themeColors.inputBorder}`,
                    cursor: isProcessingDictation ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: isProcessingDictation ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingDictation && !isDictating) {
                      e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDictating) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {isProcessingDictation ? (
                    <Loader2 style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} className="animate-spin" />
                  ) : isDictating ? (
                    <MicOff style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                  ) : (
                    <Mic style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} />
                  )}
                </button>
              )}
              
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: inputValue.trim() && !isLoading ? themeColors.accentColor : (isLightTheme ? '#CBD5E1' : '#374151'),
                  border: 'none',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <Send style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: inputValue.trim() && !isLoading ? '#FFFFFF' : (isLightTheme ? '#6B7280' : '#9CA3AF')
                }} />
              </button>
            </div>
          </div>
          
          {/* History View Overlay */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  position: 'absolute',
                  top: '81px', 
                  left: 0, 
                  right: 0,
                  bottom: 0,
                  backgroundColor: themeColors.panelBg,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{marginBottom: '8px'}}>
                      <h3 style={{color: themeColors.textPrimary, margin: 0, fontSize: '18px', fontWeight: 600}}>Historial</h3>
                      <p style={{color: themeColors.textSecondary, fontSize:'13px', margin:'4px 0 0'}}>Tus conversaciones recientes</p>
                    </div>

                    {isHistoryLoading ? (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', color: themeColors.textSecondary}}>
                           <div style={{width:'20px', height:'20px', border:`2px solid ${themeColors.accentColor}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:'10px'}}></div>
                           <span>Cargando...</span>
                        </div>
                    ) : historyList.length === 0 ? (
                        <div style={{textAlign:'center', padding:'60px 20px', color: themeColors.textSecondary}}>
                           <Clock size={48} style={{opacity:0.2, margin:'0 auto 16px', display:'block'}} />
                           <p>No hay conversaciones guardadas.</p>
                           <button onClick={closeHistory} style={{marginTop:'12px', background:'transparent', border:`1px solid ${themeColors.borderColor}`, padding:'8px 16px', borderRadius:'8px', color: themeColors.textPrimary, cursor:'pointer'}}>Volver al chat</button>
                        </div>
                    ) : (
                        historyList.map((conv) => (
                          <div
                            key={conv.conversation_id}
                            onClick={() => handleSelectConversation(conv.conversation_id)}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              backgroundColor: themeColors.inputBg,
                              border: `1px solid ${themeColors.borderColor}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                               e.currentTarget.style.borderColor = themeColors.accentColor;
                               e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                               e.currentTarget.style.borderColor = themeColors.borderColor;
                               e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', alignItems: 'center'}}>
                                {editingConversationId === conv.conversation_id ? (
                                    <div style={{display:'flex', flex:1, gap:'8px', alignItems:'center'}}>
                                        <input
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(conv.conversation_id, e as any);
                                                if (e.key === 'Escape') handleCancelEdit(e as any);
                                            }}
                                            style={{
                                                flex: 1,
                                                background: themeColors.inputBg,
                                                border: `1px solid ${themeColors.accentColor}`,
                                                color: themeColors.textPrimary,
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <button onClick={(e) => handleSaveEdit(conv.conversation_id, e)} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.accentColor, padding: 0}}>
                                            <Check size={16} />
                                        </button>
                                        <button onClick={handleCancelEdit} style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0}}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{fontWeight:600, color: themeColors.textPrimary, fontSize:'14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px'}}>
                                           {conv.conversation_title || new Date(conv.started_at).toLocaleDateString()}
                                        </span>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                            <button 
                                                onClick={(e) => handleStartEdit(conv, e)}
                                                style={{background:'none', border:'none', cursor:'pointer', color: themeColors.textSecondary, padding: 0, opacity: 0.6}}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                                title="Editar título"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteClick(conv, e)}
                                                disabled={deletingConversationId === conv.conversation_id}
                                                style={{
                                                    background:'none', 
                                                    border:'none', 
                                                    cursor: deletingConversationId === conv.conversation_id ? 'wait' : 'pointer', 
                                                    color: deletingConversationId === conv.conversation_id ? themeColors.textSecondary : '#ef4444', 
                                                    padding: 0, 
                                                    opacity: deletingConversationId === conv.conversation_id ? 0.5 : 0.6,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (deletingConversationId !== conv.conversation_id) {
                                                        e.currentTarget.style.opacity = '1';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (deletingConversationId !== conv.conversation_id) {
                                                        e.currentTarget.style.opacity = '0.6';
                                                    }
                                                }}
                                                title="Eliminar conversación"
                                            >
                                                {deletingConversationId === conv.conversation_id ? (
                                                    <div style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        border: `2px solid ${themeColors.textSecondary}`,
                                                        borderTopColor: 'transparent',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite'
                                                    }}></div>
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                            <span style={{fontSize:'12px', color: themeColors.textSecondary}}>
                                               {new Date(conv.started_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </>
                                )}
                             </div>
                             <div style={{fontSize:'12px', color: themeColors.textSecondary, display:'flex', gap:'8px'}}>
                                <span>{conv.total_messages || 'Varios'} mensajes</span>
                             </div>
                          </div>
                        ))
                    )}

                    {/* Controles de Paginación */}
                    {historyList.length > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderTop: `1px solid ${themeColors.borderColor}`,
                        marginTop: '12px'
                      }}>
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 0 || isHistoryLoading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: currentPage === 0 ? 'transparent' : themeColors.inputBg,
                            border: `1px solid ${themeColors.borderColor}`,
                            borderRadius: '8px',
                            color: currentPage === 0 ? themeColors.textSecondary : themeColors.textPrimary,
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 0 ? 0.5 : 1,
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage > 0) {
                              e.currentTarget.style.borderColor = themeColors.accentColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = themeColors.borderColor;
                          }}
                        >
                          <ChevronLeft size={16} />
                          Anterior
                        </button>

                        <span style={{
                          color: themeColors.textSecondary,
                          fontSize: '13px'
                        }}>
                          Página {currentPage + 1} {totalConversations > 0 && `(${totalConversations} total)`}
                        </span>

                        <button
                          onClick={handleNextPage}
                          disabled={!hasMore || isHistoryLoading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: !hasMore ? 'transparent' : themeColors.inputBg,
                            border: `1px solid ${themeColors.borderColor}`,
                            borderRadius: '8px',
                            color: !hasMore ? themeColors.textSecondary : themeColors.textPrimary,
                            cursor: !hasMore ? 'not-allowed' : 'pointer',
                            opacity: !hasMore ? 0.5 : 1,
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (hasMore) {
                              e.currentTarget.style.borderColor = themeColors.accentColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = themeColors.borderColor;
                          }}
                        >
                          Siguiente
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal de Confirmación de Eliminación */}
          <AnimatePresence>
            {showDeleteConfirm && conversationToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancelDelete}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 100000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: themeColors.panelBg,
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '100%',
                    border: `1px solid ${themeColors.borderColor}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      color: themeColors.textPrimary,
                      fontSize: '20px',
                      fontWeight: 600,
                      margin: '0 0 8px 0'
                    }}>
                      Eliminar conversación
                    </h3>
                    <p style={{
                      color: themeColors.textSecondary,
                      fontSize: '14px',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      ¿Estás seguro de que quieres eliminar la conversación "{conversationToDelete.title}"?
                    </p>
                    <p style={{
                      color: '#ef4444',
                      fontSize: '13px',
                      margin: '8px 0 0 0',
                      fontWeight: 500
                    }}>
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleCancelDelete}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: `1px solid ${themeColors.borderColor}`,
                        background: 'transparent',
                        color: themeColors.textPrimary,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.inputBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deletingConversationId === conversationToDelete.id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: deletingConversationId === conversationToDelete.id 
                          ? themeColors.textSecondary 
                          : '#ef4444',
                        color: 'white',
                        cursor: deletingConversationId === conversationToDelete.id ? 'wait' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        opacity: deletingConversationId === conversationToDelete.id ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (deletingConversationId !== conversationToDelete.id) {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deletingConversationId !== conversationToDelete.id) {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }
                      }}
                    >
                      {deletingConversationId === conversationToDelete.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes liaPulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
          {/* Expanded Avatar Overlay (Easter Egg) */}
          <AnimatePresence>
            {isAvatarExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAvatarExpanded(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-out',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative' }}
                >
                    <motion.img
                      layoutId="lia-avatar-header"
                      src="/lia-avatar.png"
                      alt="SofLIA Expanded"
                      style={{
                        width: 'min(80vw, 400px)',
                        height: 'min(80vw, 400px)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `4px solid ${themeColors.accentColor}`,
                        boxShadow: `0 0 50px ${themeColors.accentColor}80`
                      }}
                    />
                    <div style={{
                      marginTop: '20px',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>SofLIA</h3>
                      <p style={{ opacity: 0.8, margin: 0 }}>Learning Intelligence Assistant</p>
                    </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.aside>
        )}
      </AnimatePresence>
      {/* Modal de Personalización */}
      {isPersonalizationOpen && (
        <SofLIAPersonalizationSettings
          isOpen={isPersonalizationOpen}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      )}
    </>
  );
}

export function LiaSidePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<LiaSidePanelContent />, document.body);
}

// Exportar constante para uso en ContentWrapper
export const LIA_PANEL_WIDTH = PANEL_WIDTH;
