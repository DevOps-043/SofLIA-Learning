import { useCallback, useEffect, useRef } from 'react';

export function useAutosizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    const minHeight = 40;
    const maxHeight = 200;
    const nextHeight = Math.min(Math.max(textareaRef.current.scrollHeight, minHeight), maxHeight);
    textareaRef.current.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, value]);

  return textareaRef;
}
