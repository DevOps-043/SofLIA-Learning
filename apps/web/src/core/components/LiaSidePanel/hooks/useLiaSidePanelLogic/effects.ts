import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { SofLIAMessage } from '@/core/types/lia.types';

let liaPanelScrollTop = -1;

export function setLiaPanelScrollTop(scrollTop: number): void {
  liaPanelScrollTop = scrollTop;
}

interface UseLiaSidePanelEffectsParams {
  isOpen: boolean;
  isOptionsMenuOpen: boolean;
  optionsMenuRef: RefObject<HTMLDivElement>;
  chatContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLTextAreaElement>;
  messages: SofLIAMessage[];
  tips: string[];
  setIsOptionsMenuOpen: (isOpen: boolean) => void;
  setCurrentTip: (tip: string) => void;
}

export function useLiaSidePanelEffects({
  isOpen,
  isOptionsMenuOpen,
  optionsMenuRef,
  chatContainerRef,
  messagesEndRef,
  inputRef,
  messages,
  tips,
  setIsOptionsMenuOpen,
  setCurrentTip,
}: UseLiaSidePanelEffectsParams) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    if (isOptionsMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOptionsMenuOpen, optionsMenuRef, setIsOptionsMenuOpen]);

  // Elige un tip al azar SOLO al abrir el panel. `tips` se reconstruye en cada
  // render (array literal en el componente padre), así que tenerlo como
  // dependencia provocaba: efecto -> setCurrentTip -> render -> nueva identidad
  // de `tips` -> efecto... ("Maximum update depth exceeded"). Se depende de la
  // longitud, que es estable entre renders con el mismo catálogo de tips.
  const tipsRef = useRef(tips);
  tipsRef.current = tips;

  useEffect(() => {
    const availableTips = tipsRef.current;
    if (isOpen && availableTips.length > 0) {
      setCurrentTip(availableTips[Math.floor(Math.random() * availableTips.length)]);
    }
  }, [isOpen, setCurrentTip, tips.length]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !isOpen) return;
    const timer = setTimeout(() => {
      if (liaPanelScrollTop !== -1) container.scrollTop = liaPanelScrollTop;
      else messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatContainerRef, isOpen, messagesEndRef]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = scrollBottom < 150;
    const isUserMessage = messages[messages.length - 1]?.role === 'user';
    if (isNearBottom || isUserMessage || liaPanelScrollTop === -1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatContainerRef, messages, messagesEndRef]);

  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [inputRef, isOpen]);
}
