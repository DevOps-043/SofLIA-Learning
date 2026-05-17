import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import { copyTextToClipboard } from '@/lib/clipboard';

interface UseMessageCopyActionArgs {
  copyFeedbackTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setCopiedMessageId: Dispatch<SetStateAction<string | null>>;
}

export function useMessageCopyAction({
  copyFeedbackTimeoutRef,
  setCopiedMessageId,
}: UseMessageCopyActionArgs) {
  return useCallback(async (messageId: string, content: string) => {
    const wasCopied = await copyTextToClipboard(content);

    if (!wasCopied) {
      console.warn('No se pudo copiar el mensaje');
      return;
    }

    if (copyFeedbackTimeoutRef.current !== null) {
      clearTimeout(copyFeedbackTimeoutRef.current);
    }

    setCopiedMessageId(messageId);
    copyFeedbackTimeoutRef.current = setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  }, [copyFeedbackTimeoutRef, setCopiedMessageId]);
}
