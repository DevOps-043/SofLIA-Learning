'use client'

import { motion } from 'framer-motion'
import { Check, Moon, Sparkles, Sun } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ThemeConfig } from '../../config/preset-themes'

interface BusinessThemeCustomizerThemesProps {
  allThemes: ThemeConfig[]
  isSaving: boolean
  selectedThemeId: string | null | undefined
  getThemeIcon: (themeId: string) => string
  getThemeColor: (theme: ThemeConfig) => string
  isThemeSelected: (themeId: string) => boolean
  onApplyTheme: (themeId: string) => Promise<void>
}

export function BusinessThemeCustomizerThemes({
  allThemes,
  isSaving,
  selectedThemeId,
  getThemeIcon,
  getThemeColor,
  isThemeSelected,
  onApplyTheme,
}: BusinessThemeCustomizerThemesProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg border p-2"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.warningColor} 7.1%, transparent)`,
              borderColor: `color-mix(in srgb, ${theme.warningColor} 20%, transparent)`,
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: theme.warningColor }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.textColor }}>
              Temas predefinidos
            </h3>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Selecciona un tema para aplicar
            </p>
          </div>
        </div>
        {selectedThemeId ? (
          <span
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: theme.actionSurface,
              color: theme.actionColor,
              borderColor: `color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
            }}
          >
            Tema activo
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {allThemes.map((presetTheme, index) => {
          const themeSelected = isThemeSelected(presetTheme.id)
          const showAutoBadge = presetTheme.id === 'branding-personalizado'
          const showDualModeBadge = presetTheme.supportsDualMode && !showAutoBadge

          return (
            <motion.button
              key={presetTheme.id}
              type="button"
              onClick={() => void onApplyTheme(presetTheme.id)}
              disabled={isSaving}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-xl p-3 text-left transition-all duration-300"
              style={{
                backgroundColor: themeSelected ? theme.actionSurface : theme.inputBg,
                border: themeSelected
                  ? `2px solid ${theme.actionColor}`
                  : `1px solid ${theme.borderColor}`,
              }}
            >
              <div
                className="relative mb-2.5 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg text-xl font-bold text-white"
                style={{ background: getThemeColor(presetTheme) }}
              >
                <motion.span
                  className="relative z-10"
                  animate={themeSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getThemeIcon(presetTheme.id)}
                </motion.span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <h4 className="mb-0.5 truncate text-xs font-semibold" style={{ color: theme.textColor }}>
                {presetTheme.name}
              </h4>
              <p className="line-clamp-2 text-[10px] leading-tight" style={{ color: theme.subtextColor }}>
                {presetTheme.description}
              </p>

              {themeSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.actionColor }}
                >
                  <Check className="h-3 w-3" style={{ color: theme.onActionColor }} />
                </motion.div>
              ) : null}

              {showAutoBadge ? (
                <div
                  className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: theme.warningColor }}
                >
                  AUTO
                </div>
              ) : null}

              {showDualModeBadge ? (
                <div
                  className="absolute left-2 top-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  <Sun className="h-2.5 w-2.5" />
                  <span>/</span>
                  <Moon className="h-2.5 w-2.5" />
                </div>
              ) : null}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
