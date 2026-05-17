'use client';

import { useTranslation } from 'react-i18next';
import { LessonContentAiPanel } from './LessonContentAiPanel';
import { LessonContentTextArea } from './LessonContentTextArea';
import type { LessonFormData } from './types';

interface LessonContentTabProps {
  formData: LessonFormData;
  generatingAI: boolean;
  onFormDataChange: (updater: (currentFormData: LessonFormData) => LessonFormData) => void;
  onGenerateAI: () => void;
}

export function LessonContentTab({
  formData,
  generatingAI,
  onFormDataChange,
  onGenerateAI,
}: LessonContentTabProps) {
  const { t } = useTranslation('admin');

  return (
    <div className="space-y-4">
      <LessonContentAiPanel formData={formData} generatingAI={generatingAI} onGenerateAI={onGenerateAI} t={t} />
      <LessonContentTextArea
        field="transcript_content"
        formData={formData}
        label={t('workshops.editor.lessons.transcriptLabel')}
        onFormDataChange={onFormDataChange}
        placeholder={t('workshops.editor.lessons.transcriptPlaceholder')}
      />
      <LessonContentTextArea
        field="summary_content"
        formData={formData}
        helpText={t('workshops.editor.lessons.summaryHelp')}
        label={t('workshops.editor.lessons.summaryLabel')}
        onFormDataChange={onFormDataChange}
        placeholder={t('workshops.editor.lessons.summaryPlaceholder')}
      />
    </div>
  );
}
