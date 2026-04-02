'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import type { StyleConfig } from '../../contexts/OrganizationStylesContext';

interface BusinessThemeCustomizerPreviewProps {
  currentStyles: StyleConfig;
}

export function BusinessThemeCustomizerPreview({
  currentStyles,
}: BusinessThemeCustomizerPreviewProps) {
  const previewBackground =
    currentStyles.background_type === 'gradient' && currentStyles.background_value
      ? currentStyles.background_value
      : currentStyles.background_type === 'color' && currentStyles.background_value
        ? currentStyles.background_value
        : '#0a0f1e';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-2"
    >
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl sticky top-6"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Vista Previa</h3>
            <p className="text-xs text-white/50">Asi se vera tu panel</p>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${currentStyles.border_color || '#334155'}`,
            background: previewBackground,
          }}
        >
          <div className="flex">
            <div
              className="w-10 min-h-[180px] border-r flex flex-col items-center py-2 gap-1.5"
              style={{
                backgroundColor: currentStyles.sidebar_background || '#1e293b',
                borderColor: currentStyles.border_color || '#334155',
              }}
            >
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: currentStyles.primary_button_color || '#3b82f6' }}
              />
              <div
                className="w-4 h-4 rounded opacity-30"
                style={{ backgroundColor: currentStyles.text_color || '#fff' }}
              />
              <div
                className="w-4 h-4 rounded opacity-30"
                style={{ backgroundColor: currentStyles.text_color || '#fff' }}
              />
            </div>

            <div className="flex-1 p-2 space-y-1.5">
              <div className="text-[9px] font-bold mb-1" style={{ color: currentStyles.text_color || '#fff' }}>
                Dashboard
              </div>

              <div className="grid grid-cols-2 gap-1">
                {['PMM', 'Tesis', 'Usuarios', 'Cursos'].map((item, index) => (
                  <div
                    key={item}
                    className="p-1.5 rounded text-[8px]"
                    style={{
                      backgroundColor: currentStyles.card_background || '#1e293b',
                      color: currentStyles.text_color || '#fff',
                      border: `1px solid ${currentStyles.border_color || '#334155'}`,
                    }}
                  >
                    <span className="opacity-60">{item}</span>
                    <span className="block font-bold">{[125, 48, 31, 12][index]}</span>
                  </div>
                ))}
              </div>

              <div
                className="p-1.5 rounded"
                style={{
                  backgroundColor: currentStyles.card_background || '#1e293b',
                  border: `1px solid ${currentStyles.border_color || '#334155'}`,
                }}
              >
                <div className="text-[8px] mb-1" style={{ color: currentStyles.text_color || '#fff', opacity: 0.6 }}>
                  Progreso
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: currentStyles.border_color || '#334155' }}
                >
                  <div
                    className="h-full w-3/5 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${currentStyles.primary_button_color || '#3b82f6'}, ${currentStyles.secondary_button_color || '#8b5cf6'})`,
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  className="px-2 py-1 rounded text-[8px] font-medium text-white"
                  style={{ backgroundColor: currentStyles.primary_button_color || '#3b82f6' }}
                >
                  Principal
                </button>
                <button
                  className="px-2 py-1 rounded text-[8px] font-medium text-white"
                  style={{ backgroundColor: currentStyles.secondary_button_color || '#8b5cf6' }}
                >
                  Secundario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
