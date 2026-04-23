import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { buildLiaImageAttachment } from '../../../../core/reporting/report-problem.client';
import {
  REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES,
  type LiaImageAttachment,
} from '../../../../core/reporting/report-problem.contract';

export function useCourseLiaAttachments(isOpen: boolean) {
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<LiaImageAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setSelectedAttachment(null);
    setAttachmentError(null);

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, [isOpen]);

  const handleAttachmentSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAttachmentError('Solo puedes adjuntar imagenes.');
      event.target.value = '';
      return;
    }

    if (file.size > REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES) {
      setAttachmentError('La imagen es demasiado grande. Maximo 10MB.');
      event.target.value = '';
      return;
    }

    try {
      setSelectedAttachment(await buildLiaImageAttachment(file));
      setAttachmentError(null);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo procesar la imagen seleccionada.');
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleRemoveAttachment = useCallback(() => {
    setSelectedAttachment(null);
    setAttachmentError(null);

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, []);

  const handleAttachmentButtonClick = useCallback(() => {
    attachmentInputRef.current?.click();
  }, []);

  return {
    attachmentError,
    attachmentInputRef,
    handleAttachmentButtonClick,
    handleAttachmentSelect,
    handleRemoveAttachment,
    selectedAttachment,
    setAttachmentError,
    setSelectedAttachment,
  };
}

export type CourseLiaAttachmentState = ReturnType<typeof useCourseLiaAttachments>;
