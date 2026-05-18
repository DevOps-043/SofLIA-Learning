'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { calculateCompleteness } from './PromptPreviewPanel/completeness';
import { PromptCompletenessIndicator } from './PromptPreviewPanel/PromptCompletenessIndicator';
import { PromptPreviewContent } from './PromptPreviewPanel/PromptPreviewContent';
import { PromptPreviewFooter } from './PromptPreviewPanel/PromptPreviewFooter';
import { PromptPreviewHeader } from './PromptPreviewPanel/PromptPreviewHeader';
import type {
  PromptDraft,
  PromptPreviewPanelProps
} from './PromptPreviewPanel/types';

export type { PromptDraft } from './PromptPreviewPanel/types';

export function PromptPreviewPanel({
  draft,
  onSave,
  onClose,
  onEdit,
  isSaving = false
}: PromptPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<PromptDraft>(draft);
  const completeness = useMemo(() => calculateCompleteness(draft), [draft]);

  useEffect(() => {
    setEditedDraft(draft);
  }, [draft]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      techDebtLogger.error('Error copiando al portapapeles:', error);
    }
  }, [draft.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([draft.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${draft.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [draft.content, draft.title]);

  const handleSave = useCallback(async () => {
    try {
      await onSave(isEditing ? editedDraft : draft);
    } catch (error) {
      techDebtLogger.error('Error guardando prompt:', error);
    }
  }, [draft, editedDraft, isEditing, onSave]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      onEdit?.(editedDraft);
    }
    setIsEditing((current) => !current);
  }, [editedDraft, isEditing, onEdit]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-20 bottom-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden"
    >
      <PromptPreviewHeader onClose={onClose} />
      <PromptCompletenessIndicator completeness={completeness} />
      <PromptPreviewContent
        draft={draft}
        isEditing={isEditing}
        editedDraft={editedDraft}
        onEditedDraftChange={setEditedDraft}
      />
      <PromptPreviewFooter
        copied={copied}
        completeness={completeness}
        isSaving={isSaving}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onEditToggle={handleEditToggle}
        onSave={handleSave}
      />
    </motion.div>
  );
}
