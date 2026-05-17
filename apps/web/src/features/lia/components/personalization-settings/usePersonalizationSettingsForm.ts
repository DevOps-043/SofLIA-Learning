import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  defaultExpandedSections,
  defaultPersonalizationFormData,
} from './constants';
import type {
  PersonalizationController,
  PersonalizationFormData,
} from './types';

export function usePersonalizationSettingsForm(input: {
  controller: PersonalizationController;
  isOpen: boolean;
}) {
  const { t } = useTranslation('common');
  const { settings, updateSettings, resetSettings } = input.controller;
  const [formData, setFormData] = useState<PersonalizationFormData>(
    defaultPersonalizationFormData
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<
    { text: string; type: 'error' | 'success' } | null
  >(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    defaultExpandedSections
  );

  useEffect(() => {
    if (input.isOpen && settings) {
      setFormData({
        base_style: settings.base_style,
        custom_instructions: settings.custom_instructions,
        dictation_enabled: settings.dictation_enabled,
        is_enthusiastic: settings.is_enthusiastic,
        is_friendly: settings.is_friendly,
        nickname: settings.nickname,
        voice_enabled: settings.voice_enabled,
      });
    }
  }, [input.isOpen, settings]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateSettings(formData);
      showTransientMessage('success', t('liaPersonalization.saveSuccess'));
    } catch (error: unknown) {
      showTransientMessage('error', getErrorMessage(error, t('liaPersonalization.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    setIsSaving(true);
    try {
      await resetSettings();
      setFormData(defaultPersonalizationFormData);
      showTransientMessage('success', t('liaPersonalization.resetSuccess'));
    } catch (error: unknown) {
      showTransientMessage('error', getErrorMessage(error, t('liaPersonalization.resetError')));
    } finally {
      setIsSaving(false);
    }
  };

  const showTransientMessage = (type: 'error' | 'success', text: string) => {
    setSaveMessage({ text, type });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return {
    expandedSections,
    formData,
    handleResetConfirm,
    handleSave,
    isSaving,
    saveMessage,
    setFormData,
    setShowResetConfirm,
    showResetConfirm,
    toggleSection,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
