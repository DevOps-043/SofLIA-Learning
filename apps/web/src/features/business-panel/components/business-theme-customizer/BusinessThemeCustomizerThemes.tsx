'use client';

import { motion } from 'framer-motion';
import { Check, Moon, Sparkles, Sun } from 'lucide-react';
import type { ThemeConfig } from '../../config/preset-themes';

interface BusinessThemeCustomizerThemesProps {
  allThemes: ThemeConfig[];
  isSaving: boolean;
  selectedThemeId: string | null | undefined;
  getThemeIcon: (themeId: string) => string;
  getThemeColor: (theme: ThemeConfig) => string;
  isThemeSelected: (themeId: string) => boolean;
  onApplyTheme: (themeId: string) => Promise<void>;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Temas Predefinidos</h3>
            <p className="text-xs text-white/50">Selecciona un tema para aplicar</p>
          </div>
        </div>
        {selectedThemeId && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Tema Activo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {allThemes.map((theme, index) => {
          const themeSelected = isThemeSelected(theme.id);
          const showAutoBadge = theme.id === 'branding-personalizado';
          const showDualModeBadge = theme.supportsDualMode && !showAutoBadge;

          return (
            <motion.button
              key={theme.id}
              onClick={() => void onApplyTheme(theme.id)}
              disabled={isSaving}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-3 rounded-xl text-left transition-all duration-300"
              style={{
                background: themeSelected
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))'
                  : 'rgba(255, 255, 255, 0.03)',
                border: themeSelected
                  ? '2px solid rgba(139, 92, 246, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                className="w-full aspect-[4/3] rounded-lg mb-2.5 flex items-center justify-center text-xl font-bold text-white relative overflow-hidden"
                style={{ background: getThemeColor(theme) }}
              >
                <motion.span
                  className="relative z-10"
                  animate={themeSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getThemeIcon(theme.id)}
                </motion.span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h4 className="font-semibold text-xs text-white truncate mb-0.5">{theme.name}</h4>
              <p className="text-[10px] text-white/50 line-clamp-2 leading-tight">{theme.description}</p>

              {themeSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {showAutoBadge && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  AUTO
                </div>
              )}

              {showDualModeBadge && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-1">
                  <Sun className="w-2.5 h-2.5" />
                  <span>/</span>
                  <Moon className="w-2.5 h-2.5" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
