import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification';

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
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>(
    { isOpen: false, message: '', type: 'success' }
  );
  const showToast = useCallback((message: string, type: ToastType = 'success') =>
    setToast({ isOpen: true, message, type }), []);
  const hideToast = useCallback(() =>
    setToast(prev => ({ ...prev, isOpen: false })), []);
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
    try {
      await updateSettings(formData);
      showToast(t('liaPersonalization.saveSuccess'), 'success');
    } catch (error: unknown) {
      showToast(getErrorMessage(error, t('liaPersonalization.saveError')), 'error');
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
      showToast(t('liaPersonalization.resetSuccess'), 'success');
    } catch (error: unknown) {
      showToast(getErrorMessage(error, t('liaPersonalization.resetError')), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    expandedSections,
    formData,
    handleResetConfirm,
    handleSave,
    hideToast,
    isSaving,
    setFormData,
    setShowResetConfirm,
    showResetConfirm,
    toast,
    toggleSection,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
