'use client'

import { motion } from 'framer-motion'
import { Loader2, Palette, Sparkles } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BrandingFormState } from './types'

interface BrandingColorsCardProps {
  branding: BrandingFormState
  isDetecting: boolean
  onDetectColors: () => void
  onColorChange: (
    key: keyof Pick<
      BrandingFormState,
      'color_primary' | 'color_secondary' | 'color_accent'
    >,
    value: string,
  ) => void
}

const colorConfigs = [
  { key: 'color_primary', label: 'Primario' },
  { key: 'color_secondary', label: 'Secundario' },
  { key: 'color_accent', label: 'Acento' },
] as const

export function BrandingColorsCard({
  branding,
  isDetecting,
  onDetectColors,
  onColorChange,
}: BrandingColorsCardProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--color-warning), var(--color-legacy-d97706))' }}
          >
            <Palette className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.textColor }}>
              Paleta de Colores
            </h3>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Define los 3 colores de tu marca
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={onDetectColors}
          disabled={isDetecting || !branding.banner_url}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: 'var(--color-legacy-fbbf24)',
          }}
        >
          {isDetecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-3.5 h-3.5" />
              </motion.div>
              Detectando...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Auto-detectar
            </>
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {colorConfigs.map((config) => (
          <motion.div
            key={config.key}
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${branding[config.key]} 8.2%, transparent), color-mix(in srgb, ${branding[config.key]} 2%, transparent))`,
              border: `1px solid color-mix(in srgb, ${branding[config.key]} 18.8%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: branding[config.key] }}
              >
                <input
                  type="color"
                  value={branding[config.key]}
                  onChange={(e) => onColorChange(config.key, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="font-semibold text-sm" style={{ color: theme.textColor }}>
                  {config.label}
                </p>
                <p className="text-xs uppercase font-mono truncate" style={{ color: theme.subtextColor }}>
                  {branding[config.key]}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>
          Vista Previa
        </p>

        <div
          className="h-12 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${branding.color_primary}, ${branding.color_secondary}, ${branding.color_accent})`,
            boxShadow: `0 8px 30px color-mix(in srgb, ${branding.color_primary} 14.5%, transparent)`,
          }}
        >
          <span
            className="font-bold text-sm tracking-wide"
            style={{
              color: 'var(--color-bg-light)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            Tu Marca
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="px-4 py-2 rounded-lg font-medium text-sm shadow-md"
            style={{
              background: `linear-gradient(135deg, ${branding.color_primary}, ${branding.color_secondary})`,
              color: 'var(--color-bg-light)',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            Primario
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="px-4 py-2 rounded-lg font-medium text-sm"
            style={{
              backgroundColor: 'transparent',
              border: `1.5px solid ${branding.color_primary}`,
              color: branding.color_primary,
            }}
          >
            Secundario
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="px-4 py-2 rounded-lg font-medium text-sm"
            style={{
              backgroundColor: branding.color_accent,
              color: 'var(--color-bg-light)',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            Acento
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
