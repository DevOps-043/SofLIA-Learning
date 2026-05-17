import { useEffect } from 'react';
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
  inputRef: RefObject<HTMLInputElement>;
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

  useEffect(() => {
    if (isOpen && tips.length > 0) {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    }
  }, [isOpen, setCurrentTip, tips]);

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
