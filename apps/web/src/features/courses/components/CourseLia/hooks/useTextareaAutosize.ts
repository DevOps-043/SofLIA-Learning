import { useCallback, useEffect, type RefObject } from 'react';

interface UseTextareaAutosizeArgs {
  inputRef: RefObject<HTMLTextAreaElement>;
  editInputRef: RefObject<HTMLTextAreaElement>;
  inputValue: string;
  editingMessageId: string | null;
  editingValue: string;
}

export function useTextareaAutosize({
  inputRef,
  editInputRef,
  inputValue,
  editingMessageId,
  editingValue,
}: UseTextareaAutosizeArgs) {
  const resizeTextArea = useCallback((textarea: HTMLTextAreaElement | null, maxHeight = 128) => {
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 20), maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    resizeTextArea(inputRef.current);
  }, [inputRef, inputValue, resizeTextArea]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    setTimeout(() => {
      resizeTextArea(editInputRef.current, 160);
      editInputRef.current?.focus();
    }, 0);
  }, [editInputRef, editingMessageId, editingValue, resizeTextArea]);

  return resizeTextArea;
}
