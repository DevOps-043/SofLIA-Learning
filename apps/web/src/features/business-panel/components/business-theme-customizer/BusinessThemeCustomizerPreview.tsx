'use client'

import { motion } from 'framer-motion'
import { Image as ImageIcon } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { StyleConfig } from '../../contexts/OrganizationStylesContext'

interface BusinessThemeCustomizerPreviewProps {
  currentStyles: StyleConfig
}

export function BusinessThemeCustomizerPreview({
  currentStyles,
}: BusinessThemeCustomizerPreviewProps) {
  const theme = useBusinessPanelTheme()
  const previewPrimary = currentStyles.primary_button_color || theme.actionColor
  const previewSecondary = currentStyles.secondary_button_color || theme.secondaryColor
  const previewText = currentStyles.text_color || theme.textColor
  const previewBorder = currentStyles.border_color || theme.borderColor
  const previewCard = currentStyles.card_background || theme.cardBg
  const previewSidebar = currentStyles.sidebar_background || theme.panelBg
  const previewBackground =
    currentStyles.background_type === 'gradient' && currentStyles.background_value
      ? currentStyles.background_value
      : currentStyles.background_type === 'color' && currentStyles.background_value
        ? currentStyles.background_value
        : theme.heroBackground

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-2"
    >
      <div
        className="sticky top-6 rounded-2xl border p-5 backdrop-blur-xl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="rounded-lg border p-2"
            style={{
              backgroundColor: theme.actionSurface,
              borderColor: `${theme.actionColor}33`,
            }}
          >
            <ImageIcon className="h-4 w-4" style={{ color: theme.actionColor }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.textColor }}>
              Vista previa
            </h3>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Así se verá tu panel
            </p>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl"
          style={{
            border: `1px solid ${previewBorder}`,
            background: previewBackground,
          }}
        >
          <div className="flex">
            <div
              className="flex min-h-[180px] w-10 flex-col items-center gap-1.5 border-r py-2"
              style={{
                backgroundColor: previewSidebar,
                borderColor: previewBorder,
              }}
            >
              <div className="h-5 w-5 rounded" style={{ backgroundColor: previewPrimary }} />
              <div className="h-4 w-4 rounded opacity-30" style={{ backgroundColor: previewText }} />
              <div className="h-4 w-4 rounded opacity-30" style={{ backgroundColor: previewText }} />
            </div>

            <div className="flex-1 space-y-1.5 p-2">
              <div className="mb-1 text-[9px] font-bold" style={{ color: previewText }}>
                Dashboard
              </div>

              <div className="grid grid-cols-2 gap-1">
                {['PMM', 'Tesis', 'Usuarios', 'Cursos'].map((item, index) => (
                  <div
                    key={item}
                    className="rounded p-1.5 text-[8px]"
                    style={{
                      backgroundColor: previewCard,
                      color: previewText,
                      border: `1px solid ${previewBorder}`,
                    }}
                  >
                    <span className="opacity-60">{item}</span>
                    <span className="block font-bold">{[125, 48, 31, 12][index]}</span>
                  </div>
                ))}
              </div>

              <div
                className="rounded p-1.5"
                style={{
                  backgroundColor: previewCard,
                  border: `1px solid ${previewBorder}`,
                }}
              >
                <div className="mb-1 text-[8px]" style={{ color: previewText, opacity: 0.6 }}>
                  Progreso
                </div>
                <div
                  className="h-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: previewBorder }}
                >
                  <div
                    className="h-full w-3/5 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${previewPrimary}, ${previewSecondary})`,
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[8px] font-medium"
                  style={{ backgroundColor: previewPrimary, color: theme.onActionColor }}
                >
                  Primario
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[8px] font-medium text-white"
                  style={{ backgroundColor: previewSecondary }}
                >
                  Secundario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
