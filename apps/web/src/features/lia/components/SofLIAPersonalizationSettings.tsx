'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  MessageSquare,
  Mic,
  History,
  Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSofLIAPersonalization } from '@/core/hooks/useSofLIAPersonalization';
import type {
  BaseStyle,
  SofLIAPersonalizationSettingsInput,
} from '@/core/types/soflia-personalization.types';

interface SofLIAPersonalizationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function SofLIAPersonalizationSettings({ isOpen, onClose }: SofLIAPersonalizationSettingsProps) {
  const { settings, loading, error, updateSettings, resetSettings } = useSofLIAPersonalization();
  const { t } = useTranslation('common');

  const BASE_STYLES: { value: BaseStyle; label: string; description: string }[] = [
    { value: 'professional', label: t('liaPersonalization.styles.professional.label'), description: t('liaPersonalization.styles.professional.description') },
    { value: 'casual', label: t('liaPersonalization.styles.casual.label'), description: t('liaPersonalization.styles.casual.description') },
    { value: 'technical', label: t('liaPersonalization.styles.technical.label'), description: t('liaPersonalization.styles.technical.description') },
    { value: 'friendly', label: t('liaPersonalization.styles.friendly.label'), description: t('liaPersonalization.styles.friendly.description') },
    { value: 'formal', label: t('liaPersonalization.styles.formal.label'), description: t('liaPersonalization.styles.formal.description') },
  ];
  
  const [formData, setFormData] = useState<SofLIAPersonalizationSettingsInput>({
    base_style: 'professional',
    is_friendly: true,
    is_enthusiastic: true,
    custom_instructions: null,
    nickname: null,
    voice_enabled: true,
    dictation_enabled: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    style: true,
    characteristics: true,
    instructions: false,
    about: false,
    advanced: false,
  });

