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
import { useLiaPersonalization } from '@/core/hooks/useLiaPersonalization';
import type {
  BaseStyle,
  SofLIAPersonalizationSettingsInput,
} from '@/core/types/lia-personalization.types';

interface LiaPersonalizationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_STYLES: { value: BaseStyle; label: string; description: string }[] = [
  { value: 'professional', label: 'Profesional', description: 'Tono formal y directo, apropiado para trabajo' },
  { value: 'casual', label: 'Casual', description: 'Tono relajado y conversacional' },
  { value: 'technical', label: 'Técnico', description: 'Enfocado en detalles técnicos y precisión' },
  { value: 'friendly', label: 'Amigable', description: 'Cálido y cercano, como un compañero' },
  { value: 'formal', label: 'Formal', description: 'Lenguaje estructurado y respetuoso' },
];


export function LiaPersonalizationSettings({ isOpen, onClose }: LiaPersonalizationSettingsProps) {
  const { settings, loading, error, updateSettings, resetSettings } = useLiaPersonalization();
  
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
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error: unknown) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar configuración',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer la configuración a los valores por defecto?')) {
      return;
    }

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
      setSaveMessage({ type: 'success', text: 'Configuración restablecida' });
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error: unknown) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al restablecer configuración',
      });
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
              Personalización de LIA
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
                title="Estilo y tono base"
                description="Configura el estilo y tono que LIA usa al responder"
                icon={Sparkles}
                isExpanded={expandedSections.style}
                onToggle={() => toggleSection('style')}
              >
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white">
                    Estilo
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
                title="Características"
                description="Selecciona otras personalizaciones además del estilo y tono base"
                icon={MessageSquare}
                isExpanded={expandedSections.characteristics}
                onToggle={() => toggleSection('characteristics')}
              >
                <div className="space-y-4">
                  <ToggleField
                    label="Amable"
                    description="Habilita un tono amable y empático"
                    checked={formData.is_friendly ?? true}
                    onChange={(checked) => setFormData({ ...formData, is_friendly: checked })}
                  />
                  <ToggleField
                    label="Entusiasta"
                    description="Muestra entusiasmo y energía positiva"
                    checked={formData.is_enthusiastic ?? true}
                    onChange={(checked) => setFormData({ ...formData, is_enthusiastic: checked })}
                  />
                </div>
              </Section>

              {/* Instrucciones Personalizadas */}
              <Section
                title="Instrucciones personalizadas"
                description="Preferencias adicionales de comportamiento, estilo y tono"
                icon={Settings}
                isExpanded={expandedSections.instructions}
                onToggle={() => toggleSection('instructions')}
              >
                <div>
                  <textarea
                    value={formData.custom_instructions || ''}
                    onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value || null })}
                    placeholder="Ejemplo: Prefiero respuestas cortas y directas. Siempre incluye ejemplos prácticos."
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none"
                  />
                  <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                    {(formData.custom_instructions?.length || 0)} / 2000 caracteres
                  </p>
                </div>
              </Section>

              {/* Acerca de Ti */}
              <Section
                title="Acerca de ti"
                description="Información personal para personalizar las respuestas"
                icon={User}
                isExpanded={expandedSections.about}
                onToggle={() => toggleSection('about')}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white">
                      Apodo
                    </label>
                    <input
                      type="text"
                      value={formData.nickname || ''}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value || null })}
                      placeholder="Ejemplo: Fer"
                      maxLength={50}
                      className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3]"
                    />
                    <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                      El nombre y ocupación se obtienen automáticamente del sistema
                    </p>
                  </div>
                </div>
              </Section>

              {/* Avanzado */}
              <Section
                title="Avanzado"
                description="Funciones avanzadas de LIA"
                icon={Settings}
                isExpanded={expandedSections.advanced}
                onToggle={() => toggleSection('advanced')}
              >
                <div className="space-y-4">
                  <ToggleField
                    label="Voz"
                    description="Habilitar respuestas por voz"
                    checked={formData.voice_enabled ?? true}
                    onChange={(checked) => setFormData({ ...formData, voice_enabled: checked })}
                  />
                  <ToggleField
                    label="Modo de Dictado"
                    description="Permite dictar mensajes usando reconocimiento de voz"
                    checked={formData.dictation_enabled ?? false}
                    onChange={(checked) => setFormData({ ...formData, dictation_enabled: checked })}
                  />
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Restablecer
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#00D4B3] text-white rounded-lg hover:bg-[#00b89a] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
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
