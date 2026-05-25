'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { TFunction } from 'i18next';
import { canGenerateLessonAi, createLessonFormData, validateLessonForm } from './service';
import type { LessonFormData, LessonModalProps, LessonModalTab } from './types';

interface UseLessonModalStateParams extends LessonModalProps {
  t: TFunction<'admin'>;
}

export function useLessonModalState({ instructors = [], lesson, onClose, onSave, t }: UseLessonModalStateParams) {
  const [activeTab, setActiveTab] = useState<LessonModalTab>('basic');
  const [durationAutoDetected, setDurationAutoDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(() => createLessonFormData(lesson, instructors));
  const [generatingAI, setGeneratingAI] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(createLessonFormData(lesson, instructors));
    setActiveTab('basic');
    setError(null);
  }, [lesson, instructors]);

  async function handleGenerateAI(videoUrl?: string) {
    const targetUrl = videoUrl || formData.video_provider_id;
    if (!canGenerateLessonAi(formData.video_provider, targetUrl)) {
      setError(t('workshops.editor.lessons.aiErrorVideo'));
      return;
    }
    setGeneratingAI(true);
    setError(null);
    setActiveTab('content');
    try {
      const response = await fetch('/api/admin/ai/process-video', {
        body: JSON.stringify({ videoUrl: targetUrl }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = (await response.json()) as { error?: string; summary?: string; transcript?: string };
      if (!response.ok) throw new Error(data.error || t('workshops.errors.processVideo'));
      setFormData((current) => ({ ...current, summary_content: data.summary || '', transcript_content: data.transcript || '' }));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : t('workshops.errors.generateContent'));
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const validationError = validateLessonForm(formData);
    if (validationError) {
      setError(t(`workshops.editor.lessons.validation.${validationError}`));
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('workshops.errors.saveLesson'));
    } finally {
      setLoading(false);
    }
  }

  return { activeTab, durationAutoDetected, error, formData, generatingAI, handleGenerateAI, handleSubmit, loading, setActiveTab, setDurationAutoDetected, setFormData };
}
