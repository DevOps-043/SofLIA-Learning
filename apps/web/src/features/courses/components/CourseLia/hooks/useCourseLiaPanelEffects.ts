import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';

import type { CourseLiaThemeColors } from '../types';

interface UseCourseLiaPanelEffectsArgs {
  closeLia: () => void;
  copyFeedbackTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
  inputRef: RefObject<HTMLTextAreaElement>;
  isInteractionBlocked: boolean;
  isLightTheme: boolean;
  isOpen: boolean;
  messages: unknown[];
  messagesEndRef: RefObject<HTMLDivElement>;
  panelRef: RefObject<HTMLDivElement>;
  setCopiedMessageId: Dispatch<SetStateAction<string | null>>;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  setEditingValue: Dispatch<SetStateAction<string>>;
  setForceDarkText: Dispatch<SetStateAction<boolean>>;
  setInputValue: Dispatch<SetStateAction<string>>;
  stop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function useCourseLiaPanelEffects({
  closeLia,
  copyFeedbackTimeoutRef,
  inputRef,
  isInteractionBlocked,
  isLightTheme,
  isOpen,
  messages,
  messagesEndRef,
  panelRef,
  setCopiedMessageId,
  setEditingMessageId,
  setEditingValue,
  setForceDarkText,
  setInputValue,
  stop,
  themeColors,
}: UseCourseLiaPanelEffectsArgs) {
  useEffect(() => {
    const checkContrast = () => {
      if (!panelRef.current) {
        return;
      }

      const rgb = window.getComputedStyle(panelRef.current).backgroundColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const brightness = (Number(rgb[0]) * 299 + Number(rgb[1]) * 587 + Number(rgb[2]) * 114) / 1000;
        setForceDarkText(brightness > 200);
      }
    };

    checkContrast();
    const timer = setTimeout(checkContrast, 500);
    return () => clearTimeout(timer);
  }, [isLightTheme, panelRef, setForceDarkText, themeColors.panelBg]);

  useEffect(() => {
    if (isInteractionBlocked) {
      closeLia();
      stop();
      setInputValue('');
      setEditingMessageId(null);
      setEditingValue('');
    }
  }, [closeLia, isInteractionBlocked, setEditingMessageId, setEditingValue, setInputValue, stop]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [inputRef, isOpen]);

  useEffect(() => () => {
    if (copyFeedbackTimeoutRef.current !== null) {
      clearTimeout(copyFeedbackTimeoutRef.current);
    }
  }, [copyFeedbackTimeoutRef]);

  useEffect(() => {
    if (!isOpen) {
      setCopiedMessageId(null);
      setEditingMessageId(null);
      setEditingValue('');
    }
  }, [isOpen, setCopiedMessageId, setEditingMessageId, setEditingValue]);
}