  // Cargar configuración cuando se abre el modal
  useEffect(() => {
    if (isOpen && settings) {
      setFormData({
        base_style: settings.base_style,
        is_friendly: settings.is_friendly,
        is_enthusiastic: settings.is_enthusiastic,
        custom_instructions: settings.custom_instructions,
        nickname: settings.nickname,
        voice_enabled: settings.voice_enabled,
        dictation_enabled: settings.dictation_enabled,
      });
    }
  }, [isOpen, settings]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateSettings(formData);
      setSaveMessage({ type: 'success', text: t('liaPersonalization.saveSuccess') });
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (caughtError: unknown) {
      const errMsg = getErrorMessage(caughtError, t('liaPersonalization.saveError'));
      setSaveMessage({ type: 'error', text: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    setIsSaving(true);
    try {
      await resetSettings();
      setFormData({
        base_style: 'professional',
        is_friendly: true,
        is_enthusiastic: true,
        custom_instructions: null,
        nickname: null,
        voice_enabled: true,
        dictation_enabled: false,
      });
      setSaveMessage({ type: 'success', text: t('liaPersonalization.resetSuccess') });
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (caughtError: unknown) {
      const errMsg = getErrorMessage(caughtError, t('liaPersonalization.resetError'));
      setSaveMessage({ type: 'error', text: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Overlay transparente para cerrar al hacer clic fuera */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#0A2540] dark:text-[#00D4B3]" />
            <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">
              {t('liaPersonalization.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !settings ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#00D4B3]" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Mensaje de guardado */}
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    saveMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                      : 'bg-red-500/10 border border-red-500/20 text-red-500'
                  }`}
                >
                  {saveMessage.text}
                </motion.div>
              )}

              {/* Estilo y Tono Base */}
              <Section
                title={t('liaPersonalization.sections.style.title')}
                description={t('liaPersonalization.sections.style.description')}
                icon={Sparkles}
                isExpanded={expandedSections.style}
                onToggle={() => toggleSection('style')}
              >
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white">
                    {t('liaPersonalization.styleLabel')}
                  </label>
                  <select
                    value={formData.base_style}
                    onChange={(e) => setFormData({ ...formData, base_style: e.target.value as BaseStyle })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3]"
                  >
                    {BASE_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                    {BASE_STYLES.find(s => s.value === formData.base_style)?.description}
                  </p>
                </div>
              </Section>

              {/* Características */}
              <Section
                title={t('liaPersonalization.sections.characteristics.title')}
                description={t('liaPersonalization.sections.characteristics.description')}
                icon={MessageSquare}
                isExpanded={expandedSections.characteristics}
                onToggle={() => toggleSection('characteristics')}
              >
                <div className="space-y-4">
                  <ToggleField
                    label={t('liaPersonalization.friendlyLabel')}
                    description={t('liaPersonalization.friendlyDesc')}
                    checked={formData.is_friendly ?? true}
                    onChange={(checked) => setFormData({ ...formData, is_friendly: checked })}
                  />
                  <ToggleField
                    label={t('liaPersonalization.enthusiasticLabel')}
                    description={t('liaPersonalization.enthusiasticDesc')}
                    checked={formData.is_enthusiastic ?? true}
                    onChange={(checked) => setFormData({ ...formData, is_enthusiastic: checked })}
                  />
                </div>
              </Section>

              {/* Instrucciones Personalizadas */}
              <Section
                title={t('liaPersonalization.sections.instructions.title')}
                description={t('liaPersonalization.sections.instructions.description')}
                icon={Settings}
                isExpanded={expandedSections.instructions}
                onToggle={() => toggleSection('instructions')}
              >
                <div>
                  <textarea
                    value={formData.custom_instructions || ''}
                    onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value || null })}
                    placeholder={t('liaPersonalization.instructionsPlaceholder')}
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none"
                  />
                  <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                    {(formData.custom_instructions?.length || 0)} / 2000 {t('liaPersonalization.characters')}
                  </p>
                </div>
              </Section>

              {/* Acerca de Ti */}
              <Section
                title={t('liaPersonalization.sections.about.title')}
                description={t('liaPersonalization.sections.about.description')}
                icon={User}
                isExpanded={expandedSections.about}
                onToggle={() => toggleSection('about')}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white">
                      {t('liaPersonalization.nicknameLabel')}
                    </label>
                    <input
                      type="text"
                      value={formData.nickname || ''}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value || null })}
                      placeholder={t('liaPersonalization.nicknamePlaceholder')}
                      maxLength={50}
                      className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3]"
                    />
                    <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                      {t('liaPersonalization.nicknameHint')}
                    </p>
                  </div>
                </div>
              </Section>

              {/* Avanzado */}
              <Section
                title={t('liaPersonalization.sections.advanced.title')}
                description={t('liaPersonalization.sections.advanced.description')}
                icon={Settings}
                isExpanded={expandedSections.advanced}
                onToggle={() => toggleSection('advanced')}
              >
                <div className="space-y-4">
                  <ToggleField
                    label={t('liaPersonalization.voiceLabel')}
                    description={t('liaPersonalization.voiceDesc')}
                    checked={formData.voice_enabled ?? true}
                    onChange={(checked) => setFormData({ ...formData, voice_enabled: checked })}
                  />
                  <ToggleField
                    label={t('liaPersonalization.dictationLabel')}
                    description={t('liaPersonalization.dictationDesc')}
                    checked={formData.dictation_enabled ?? false}
                    onChange={(checked) => setFormData({ ...formData, dictation_enabled: checked })}
                  />
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Reset confirmation inline */}
        {showResetConfirm && (
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700/30 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">{t('liaPersonalization.confirmReset')}</p>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors">
                {t('actions.cancel')}
              </button>
              <button onClick={handleResetConfirm} className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
                {t('actions.confirm')}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors disabled:opacity-50"
          >
            {t('actions.retry')}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#00D4B3] text-white rounded-lg hover:bg-[#00b89a] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('actions.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, description, icon: Icon, isExpanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
          <div className="text-left">
            <h3 className="font-semibold text-[#0A2540] dark:text-white">{title}</h3>
            <p className="text-xs text-[#6C757D] dark:text-gray-400">{description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#0A2540] dark:text-white">{label}</p>
        <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00D4B3]/20 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#00D4B3] dark:peer-checked:bg-[#00D4B3]"></div>
      </label>
    </div>
  );
}
