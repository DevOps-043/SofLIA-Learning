'use client'

import { motion } from 'framer-motion'
import { Check, Copy, Image as ImageIcon, Palette } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { StyleConfig } from '../../contexts/OrganizationStylesContext'
import {
  type ActivePanel,
  BUSINESS_THEME_COLOR_FIELDS,
  isValidHexColor,
} from '../../services/business-theme-customizer.service'

interface BusinessThemeCustomizerControlsProps {
  activePanel: ActivePanel
  currentStyles: StyleConfig
  gradientColors: string[]
  gradientAngle: number
  copiedGradient: boolean
  setGradientAngle: (value: number) => void
  generateGradientCSS: () => string
  addGradientColor: () => void
  removeGradientColor: (index: number) => void
  updateGradientColor: (index: number, color: string) => void
  copyGradientToClipboard: () => void
  updateStyle: (
    panel: ActivePanel,
    field: keyof StyleConfig,
    value: StyleConfig[keyof StyleConfig]
  ) => void
}

async function uploadThemeBackground(file: File, onUpload: (url: string) => void) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'Panel-Business')
  formData.append('folder', 'Background')

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  if (result.success && result.url) {
    onUpload(result.url)
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
  const theme = useBusinessPanelTheme()
  const previewPrimary = currentStyles.primary_button_color || theme.actionColor

  const handleBackgroundUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        return
      }

      try {
        await uploadThemeBackground(file, url => {
          updateStyle(activePanel, 'background_type', 'image')
          updateStyle(activePanel, 'background_value', url)
        })
      } catch {
        // El feedback visible se maneja en el contenedor principal.
      }
    }

    input.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-3"
    >
      <div
        className="rounded-2xl border p-5 backdrop-blur-xl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div
            className="rounded-lg border p-2"
            style={{
              backgroundColor: theme.actionSurface,
              borderColor: `${theme.actionColor}33`,
            }}
          >
            <Palette className="h-4 w-4" style={{ color: theme.actionColor }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.textColor }}>
              Controles de estilo
            </h3>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Ajusta colores y opacidades
            </p>
          </div>
        </div>

        {currentStyles.background_type === 'gradient' ? (
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium" style={{ color: theme.textColor }}>
              Gradiente
            </label>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs" style={{ color: theme.subtextColor }}>
                  Ángulo: {gradientAngle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={gradientAngle}
                  onChange={event => setGradientAngle(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                  style={{ accentColor: previewPrimary }}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs" style={{ color: theme.subtextColor }}>
                  Colores del gradiente
                </label>
                <div className="flex flex-wrap gap-3">
                  {gradientColors.map((color, index) => (
                    <div key={`${color}-${index}`} className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={color}
                          onChange={event => updateGradientColor(index, event.target.value)}
                          className="h-16 w-16 cursor-pointer rounded-lg border-2"
                          style={{ borderColor: theme.borderColor }}
                        />
                        {gradientColors.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removeGradientColor(index)}
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white transition-colors"
                            style={{ backgroundColor: theme.dangerColor }}
                          >
                            x
                          </button>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={color}
                        onChange={event => {
                          const nextColor = event.target.value
                          if (isValidHexColor(nextColor) || nextColor === '') {
                            updateGradientColor(index, nextColor)
                          }
                        }}
                        className="w-20 rounded border px-2 py-1 text-sm"
                        style={{
                          backgroundColor: theme.inputBg,
                          borderColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                        placeholder="#000000"
                      />
                    </div>
                  ))}

                  {gradientColors.length < 5 ? (
                    <button
                      type="button"
                      onClick={addGradientColor}
                      className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-solid"
                      style={{
                        borderColor: theme.borderColor,
                        color: theme.actionColor,
                        backgroundColor: theme.inputBg,
                      }}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs" style={{ color: theme.subtextColor }}>
                  Vista previa
                </label>
                <div
                  className="relative h-12 overflow-hidden rounded-lg border-2"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div className="absolute inset-0" style={{ background: generateGradientCSS() }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyGradientToClipboard}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
                  style={{
                    backgroundColor: previewPrimary,
                    color: theme.onActionColor,
                  }}
                >
                  {copiedGradient ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar código
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBackgroundUpload}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors"
                  style={{
                    borderColor: theme.borderColor,
                    backgroundColor: theme.inputBg,
                    color: theme.textColor,
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                  Usar imagen
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.textColor }}>
              <Palette className="h-4 w-4" style={{ color: theme.actionColor }} />
              Colores UI
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {BUSINESS_THEME_COLOR_FIELDS.map(fieldConfig => {
              const currentValue = currentStyles[fieldConfig.field] || fieldConfig.defaultValue

              return (
                <div
                  key={fieldConfig.field}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: theme.textColor }}>
                      {fieldConfig.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, fieldConfig.field, fieldConfig.defaultValue)}
                      className="rounded-md px-2 py-0.5 text-[10px] transition-all"
                      style={{
                        backgroundColor: theme.hoverBg,
                        color: theme.subtextColor,
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentValue}
                      onChange={event => updateStyle(activePanel, fieldConfig.field, event.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border-0"
                    />
                    <input
                      type="text"
                      value={currentValue}
                      onChange={event => {
                        if (isValidHexColor(event.target.value) || event.target.value === '') {
                          updateStyle(activePanel, fieldConfig.field, event.target.value)
                        }
                      }}
                      className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-mono"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    />
                  </div>
                </div>
              )
            })}

            <div
              className="rounded-xl p-3"
              style={{
                backgroundColor: theme.inputBg,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: theme.textColor }}>
                  Opacidad de modales
                </span>
                <span className="text-[10px]" style={{ color: theme.subtextColor }}>
                  {((currentStyles.modal_opacity || 0.95) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={currentStyles.modal_opacity || 0.95}
                onChange={event => updateStyle(activePanel, 'modal_opacity', Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                style={{ accentColor: previewPrimary }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
