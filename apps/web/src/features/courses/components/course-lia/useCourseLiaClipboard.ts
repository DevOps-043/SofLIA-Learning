import { useCallback, useEffect, useRef, useState } from 'react';

import { copyTextToClipboard } from '../../../../lib/clipboard';

export function useCourseLiaClipboard() {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
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
  }, []);

  return { copiedMessageId, handleCopyMessage };
}
