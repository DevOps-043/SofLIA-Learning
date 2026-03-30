'use client';

import { motion } from 'framer-motion';
import {
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { useBusinessThemeCustomizerLogic } from '../hooks/useBusinessThemeCustomizerLogic';

export function BusinessThemeCustomizer() {
  const {
    styles,
    loading,
    error,
    activePanel,
    currentStyles,
    saveSuccess,
    saveError,
    isSaving,
    allThemes,
    gradientColors,
    gradientAngle,
    setGradientAngle,
    copiedGradient,
    generateGradientCSS,
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    copyGradientToClipboard,
    getThemeIcon,
    getThemeColor,
    isThemeSelected,
    updateStyle,
    handleApplyTheme,
    handleSave,
    handleDiscard,
    handleReset,
  } = useBusinessThemeCustomizerLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: 'var(--org-primary-button-color, #3b82f6)33',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}
          />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
          >
            <Palette className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">Personalización de Tema</h2>
            <p className="text-white/60 text-sm">Personaliza la apariencia de tu plataforma</p>
          </div>
        </div>
      </motion.div>

      {/* Temas Predefinidos - Grid Moderno */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
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
          {styles?.selectedTheme && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Tema Activo
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {allThemes.map((theme, index) => (
            <motion.button
              key={theme.id}
              onClick={() => handleApplyTheme(theme.id)}
              disabled={isSaving}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-3 rounded-xl text-left transition-all duration-300"
              style={{
                background: isThemeSelected(theme.id)
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isThemeSelected(theme.id)
                  ? '2px solid rgba(139, 92, 246, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Theme Preview Box */}
              <div
                className="w-full aspect-[4/3] rounded-lg mb-2.5 flex items-center justify-center text-xl font-bold text-white relative overflow-hidden"
                style={{ background: getThemeColor(theme) }}
              >
                <motion.span
                  className="relative z-10"
                  animate={isThemeSelected(theme.id) ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getThemeIcon(theme.id)}
                </motion.span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h4 className="font-semibold text-xs text-white truncate mb-0.5">{theme.name}</h4>
              <p className="text-[10px] text-white/50 line-clamp-2 leading-tight">{theme.description}</p>

              {/* Selected Indicator */}
              {isThemeSelected(theme.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {/* Branding Theme Badge */}
              {theme.id === 'branding-personalizado' && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  AUTO
                </div>
              )}

              {/* Dual Mode Theme Badge */}
              {theme.supportsDualMode && theme.id !== 'branding-personalizado' && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-0.5">
                  <span>â˜€ï¸</span><span>/</span><span>ðŸŒ™</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Layout de 2 columnas: Controles y Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Columna Izquierda: Controles de Estilo */}
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
              borderColor: 'rgba(255, 255, 255, 0.1)'
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

            {/* Gradient Selector Visual */}
            {currentStyles.background_type === 'gradient' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  Gradiente
                </label>
                <div className="space-y-4">
                  {/* Selector de Ãngulo */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Ãngulo: {gradientAngle}Â°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: 'var(--org-primary-button-color, #3b82f6)'
                      }}
                      title={`Ãngulo del gradiente: ${gradientAngle}Â°`}
                      aria-label={`Ãngulo del gradiente: ${gradientAngle}Â°`}
                    />
                  </div>

                  {/* Selectores de Colores */}
                  <div className="space-y-3">
                    <label className="block text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Colores del Gradiente
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {gradientColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => updateGradientColor(index, e.target.value)}
                              className="w-16 h-16 rounded-lg cursor-pointer border-2"
                              style={{
                                borderColor: 'var(--org-border-color, #334155)'
                              }}
                              title={`Color ${index + 1} del gradiente: ${color}`}
                              aria-label={`Color ${index + 1} del gradiente: ${color}`}
                            />
                            {gradientColors.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeGradientColor(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                                style={{ fontSize: '10px' }}
                              >
                                Ã—
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const newColor = e.target.value
                              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor) || newColor === '') {
                                updateGradientColor(index, newColor)
                              }
                            }}
                            className="w-20 px-2 py-1 rounded border text-sm"
                            style={{
                              backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                              borderColor: 'var(--org-border-color, #334155)',
                              color: 'var(--org-text-color, #ffffff)'
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
                            color: 'var(--org-text-color, #ffffff)'
                          }}
                        >
                          <span className="text-2xl">+</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vista Previa del Gradiente */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Vista Previa
                    </label>
                    <div className="relative h-12 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--org-border-color, #334155)' }}>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: generateGradientCSS()
                        }}
                      />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyGradientToClipboard}
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                        color: '#ffffff'
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
                          Copiar Código
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const formData = new FormData()
                            formData.append('file', file)
                            formData.append('bucket', 'Panel-Business')
                            formData.append('folder', 'Background')

                            try {
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              const result = await response.json()
                              if (result.success && result.url) {
                                updateStyle(activePanel, 'background_type', 'image')
                                updateStyle(activePanel, 'background_value', result.url)
                              }
                            } catch (err) {
                              // error handled by parent save error state
                            }
                          }
                        }
                        input.click()
                      }}
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border"
                      style={{
                        borderColor: 'var(--org-border-color, #334155)',
                        backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                        color: 'var(--org-text-color, #ffffff)'
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Usar Imagen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Colores UI - Grid de 2 columnas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-400" />
                  Colores UI
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Botón Primario */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Botón Primario</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'primary_button_color', '#3b82f6')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={currentStyles.primary_button_color || '#3b82f6'}
                        onChange={(e) => updateStyle(activePanel, 'primary_button_color', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0"
                        style={{ backgroundColor: currentStyles.primary_button_color }}
                      />
                    </div>
                    <input
                      type="text"
                      value={currentStyles.primary_button_color || '#3b82f6'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'primary_button_color', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Botón Secundario */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Botón Secundario</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'secondary_button_color', '#8b5cf6')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.secondary_button_color || '#8b5cf6'}
                      onChange={(e) => updateStyle(activePanel, 'secondary_button_color', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.secondary_button_color || '#8b5cf6'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'secondary_button_color', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Color de Texto */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Color de Texto</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'text_color', '#ffffff')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.text_color || '#ffffff'}
                      onChange={(e) => updateStyle(activePanel, 'text_color', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.text_color || '#ffffff'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'text_color', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Color de Acento */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Color Acento</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'accent_color', '#60a5fa')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.accent_color || '#60a5fa'}
                      onChange={(e) => updateStyle(activePanel, 'accent_color', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.accent_color || '#60a5fa'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'accent_color', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Fondo de Sidebar */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Fondo Sidebar</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'sidebar_background', '#1e293b')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.sidebar_background || '#1e293b'}
                      onChange={(e) => updateStyle(activePanel, 'sidebar_background', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.sidebar_background || '#1e293b'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'sidebar_background', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Fondo de Tarjetas */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Fondo Tarjetas</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'card_background', '#1e293b')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.card_background || '#1e293b'}
                      onChange={(e) => updateStyle(activePanel, 'card_background', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.card_background || '#1e293b'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'card_background', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Color de Bordes */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Color Bordes</span>
                    <button
                      type="button"
                      onClick={() => updateStyle(activePanel, 'border_color', '#334155')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentStyles.border_color || '#334155'}
                      onChange={(e) => updateStyle(activePanel, 'border_color', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={currentStyles.border_color || '#334155'}
                      onChange={(e) => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value) || e.target.value === '') {
                          updateStyle(activePanel, 'border_color', e.target.value)
                        }
                      }}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Opacidad Modales */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/80">Opacidad Modales</span>
                    <span className="text-[10px] text-white/50">{((currentStyles.modal_opacity || 0.95) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={currentStyles.modal_opacity || 0.95}
                    onChange={(e) => updateStyle(activePanel, 'modal_opacity', Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10"
                    style={{ accentColor: currentStyles.primary_button_color || '#3b82f6' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Columna Derecha: Vista Previa */}
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
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vista Previa</h3>
                <p className="text-xs text-white/50">Así se verá tu panel</p>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: `1px solid ${currentStyles.border_color || '#334155'}`,
                background: currentStyles.background_type === 'gradient' && currentStyles.background_value
                  ? currentStyles.background_value
                  : currentStyles.background_type === 'color' && currentStyles.background_value
                    ? currentStyles.background_value
                    : '#0a0f1e'
              }}
            >
              {/* Simulated Layout */}
              <div className="flex">
                {/* Mini Sidebar */}
                <div
                  className="w-10 min-h-[180px] border-r flex flex-col items-center py-2 gap-1.5"
                  style={{
                    backgroundColor: currentStyles.sidebar_background || '#1e293b',
                    borderColor: currentStyles.border_color || '#334155'
                  }}
                >
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: currentStyles.primary_button_color || '#3b82f6' }} />
                  <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: currentStyles.text_color || '#fff' }} />
                  <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: currentStyles.text_color || '#fff' }} />
                </div>

                {/* Content */}
                <div className="flex-1 p-2 space-y-1.5">
                  <div className="text-[9px] font-bold mb-1" style={{ color: currentStyles.text_color || '#fff' }}>Dashboard</div>

                  <div className="grid grid-cols-2 gap-1">
                    {['PMM', 'Tesis', 'Usuarios', 'Cursos'].map((item, i) => (
                      <div key={i} className="p-1.5 rounded text-[8px]" style={{
                        backgroundColor: currentStyles.card_background || '#1e293b',
                        color: currentStyles.text_color || '#fff',
                        border: `1px solid ${currentStyles.border_color || '#334155'}`
                      }}>
                        <span className="opacity-60">{item}</span>
                        <span className="block font-bold">{[125, 48, 31, 12][i]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-1.5 rounded" style={{ backgroundColor: currentStyles.card_background || '#1e293b', border: `1px solid ${currentStyles.border_color || '#334155'}` }}>
                    <div className="text-[8px] mb-1" style={{ color: currentStyles.text_color || '#fff', opacity: 0.6 }}>Progreso</div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: currentStyles.border_color || '#334155' }}>
                      <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(90deg, ${currentStyles.primary_button_color || '#3b82f6'}, ${currentStyles.secondary_button_color || '#8b5cf6'})` }} />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded text-[8px] font-medium text-white" style={{ backgroundColor: currentStyles.primary_button_color || '#3b82f6' }}>Principal</button>
                    <button className="px-2 py-1 rounded text-[8px] font-medium text-white" style={{ backgroundColor: currentStyles.secondary_button_color || '#8b5cf6' }}>Secundario</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mensajes de Éxito/Error */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{saveError}</p>
        </motion.div>
      )}

      {/* Botones de Acción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
      >
        <div className="flex gap-3">
          <motion.button
            onClick={handleDiscard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa'
            }}
          >
            Descartar
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8'
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </motion.button>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className="relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 w-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
          <div className="relative flex items-center gap-2.5">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
