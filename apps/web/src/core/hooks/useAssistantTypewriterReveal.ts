'use client';

import { useEffect, useRef, useState } from 'react';
import type { SofLIAMessage } from '../types/lia.types';

export interface AssistantTypewriterRevealState {
  messageId: string | null;
  length: number;
  isTyping: boolean;
}

interface UseAssistantTypewriterRevealParams {
  messages: SofLIAMessage[];
  isLoading: boolean;
}

const NO_TYPEWRITER_REVEAL: AssistantTypewriterRevealState = {
  messageId: null,
  length: 0,
  isTyping: false,
};

const TYPEWRITER_INTERVAL_MS = 28;
const FAST_REVEAL_THRESHOLD = 180;

function getTypewriterStep(remaining: number): number {
  if (remaining > FAST_REVEAL_THRESHOLD) return 6;
  if (remaining > 80) return 4;
  if (remaining > 24) return 2;
  return 1;
}

export function useAssistantTypewriterReveal({
  messages,
  isLoading,
}: UseAssistantTypewriterRevealParams): AssistantTypewriterRevealState {
  const [reveal, setReveal] =
    useState<AssistantTypewriterRevealState>(NO_TYPEWRITER_REVEAL);
  const targetRef = useRef<{
    messageId: string | null;
    targetLength: number;
    isFinal: boolean;
  }>({
    messageId: null,
    targetLength: 0,
    isFinal: false,
  });

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== 'assistant') {
      if (!isLoading) {
        targetRef.current = { messageId: null, targetLength: 0, isFinal: false };
        setReveal(NO_TYPEWRITER_REVEAL);
      }
      return;
    }

    const contentLength = lastMessage.content.length;
    const shouldAnimate =
      isLoading || targetRef.current.messageId === lastMessage.id;

    if (!shouldAnimate) {
      return;
    }

    if (targetRef.current.messageId !== lastMessage.id) {
      targetRef.current = {
        messageId: lastMessage.id,
        targetLength: contentLength,
        isFinal: !isLoading,
      };
      setReveal({ messageId: lastMessage.id, length: 0, isTyping: contentLength > 0 });
      return;
    }

    targetRef.current = {
      messageId: lastMessage.id,
      targetLength: contentLength,
      isFinal: !isLoading,
    };
  }, [isLoading, messages]);

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      const target = targetRef.current;
      if (!target.messageId) return;

      setReveal((prev) => {
        if (prev.messageId !== target.messageId) {
          return {
            messageId: target.messageId,
            length: 0,
            isTyping: target.targetLength > 0,
          };
        }

        const remaining = target.targetLength - prev.length;
        if (remaining <= 0) {
          return {
            messageId: target.messageId,
            length: prev.length,
            isTyping: !target.isFinal,
          };
        }

        const nextLength = Math.min(
          target.targetLength,
          prev.length + getTypewriterStep(remaining),
        );

        return {
          messageId: target.messageId,
          length: nextLength,
          isTyping: nextLength < target.targetLength || !target.isFinal,
        };
      });
    }, TYPEWRITER_INTERVAL_MS);

    return () => globalThis.clearInterval(interval);
  }, []);

  return reveal;
}
