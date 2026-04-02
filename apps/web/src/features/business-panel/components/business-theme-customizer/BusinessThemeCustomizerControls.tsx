'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Image as ImageIcon, Palette } from 'lucide-react';
import type { StyleConfig } from '../../contexts/OrganizationStylesContext';
import {
  type ActivePanel,
  BUSINESS_THEME_COLOR_FIELDS,
  isValidHexColor,
} from '../../services/business-theme-customizer.service';

interface BusinessThemeCustomizerControlsProps {
  activePanel: ActivePanel;
  currentStyles: StyleConfig;
  gradientColors: string[];
  gradientAngle: number;
  copiedGradient: boolean;
  setGradientAngle: (value: number) => void;
  generateGradientCSS: () => string;
  addGradientColor: () => void;
  removeGradientColor: (index: number) => void;
  updateGradientColor: (index: number, color: string) => void;
  copyGradientToClipboard: () => void;
  updateStyle: (
    panel: ActivePanel,
    field: keyof StyleConfig,
    value: StyleConfig[keyof StyleConfig]
  ) => void;
}

async function uploadThemeBackground(file: File, onUpload: (url: string) => void) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'Panel-Business');
  formData.append('folder', 'Background');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (result.success && result.url) {
    onUpload(result.url);
  }
}

export function BusinessThemeCustomizerControls({
  activePanel,
  currentStyles,
  gradientColors,
  gradientAngle,
  copiedGradient,
  setGradientAngle,
  generateGradientCSS,
  addGradientColor,
  removeGradientColor,
  updateGradientColor,
  copyGradientToClipboard,
  updateStyle,
}: BusinessThemeCustomizerControlsProps) {
  const handleBackgroundUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      try {
        await uploadThemeBackground(file, (url) => {
          updateStyle(activePanel, 'background_type', 'image');
          updateStyle(activePanel, 'background_value', url);
        });
      } catch {
        // The caller already exposes save/apply feedback.
      }
    };

    input.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-3"
    >
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Palette className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Controles de Estilo</h3>
            <p className="text-xs text-white/50">Ajusta colores y opacidades</p>
          </div>
        </div>

        {currentStyles.background_type === 'gradient' && (
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--org-text-color, #ffffff)' }}
            >
              Gradiente
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Angulo: {gradientAngle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={gradientAngle}
                  onChange={(event) => setGradientAngle(Number(event.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--org-primary-button-color, #3b82f6)' }}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Colores del Gradiente
                </label>
                <div className="flex flex-wrap gap-3">
                  {gradientColors.map((color, index) => (
                    <div key={`${color}-${index}`} className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={color}
                          onChange={(event) => updateGradientColor(index, event.target.value)}
                          className="w-16 h-16 rounded-lg cursor-pointer border-2"
                          style={{ borderColor: 'var(--org-border-color, #334155)' }}
                        />
                        {gradientColors.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeGradientColor(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            x
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={color}
                        onChange={(event) => {
                          const nextColor = event.target.value;
                          if (isValidHexColor(nextColor) || nextColor === '') {
                            updateGradientColor(index, nextColor);
                          }
                        }}
                        className="w-20 px-2 py-1 rounded border text-sm"
                        style={{
                          backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                          borderColor: 'var(--org-border-color, #334155)',
                          color: 'var(--org-text-color, #ffffff)',
                        }}
                        placeholder="#000000"
                      />
                    </div>
                  ))}

                  {gradientColors.length < 5 && (
                    <button
                      type="button"
                      onClick={addGradientColor}
                      className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors hover:border-solid"
                      style={{
                        borderColor: 'var(--org-border-color, #334155)',
                        color: 'var(--org-text-color, #ffffff)',
                      }}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Vista Previa
                </label>
                <div
                  className="relative h-12 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: 'var(--org-border-color, #334155)' }}
                >
                  <div className="absolute inset-0" style={{ background: generateGradientCSS() }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyGradientToClipboard}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                    color: '#ffffff',
                  }}
                >
                  {copiedGradient ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Codigo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBackgroundUpload}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border"
                  style={{
                    borderColor: 'var(--org-border-color, #334155)',
                    backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                    color: 'var(--org-text-color, #ffffff)',
                  }}
                >
                  <ImageIcon className="w-4 h-4" />
                  Usar Imagen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-400" />
              Colores UI
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BUSINESS_THEME_COLOR_FIELDS.map((fieldConfig) => {
              const currentValue = currentStyles[fieldConfig.field] || fieldConfig.defaultValue;

              return (
                <div
                  key={fieldConfig.field}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">{fieldConfig.label}</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, fieldConfig.field, fieldConfig.defaultValue)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentValue}
                      onChange={(event) => updateStyle(activePanel, fieldConfig.field, event.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(event) => {
                        if (isValidHexColor(event.target.value) || event.target.value === '') {
                          updateStyle(activePanel, fieldConfig.field, event.target.value);
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>
              );
            })}

            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/80">Opacidad Modales</span>
                <span className="text-[10px] text-white/50">
                  {((currentStyles.modal_opacity || 0.95) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={currentStyles.modal_opacity || 0.95}
                onChange={(event) => updateStyle(activePanel, 'modal_opacity', Number(event.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10"
                style={{ accentColor: currentStyles.primary_button_color || '#3b82f6' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
