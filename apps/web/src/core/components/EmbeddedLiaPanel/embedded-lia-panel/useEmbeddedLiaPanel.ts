'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLiaChat } from '../../../hooks/useLiaChat';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { useLanguage } from '../../../providers/I18nProvider';
import { useOrganizationStylesContext } from '../../../../features/business-panel/contexts/OrganizationStylesContext';
import { useLiaPanel } from '../../../contexts/LiaPanelContext';
import {
  DEFAULT_EMBEDDED_LIA_MODE,
  getEmbeddedLiaColors,
  getEmbeddedLiaModes,
  getEmbeddedLiaNavbarHeight,
} from './service';
import type {
  BrowserSpeechRecognition,
  BrowserSpeechWindow,
  EmbeddedLiaPanelProps,
  EmbeddedLiaChatMode,
} from './types';

export function useEmbeddedLiaPanel({
  assistantName = 'SofLIA',
  assistantAvatar = '/lia-avatar.webp',
  initialMessage = null,
  organizationColors,
}: EmbeddedLiaPanelProps) {
  const { effectiveStyles, styles } = useOrganizationStylesContext();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isOpen, openPanel, closePanel } = useLiaPanel();
  const themeStyles = effectiveStyles?.panel || styles?.panel;

  const colors = useMemo(
    () => getEmbeddedLiaColors(themeStyles, organizationColors),
    [organizationColors, themeStyles]
  );
  const navbarHeight = useMemo(() => getEmbeddedLiaNavbarHeight(pathname), [pathname]);
  const availableModes = useMemo(() => getEmbeddedLiaModes(colors), [colors]);

  const panelRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [currentMode, setCurrentMode] = useState<EmbeddedLiaChatMode>(DEFAULT_EMBEDDED_LIA_MODE);

  const { messages, isLoading, sendMessage, clearHistory } = useLiaChat(initialMessage);

  const isPanelOpen = isOpen;
  const currentModeData = availableModes.find((mode) => mode.id === currentMode) || availableModes[0];
  const expandedWidth = 'w-[85vw] sm:w-[360px] max-w-[360px]';

  useEffect(() => {
    if (!isModeDropdownOpen || !modeButtonRef.current) {
      return;
    }

    const rect = modeButtonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [isModeDropdownOpen]);

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

    return undefined;
  }, [isModeDropdownOpen]);

  useEffect(() => {
    if (messagesEndRef.current && isPanelOpen && !isCollapsed) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isCollapsed, isPanelOpen, messages]);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 60)}px`;
    }
  }, [message]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');

    try {
      await sendMessage(messageToSend);
    } catch {
      // The chat hook already pushes a fallback assistant error message.
    }
  };

  const toggleRecording = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const speechWindow = window as BrowserSpeechWindow;
    const SpeechRecognition = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'en' ? 'en-US' : 'es-ES';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsRecording(false);
        recognition.stop();
      };
      recognition.onerror = () => {
        setIsRecording(false);
        recognition.stop();
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    recognitionRef.current.start();
    setIsRecording(true);
  };

  return {
    assistantName,
    assistantAvatar,
    colors,
    navbarHeight,
    expandedWidth,
    panelRef,
    router,
    user,
    message,
    setMessage,
    isRecording,
    messages,
    isLoading,
    handleSendMessage,
    toggleRecording,
    messageInputRef,
    messagesEndRef,
    isModeDropdownOpen,
    setIsModeDropdownOpen,
    dropdownPosition,
    modeDropdownRef,
    modeButtonRef,
    availableModes,
    currentMode,
    setCurrentMode,
    currentModeData,
    clearHistory,
    isPanelOpen,
    setIsPanelOpen: (open: boolean) => {
      if (open) {
        openPanel();
      } else {
        closePanel();
      }
    },
    isCollapsed,
    setIsCollapsed,
    voiceError,
    setVoiceError,
  };
}
