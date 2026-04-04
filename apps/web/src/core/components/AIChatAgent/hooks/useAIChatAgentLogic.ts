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
import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../../lib/nanobana/templates';
import type { PromptDraft } from '../PromptPreviewPanel';
import { Message, GeneratedPrompt, AIChatAgentProps, LiaMode, MAX_CONTEXT_MESSAGES } from '../types';
import { detectContextFromURL, getPageContextInfo, extractPageContent } from '../AIChatAgent.utils';
import { useAIChatDrag } from './useAIChatDrag';
import { useAIChatVoice } from './useAIChatVoice';
import { useAIChatLayout } from './useAIChatLayout';
import { useAIChatPersistence } from './useAIChatPersistence';

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

  // ── Translated strings ────────────────────────────────────────────────────────
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

  // ── Mode state ────────────────────────────────────────────────────────────────
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isNanoBananaMode, setIsNanoBananaMode] = useState(false);
  const [useContextMode, setUseContextMode] = useState(true);

  // ── Open/minimize ─────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [areButtonsExpanded, setAreButtonsExpanded] = useState(false);

  // ── Prompt state ──────────────────────────────────────────────────────────────
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
  const [selectedPromptMessageId, setSelectedPromptMessageId] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // ── NanoBanana state ──────────────────────────────────────────────────────────
  const [nanoBananaSchema, setNanoBananaSchema] = useState<NanoBananaSchema | null>(null);
  const [nanoBananaJsonString, setNanoBananaJsonString] = useState<string>('');
  const [nanoBananaDomain, setNanoBananaDomain] = useState<NanoBananaDomain>('ui');
  const [nanoBananaFormat, setNanoBananaFormat] = useState<OutputFormat>('wireframe');
  const [isNanoBananaPanelOpen, setIsNanoBananaPanelOpen] = useState(false);
  const [nanoBananaMessages, setNanoBananaMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ── Menus ─────────────────────────────────────────────────────────────────────
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // ── Messages ──────────────────────────────────────────────────────────────────
  const [normalMessages, setNormalMessages] = useState<Message[]>([]);
  const [promptMessages, setPromptMessages] = useState<Message[]>([]);
  const messages = isNanoBananaMode ? nanoBananaMessages : isPromptMode ? promptMessages : normalMessages;

  // ── Input ─────────────────────────────────────────────────────────────────────
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Page context ──────────────────────────────────────────────────────────────
  const [pageContent, setPageContent] = useState<{ title: string; metaDescription: string; headings: string[]; mainText: string } | null>(null);
  const [availableLinks, setAvailableLinks] = useState<string>('');
  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;
  const pageContextInfo = getPageContextInfo(pathname);
  const isCommunitiesPage = pathname?.includes('/communities');
  const prevPathnameRef = useRef<string>('');
  const hasOpenedRef = useRef<boolean>(false);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────────
  const drag = useAIChatDrag(isOpen, isMinimized);
  const voice = useAIChatVoice(language, tCommon);
  const layout = useAIChatLayout();
  const { saveContextMessages, clearContextMessages } = useAIChatPersistence({
    useContextMode, isPromptMode, isOpen, normalMessages, setUseContextMode, setNormalMessages,
  });

  const placeholderText = isPromptMode
    ? tCommon('aiChat.promptMode.placeholder')
    : (promptPlaceholder ?? tCommon('aiChat.placeholder'));

  // ── Mode theme ────────────────────────────────────────────────────────────────
  const currentMode: LiaMode = isNanoBananaMode ? 'nanobana' : useContextMode ? 'analysis' : (isPromptMode ? 'prompt' : 'normal');

  const theme = useMemo(() => {
    switch (currentMode) {
      case 'nanobana':
        return { header: 'bg-[#0A2540]', accent: 'amber', bubbleUser: 'from-[#0A2540] to-[#00D4B3]', ring: 'focus:ring-amber-500', borderUser: 'border-[#00D4B3]', chipBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', chipActive: 'bg-amber-500 text-white border-transparent' };
      case 'prompt':
        return { header: 'bg-[#0A2540]', accent: 'purple', bubbleUser: 'from-[#0A2540] to-[#00D4B3]', ring: 'focus:ring-purple-500', borderUser: 'border-[#00D4B3]', chipBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30', chipActive: 'bg-purple-500 text-white border-transparent' };
      case 'analysis':
        return { header: 'bg-[#0A2540]', accent: '[#00D4B3]', bubbleUser: 'from-[#0A2540] to-[#00D4B3]', ring: 'focus:ring-[#00D4B3]', borderUser: 'border-[#00D4B3]', chipBg: 'bg-[#00D4B3]/15 text-[#00D4B3] border border-[#00D4B3]/30', chipActive: 'bg-[#00D4B3] text-white border-transparent' };
      default:
        return { header: 'bg-[#0A2540]', accent: '[#00D4B3]', bubbleUser: 'from-[#0A2540] to-[#00D4B3]', ring: 'focus:ring-[#00D4B3]', borderUser: 'border-[#00D4B3]', chipBg: 'bg-[#00D4B3]/15 text-[#00D4B3] border border-[#00D4B3]/30', chipActive: 'bg-[#00D4B3] text-white border-transparent' };
    }
  }, [currentMode]);

  // ── Page context effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => { setPageContent(extractPageContent()); }, 500);
    return () => clearTimeout(timer);
  }, [pathname, isOpen]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/api/lia/available-links');
        if (response.ok) { const data = await response.json(); if (data.success && data.linksForLIA) setAvailableLinks(data.linksForLIA); }
      } catch { }
    };
    fetchLinks();
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current === '') { prevPathnameRef.current = pathname; return; }
    if (prevPathnameRef.current !== pathname) {
      const wasOpen = isOpen;
      if (useContextMode && !isPromptMode && normalMessages.length > 0) saveContextMessages(normalMessages);
      if (!isPromptMode && !useContextMode) setNormalMessages([]);
      setPageContent(null);
      prevPathnameRef.current = pathname;
      if (wasOpen) {
        hasOpenedRef.current = true;
        const timer = setTimeout(() => { setPageContent(extractPageContent()); }, 100);
        return () => clearTimeout(timer);
      } else {
        hasOpenedRef.current = false;
      }
    }
  }, [pathname, useContextMode, isPromptMode, isOpen, normalMessages, saveContextMessages]);

  useEffect(() => {
    if (isOpen && !hasOpenedRef.current && !isPromptMode) {
      hasOpenedRef.current = true;
      const timer = setTimeout(() => { setPageContent(extractPageContent()); }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPromptMode]);

  // ── Menu close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) setIsOptionsMenuOpen(false);
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

  // ── Navigation event listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handleLiaNavigate = (event: CustomEvent) => { const { url } = event.detail; if (url) router.push(url); };
    window.addEventListener('lia-navigate', handleLiaNavigate as EventListener);
    return () => window.removeEventListener('lia-navigate', handleLiaNavigate as EventListener);
  }, [router]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    if (isOpen && inputRef.current) { inputRef.current.focus(); setTimeout(() => adjustTextareaHeight(), 100); }
  }, [isOpen, adjustTextareaHeight]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleToggle = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (drag.isDragging || drag.hasMoved.current) return;
    if (isOpen) { setIsMinimized(!isMinimized); }
    else { setIsPromptMode(false); setGeneratedPrompt(null); setIsOpen(true); setIsMinimized(false); setHasUnreadMessages(false); }
  };

  const handleClose = () => {
    setIsOpen(false); setIsMinimized(false); setAreButtonsExpanded(false);
    hasOpenedRef.current = false; voice.stopAllAudio();
  };

  const handleOpenPromptMode = () => {
    setIsPromptMode(true); setGeneratedPrompt(null); setAreButtonsExpanded(false);
    setIsOpen(true); setIsMinimized(false); setHasUnreadMessages(false);
  };

  const executeClearConversation = () => {
    if (isPromptMode) { setPromptMessages([]); }
    else { setNormalMessages([]); if (useContextMode) { try { localStorage.removeItem('lia-context-mode-messages'); } catch { } } }
    setGeneratedPrompt(null); setIsPromptPanelOpen(false); setSelectedPromptMessageId(null); setShowClearConfirm(false);
  };

  const handleClearConversation = () => {
    if (useContextMode && normalMessages.length > 0 && !isPromptMode) { setShowClearConfirm(true); return; }
    executeClearConversation();
  };

  const handleDownloadPrompt = () => {
    if (!generatedPrompt) return;
    const promptContent = `# ${generatedPrompt.title}\n\n## Descripción\n${generatedPrompt.description}\n\n${'='.repeat(80)}\n\n## PROMPT LISTO PARA USAR\n\n${generatedPrompt.content}\n\n${'='.repeat(80)}\n\n## Tags\n${generatedPrompt.tags.join(', ')}\n\n### Nivel: ${generatedPrompt.difficulty_level}\n\n### Casos de Uso\n${generatedPrompt.use_cases.map((uc: string) => `- ${uc}`).join('\n')}\n\n### Consejos\n${generatedPrompt.tips.map((tip: string) => `- ${tip}`).join('\n')}\n\nGenerado por SofLIA — Fecha: ${new Date().toLocaleString()}`;
    const blob = new Blob([promptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${generatedPrompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleSavePrompt = useCallback(async (draft: PromptDraft) => {
    if (!user) { alert(tCommon('aiChat.promptMode.loginRequired')); return; }
    setIsSavingPrompt(true);
    try {
      const response = await fetch('/api/ai-directory/prompts/save-from-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, conversation_id: conversationId }) });
      if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })); throw new Error(errorData.error || 'Error al guardar el prompt'); }
      const data = await response.json();
      alert(`✅ Prompt guardado exitosamente: "${draft.title}"`);
      setIsPromptPanelOpen(false);
      if (data.redirectUrl) { const shouldNavigate = confirm('¿Quieres ver el prompt en el directorio?'); if (shouldNavigate) router.push(data.redirectUrl); }
    } catch (error) {
      alert(`❌ Error al guardar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally { setIsSavingPrompt(false); }
  }, [user, conversationId, router, tCommon]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping) return;
    voice.stopAllAudio();
    let shouldActivatePromptMode = false, shouldDeactivatePromptMode = false;
    let shouldActivateNanoBananaMode = false, shouldDeactivateNanoBananaMode = false;
    let detectedNanoBananaDomain: NanoBananaDomain = 'ui';
    let detectedNanoBananaFormat: OutputFormat = 'wireframe';
    try {
      const intentResult = await IntentDetectionService.detectIntent(inputMessage);
      if (!isNanoBananaMode && !isPromptMode && intentResult.intent === 'nanobana' && intentResult.confidence >= 0.65) {
        shouldActivateNanoBananaMode = true;
        if (intentResult.entities?.nanobananaDomain) detectedNanoBananaDomain = intentResult.entities.nanobananaDomain;
        if (intentResult.entities?.outputFormat) detectedNanoBananaFormat = intentResult.entities.outputFormat;
        setIsNanoBananaMode(true); setNanoBananaDomain(detectedNanoBananaDomain); setNanoBananaFormat(detectedNanoBananaFormat);
      } else if (isNanoBananaMode) {
        const ml = inputMessage.toLowerCase().trim();
        if (intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
          shouldDeactivateNanoBananaMode = true; shouldActivatePromptMode = true; setIsNanoBananaMode(false); setIsPromptMode(true);
          setPromptMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "✨ He cambiado al Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?", timestamp: new Date() }]);
        } else if (intentResult.intent === 'navigate') {
          shouldDeactivateNanoBananaMode = true; setIsNanoBananaMode(false);
          setNormalMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte con la navegación.", timestamp: new Date() }]);
        } else if (intentResult.intent === 'general' || intentResult.intent === 'question') {
          const nonNBKeywords = ['comunidad', 'comunidades', 'noticias', 'dashboard', 'perfil', 'configuración', 'cuenta', 'talleres', 'directorio', 'prompts', 'apps', 'plataforma', 'página', 'sección', 'ayuda', 'soporte', 'funciona', 'qué es', 'cómo', 'curso', 'cursos', 'lección', 'módulo', 'módulos', 'contenido', 'video', 'actividad', 'ejercicio', 'tarea', 'cuántos', 'cuantos', 'aprendo', 'aprender', 'material', 'duración'];
          const genPatterns = [/\bcuántos?\b/i, /\bqué\s+(es|son|tiene|hay)\b/i, /\bcómo\s+(funciona|puedo|hago)\b/i, /\bdónde\s+(está|encuentro)\b/i];
          if (nonNBKeywords.some(k => ml.includes(k)) || genPatterns.some(p => p.test(ml))) {
            shouldDeactivateNanoBananaMode = true; setIsNanoBananaMode(false);
            setNormalMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para responder tu pregunta.", timestamp: new Date() }]);
          }
        } else {
          const exitPatterns = [/\b(ll[eé]vame|llevame)\b/i, /\b(ir\s+a|navegar\s+a|abrir)\b/i, /\b(salir|terminar)\b.*\b(nanobana|json)\b/i, /\b(no\s+quiero|ya\s+no)\b.*\b(nanobana|json|imagen)\b/i];
          if (exitPatterns.some(p => p.test(ml))) {
            shouldDeactivateNanoBananaMode = true; setIsNanoBananaMode(false);
            setNormalMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte.", timestamp: new Date() }]);
          }
        }
      } else if (!isPromptMode && !isNanoBananaMode && intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
        shouldActivatePromptMode = true;
        setPromptMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "✨ He detectado que quieres crear un prompt. He activado el Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?", timestamp: new Date() }]);
        setIsPromptMode(true);
      } else if (isPromptMode && intentResult.intent !== 'create_prompt') {
        const ml = inputMessage.toLowerCase().trim();
        const exitPatterns = [/\b(ll[eé]vame|llevame)\b/i, /\b(ir\s+a|navegar\s+a)\b/i, /\bdame\s+(el\s+)?(link|enlace)\b/i, /\b(salir|terminar)\b.*\b(prompt|modo)\b/i, /\b(no\s+quiero|ya\s+no)\b.*\bprompt\b/i];
        const nbKeywords = [/\bnanobana(na)?\b/i, /\b(wireframe|mockup|ui|interfaz)\b.*\b(json|generar|crear)\b/i, /\b(crear?|genera[r]?|diseña[r]?)\b.*\b(imagen|visual|wireframe|mockup|app)\b/i];
        if (nbKeywords.some(p => p.test(ml))) { shouldDeactivatePromptMode = true; shouldActivateNanoBananaMode = true; setIsPromptMode(false); setIsNanoBananaMode(true); }
        else if (exitPatterns.some(p => p.test(ml))) {
          shouldDeactivatePromptMode = true;
          setNormalMessages(prev => [...prev, { id: `system-${Date.now()}`, role: 'assistant', content: "🧠 He cambiado al modo normal para ayudarte.", timestamp: new Date() }]);
          setIsPromptMode(false);
        }
      }
    } catch { }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage, timestamp: new Date() };
    const effPrompt = (isPromptMode || shouldActivatePromptMode) && !shouldDeactivatePromptMode && !shouldActivateNanoBananaMode;
    const effNanoBanana = (isNanoBananaMode || shouldActivateNanoBananaMode) && !shouldDeactivateNanoBananaMode;
    const waitForDesc = shouldActivateNanoBananaMode || shouldActivatePromptMode;

    if (waitForDesc) {
      if (effNanoBanana) setNanoBananaMessages(prev => [...prev, userMessage]);
      else if (effPrompt) setPromptMessages(prev => [...prev, userMessage]);
      else setNormalMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setTimeout(() => { if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; } }, 0);
      return;
    }
    if (effNanoBanana) setNanoBananaMessages(prev => [...prev, userMessage]);
    else if (effPrompt) setPromptMessages(prev => [...prev, userMessage]);
    else setNormalMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTimeout(() => { if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; } }, 0);
    setIsTyping(true);

    try {
      if (effNanoBanana) {
        const res = await fetch('/api/ai-directory/generate-nanobana', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage.content, preferredDomain: nanoBananaDomain, preferredFormat: nanoBananaFormat, conversationHistory: nanoBananaMessages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content, timestamp: m.timestamp.toLocaleTimeString() })) }) });
        if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); throw new Error(e.error || `Error ${res.status}`); }
        const data = await res.json();
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || responseFallback, timestamp: new Date() };
        if (data.generatedSchema) { const jsonStr = data.jsonString || JSON.stringify(data.generatedSchema, null, 2); const dv = data.domain || 'ui'; const fv = data.outputFormat || 'wireframe'; assistantMsg.generatedNanoBanana = { schema: data.generatedSchema, jsonString: jsonStr, domain: dv, outputFormat: fv }; setNanoBananaSchema(data.generatedSchema); setNanoBananaJsonString(jsonStr); setNanoBananaDomain(dv); setNanoBananaFormat(fv); setIsNanoBananaPanelOpen(true); }
        setNanoBananaMessages(prev => [...prev, assistantMsg]);
        if (voice.isVoiceEnabled && assistantMsg.content) voice.speakText(assistantMsg.content);
      } else if (effPrompt) {
        const res = await fetch('/api/ai-directory/generate-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage.content, conversationHistory: promptMessages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content, timestamp: m.timestamp.toLocaleTimeString() })) }) });
        if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); throw new Error(e.error || `Error ${res.status}`); }
        const data = await res.json();
        let msgContent = data.response || responseFallback;
        if (data.generatedPrompt) msgContent = `¡Listo! He generado el prompt "${data.generatedPrompt.title || 'Tu prompt'}". ¿Necesitas algún ajuste?`;
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: msgContent, timestamp: new Date() };
        if (data.generatedPrompt) { assistantMsg.generatedPrompt = data.generatedPrompt; setGeneratedPrompt(data.generatedPrompt); setIsPromptPanelOpen(true); setSelectedPromptMessageId(assistantMsg.id); }
        setPromptMessages(prev => [...prev, assistantMsg]);
        if (voice.isVoiceEnabled && assistantMsg.content) voice.speakText(assistantMsg.content);
      } else {
        const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage.content, context: activeContext, language, isPromptMode: false, conversationId, pageContext: { pathname, description: pageContextInfo, detectedArea: detectedContext, pageTitle: pageContent?.title || '', metaDescription: pageContent?.metaDescription || '', headings: pageContent?.headings || [], mainText: pageContent?.mainText || '', platformContext: getPlatformContext(), availableLinks }, conversationHistory: normalMessages.map(m => ({ role: m.role, content: m.content })), userName: user?.display_name || user?.username || user?.first_name, userInfo: user ? { display_name: user.display_name, first_name: user.first_name, last_name: user.last_name, username: user.username, type_rol: user.job_title || user.cargo_rol } : undefined }) });
        if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); throw new Error(e.error || `Error ${res.status}`); }
        const data = await res.json();
        if (data.conversationId && !conversationId) setConversationId(data.conversationId);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || responseFallback, timestamp: new Date() };
        setNormalMessages(prev => [...prev, assistantMsg]);
        if (voice.isVoiceEnabled && assistantMsg.content) voice.speakText(assistantMsg.content);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error en el chat:', error);
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorGeneric, timestamp: new Date() };
      if (isPromptMode) setPromptMessages(prev => [...prev, errMsg]); else setNormalMessages(prev => [...prev, errMsg]);
      if (voice.isVoiceEnabled && errMsg.content) voice.speakText(errMsg.content);
    } finally { setIsTyping(false); }
  }, [inputMessage, isTyping, normalMessages, promptMessages, nanoBananaMessages, activeContext, pathname, pageContextInfo, detectedContext, user, language, responseFallback, errorGeneric, isPromptMode, isNanoBananaMode, pageContent, availableLinks, voice, conversationId, nanoBananaDomain, nanoBananaFormat]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  }, [handleSendMessage]);

  const handleRequestHelp = useCallback(async (overridePageContent?: { title: string; metaDescription: string; headings: string[]; mainText: string } | null) => {
    let currentPageContent = overridePageContent ?? pageContent;
    if (!currentPageContent?.title) { currentPageContent = extractPageContent(); setPageContent(currentPageContent); }
    setIsTyping(true);
    try {
      const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: helpPrompt, context: activeContext, language, pageContext: { pathname, description: pageContextInfo, detectedArea: detectedContext, pageTitle: currentPageContent?.title || '', metaDescription: currentPageContent?.metaDescription || '', headings: currentPageContent?.headings || [], mainText: currentPageContent?.mainText || '', platformContext: getPlatformContext(), availableLinks }, conversationHistory: normalMessages.map(m => ({ role: m.role, content: m.content })), userName: user?.display_name || user?.username || user?.first_name, isSystemMessage: true }) });
      if (!res.ok) throw new Error('Error al obtener ayuda');
      const data = await res.json();
      setNormalMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || helpFallback, timestamp: new Date() }]);
    } catch {
      setNormalMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: helpError, timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  }, [activeContext, pathname, pageContextInfo, detectedContext, pageContent, user, language, helpPrompt, helpFallback, helpError, normalMessages, availableLinks]);

  const handleToggleRecording = useCallback(() => {
    return voice.toggleRecording((transcript: string) => { setInputMessage(prev => prev + (prev ? ' ' : '') + transcript); });
  }, [voice]);

  const promptBottomPosition = useMemo(() => {
    if (isPromptMode && generatedPrompt && isPromptPanelOpen && isOpen) return layout.bottomPosition;
    return layout.bottomPosition;
  }, [layout.bottomPosition, isPromptMode, generatedPrompt, isPromptPanelOpen, isOpen]);

  return {
    // Theme / layout
    isDark, theme, currentMode, bottomPosition: layout.bottomPosition, chatBottomPosition: layout.bottomPosition, promptBottomPosition,
    calculateMaxHeight: layout.calculateMaxHeight, widgetHeight: layout.widgetHeight, hasDashboardNavbar: layout.hasDashboardNavbar,
    isDesktop: layout.isDesktop, isCommunitiesPage: layout.isCommunitiesPage,
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
