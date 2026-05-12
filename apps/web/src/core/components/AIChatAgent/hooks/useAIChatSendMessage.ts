'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformContext } from '../../../../lib/lia/page-metadata';
import { IntentDetectionService } from '../../../services/intent-detection.service';
import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../../lib/nanobana/templates';
import type { Message, GeneratedPrompt } from '../types';

interface SendMessageParams {
  inputMessage: string
  isTyping: boolean
  isPromptMode: boolean
  isNanoBananaMode: boolean
  useContextMode: boolean
  normalMessages: Message[]
  promptMessages: Message[]
  nanoBananaMessages: Message[]
  nanoBananaDomain: NanoBananaDomain
  nanoBananaFormat: OutputFormat
  activeContext: string
  pathname: string
  pageContextInfo: string
  detectedContext: string
  pageContent: { title: string; metaDescription: string; headings: string[]; mainText: string } | null
  availableLinks: string
  language: string
  conversationId: string | null
  user: { display_name?: string; username?: string; first_name?: string; [key: string]: unknown } | null
  responseFallback: string
  errorGeneric: string
  helpPrompt: string
  helpFallback: string
  helpError: string
  inputRef: React.RefObject<HTMLTextAreaElement>
  voice: { isVoiceEnabled: boolean; speakText: (text: string) => void; stopAllAudio: () => void }
  // Setters
  setInputMessage: (v: string) => void
  setIsTyping: (v: boolean) => void
  setIsNanoBananaMode: (v: boolean) => void
  setIsPromptMode: (v: boolean) => void
  setNanoBananaDomain: (v: NanoBananaDomain) => void
  setNanoBananaFormat: (v: OutputFormat) => void
  setNanoBananaSchema: (v: NanoBananaSchema | null) => void
  setNanoBananaJsonString: (v: string) => void
  setIsNanoBananaPanelOpen: (v: boolean) => void
  setNanoBananaMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
  setPromptMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
  setNormalMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
  setGeneratedPrompt: (v: GeneratedPrompt | null) => void
  setIsPromptPanelOpen: (v: boolean) => void
  setSelectedPromptMessageId: (v: string | null) => void
  setConversationId: (v: string) => void
  setPageContent: (v: { title: string; metaDescription: string; headings: string[]; mainText: string } | null) => void
}

export function useAIChatSendMessage(params: SendMessageParams) {
  const router = useRouter();

  const handleSendMessage = useCallback(async () => {
    const {
      inputMessage, isTyping, isPromptMode, isNanoBananaMode, normalMessages, promptMessages, nanoBananaMessages,
      nanoBananaDomain, nanoBananaFormat, activeContext, pathname, pageContextInfo, detectedContext,
      pageContent, availableLinks, language, conversationId, user, responseFallback, errorGeneric, inputRef, voice,
      setInputMessage, setIsTyping, setIsNanoBananaMode, setIsPromptMode, setNanoBananaDomain, setNanoBananaFormat,
      setNanoBananaSchema, setNanoBananaJsonString, setIsNanoBananaPanelOpen, setNanoBananaMessages,
      setPromptMessages, setNormalMessages, setGeneratedPrompt, setIsPromptPanelOpen, setSelectedPromptMessageId,
      setConversationId,
    } = params;

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
      setTimeout(() => { if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; } }, 0);
      return;
    }

    if (effectiveNanoBananaMode) setNanoBananaMessages(prev => [...prev, userMessage]);
    else if (effectivePromptMode) setPromptMessages(prev => [...prev, userMessage]);
    else setNormalMessages(prev => [...prev, userMessage]);

    setInputMessage('');
    setTimeout(() => { if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.overflowY = 'hidden'; } }, 0);
    setIsTyping(true);

    try {
      if (effectiveNanoBananaMode) {
        const response = await fetch('/api/ai-directory/generate-nanobana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage.content, preferredDomain: nanoBananaDomain, preferredFormat: nanoBananaFormat, conversationHistory: nanoBananaMessages.map(m => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.content, timestamp: m.timestamp.toLocaleTimeString() })) }),
        });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })); throw new Error(errorData.error || `Error ${response.status}`); }
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
        if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })); throw new Error(errorData.error || `Error ${response.status}`); }
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
            message: userMessage.content, context: activeContext, language, isPromptMode: false, conversationId,
            pageContext: { pathname, description: pageContextInfo, detectedArea: detectedContext, pageTitle: pageContent?.title || '', metaDescription: pageContent?.metaDescription || '', headings: pageContent?.headings || [], mainText: pageContent?.mainText || '', platformContext: getPlatformContext(), availableLinks },
            conversationHistory: normalMessages.map(m => ({ role: m.role, content: m.content })),
            userName: user?.first_name || user?.display_name || user?.username,
            userInfo: user ? {
              display_name: user.display_name,
              first_name: user.first_name,
              last_name: typeof user.last_name === 'string' ? user.last_name : undefined,
              username: user.username,
              type_rol: typeof user.type_rol === 'string' ? user.type_rol : typeof user.cargo_rol === 'string' ? user.cargo_rol : undefined,
              job_title: typeof user.job_title === 'string' ? user.job_title : undefined,
              job_description: typeof user.job_description === 'string' ? user.job_description : undefined,
            } : undefined,
          }),
        });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })); throw new Error(errorData.error || `Error ${response.status}`); }
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
  }, [params]);

  const handleRequestHelp = useCallback(async (
    overridePageContent?: { title: string; metaDescription: string; headings: string[]; mainText: string } | null
  ) => {
    const {
      pageContent, activeContext, pathname, pageContextInfo, detectedContext,
      availableLinks, language, user, helpPrompt, helpFallback, helpError,
      normalMessages, setNormalMessages, setIsTyping, setPageContent,
    } = params;

    let currentPageContent = overridePageContent ?? pageContent;
    if (!currentPageContent || !currentPageContent.title) {
      const { extractPageContent } = await import('../AIChatAgent.utils');
      currentPageContent = extractPageContent();
      setPageContent(currentPageContent);
    }

    setIsTyping(true);
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: helpPrompt, context: activeContext, language,
          pageContext: { pathname, description: pageContextInfo, detectedArea: detectedContext, pageTitle: currentPageContent?.title || '', metaDescription: currentPageContent?.metaDescription || '', headings: currentPageContent?.headings || [], mainText: currentPageContent?.mainText || '', platformContext: getPlatformContext(), availableLinks },
          conversationHistory: normalMessages.map(m => ({ role: m.role, content: m.content })),
          userName: user?.first_name || user?.display_name || user?.username,
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
  }, [params]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return { handleSendMessage, handleRequestHelp, handleKeyPress };
}
