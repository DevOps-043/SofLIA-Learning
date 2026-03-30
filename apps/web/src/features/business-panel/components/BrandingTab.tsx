'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, XCircle, CheckCircle, AlertCircle, Loader2, Sparkles, Globe, Save, Palette, Image as ImageIcon } from 'lucide-react'
import { useBranding } from '../hooks/useBranding'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

export function BrandingTab() {
  const { branding, isLoading, error, updateBranding, detectColors } = useBranding()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localBranding, setLocalBranding] = useState({
    favicon_url: '',
    banner_url: '',
    color_primary: '#3b82f6',
    color_secondary: '#10b981',
    color_accent: '#8b5cf6'
  })
  const isInitialLoad = useRef(true)
  const previousBannerUrl = useRef<string>('')

  // Sincronizar estado local cuando se carga el branding
  useEffect(() => {
    if (branding) {
      setLocalBranding({
        favicon_url: branding.favicon_url || '',
        banner_url: branding.banner_url || '',
        color_primary: branding.color_primary,
        color_secondary: branding.color_secondary,
        color_accent: branding.color_accent
      })
      previousBannerUrl.current = branding.banner_url || ''
      isInitialLoad.current = false
    }
  }, [branding])

  // Detectar colores automáticamente cuando se sube un nuevo banner
  useEffect(() => {
    // No detectar en la carga inicial
    if (isInitialLoad.current) return

    // Solo detectar si el banner_url cambió y no es vacío
    if (localBranding.banner_url &&
      localBranding.banner_url !== previousBannerUrl.current &&
      localBranding.banner_url.trim() !== '') {

      // Actualizar la referencia
      previousBannerUrl.current = localBranding.banner_url

      // Detectar colores automáticamente
      const autoDetectColors = async () => {
        setIsDetecting(true)
        setSaveError(null)
        setSaveSuccess(null)

        try {
          const colors = await detectColors(localBranding.banner_url)

          if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
            setLocalBranding(prev => ({
              ...prev,
              color_primary: colors.color_primary,
              color_secondary: colors.color_secondary,
              color_accent: colors.color_accent
            }))
            setSaveSuccess('Colores detectados automáticamente')
            setTimeout(() => setSaveSuccess(null), 5000)
          }
        } catch (err) {
          console.error('Error detectando colores automáticamente:', err)
          // No mostrar error si falla la detección automática, solo loguear
        } finally {
          setIsDetecting(false)
        }
      }

      // Pequeño delay para asegurar que la imagen esté cargada
      setTimeout(() => {
        autoDetectColors()
      }, 500)
    }
  }, [localBranding.banner_url, detectColors])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateBranding(localBranding)

      if (success) {
        setSaveSuccess('Branding actualizado correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
        // Refrescar estilos para aplicar cambios
        await refetchStyles()
      } else {
        setSaveError('Error al actualizar el branding')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar el branding')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectColors = async () => {
    if (!localBranding.banner_url) {
      setSaveError('Primero debes subir un banner')
      setTimeout(() => setSaveError(null), 5000)
      return
    }

    setIsDetecting(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      // Validar que la URL del banner sea válida
      if (!localBranding.banner_url || typeof localBranding.banner_url !== 'string') {
        throw new Error('URL del banner inválida')
      }

      // Usar la función de detección de colores del hook (ahora es cliente)
      const colors = await detectColors(localBranding.banner_url)

      if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
        setLocalBranding(prev => ({
          ...prev,
          color_primary: colors.color_primary,
          color_secondary: colors.color_secondary,
          color_accent: colors.color_accent
        }))
        setSaveSuccess('Colores detectados automáticamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        throw new Error('No se pudieron detectar colores del banner. Asegúrate de que la imagen sea accesible.')
      }
    } catch (err) {
      console.error('Error detectando colores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al detectar colores'
      setSaveError(errorMessage)
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsDetecting(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full mb-6"
          style={{
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        />
        <p className="text-white/60">Cargando configuración de marca...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <XCircle className="w-20 h-20 mx-auto mb-6 text-red-400" />
        </motion.div>
        <p className="text-lg mb-4 text-red-300">{error}</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Grid - Logo y Favicon lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Card: Logo Principal - Más compacto */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2.5 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})` }}
              >
                <ImageIcon className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-white">Logo Principal</h3>
                <p className="text-xs text-white/50">Tu imagen de marca</p>
              </div>
            </div>

            {/* Logo Preview Zone - Más pequeño */}
            <motion.div
              className="relative mb-4 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,245,245,0.95))',
                height: '120px'
              }}
            >
              {localBranding.banner_url ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center h-full p-4"
                >
                  <img
                    src={localBranding.banner_url}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs">Sin logo</p>
                </div>
              )}

              {/* Detecting Overlay */}
              {isDetecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 rounded-full mb-2"
                    style={{ borderColor: 'transparent', borderTopColor: localBranding.color_primary }}
                  />
                  <p className="text-white text-xs">Detectando colores...</p>
                </motion.div>
              )}
            </motion.div>

            {/* Upload Zone - Compacto */}
            <motion.div
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
                    formData.append('folder', 'Logo-Empresa')
                    try {
                      const response = await fetch('/api/upload', { method: 'POST', body: formData })
                      const result = await response.json()
                      if (result.success && result.url) {
                        setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('bucket', 'Panel-Business')
                  formData.append('folder', 'Logo-Empresa')
                  try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData })
                    const result = await response.json()
                    if (result.success && result.url) {
                      setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                    }
                  } catch (err) {
                    setSaveError('Error al subir la imagen')
                    setTimeout(() => setSaveError(null), 5000)
                  }
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300"
              style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-white/50" />
              <p className="text-white/70 text-sm font-medium">Arrastra o haz clic</p>
              <p className="text-white/40 text-xs mt-1">PNG, JPG hasta 5MB</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Card: Favicon con Preview de Auth/Login */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
              >
                <Globe className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-white">Favicon & Login</h3>
                <p className="text-xs text-white/50">Vista previa del login</p>
              </div>
            </div>

            {/* Auth/Login Preview Mockup */}
            <motion.div
              className="mb-4 rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${localBranding.color_primary}15, ${localBranding.color_secondary}10)`,
                border: `1px solid ${localBranding.color_primary}30`,
                height: '120px'
              }}
            >
              <div className="h-full flex items-center justify-center p-3">
                <div className="flex items-center gap-4">
                  {/* Logo/Favicon preview */}
                  <div className="flex-shrink-0">
                    {localBranding.favicon_url ? (
                      <motion.img
                        src={localBranding.favicon_url}
                        alt="Favicon"
                        className="w-14 h-14 object-contain"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${localBranding.color_primary}30` }}
                      >
                        <Globe className="w-7 h-7" style={{ color: localBranding.color_primary }} />
                      </div>
                    )}
                  </div>

                  {/* Login form preview */}
                  <div className="space-y-2">
                    <div className="w-28 h-2.5 rounded bg-white/20" />
                    <div className="w-28 h-6 rounded bg-white/10 border border-white/20" />
                    <div
                      className="w-28 h-5 rounded text-xs flex items-center justify-center text-white font-medium"
                      style={{ background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})` }}
                    >
                      Iniciar Sesión
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upload Button */}
            <motion.button
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
                    formData.append('folder', 'Favicon')
                    try {
                      const response = await fetch('/api/upload', { method: 'POST', body: formData })
                      const result = await response.json()
                      if (result.success && result.url) {
                        setLocalBranding(prev => ({ ...prev, favicon_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.08))',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                color: '#a78bfa'
              }}
            >
              <Upload className="w-4 h-4" />
              Subir Favicon
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Color Palette Section - 3 Colores en una fila */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header con botón de auto-detectar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Palette className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h3 className="text-base font-bold text-white">Paleta de Colores</h3>
              <p className="text-xs text-white/50">Define los 3 colores de tu marca</p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleDetectColors}
            disabled={isDetecting || !localBranding.banner_url}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24'
            }}
          >
            {isDetecting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
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

        {/* 3 Color Pickers en una fila */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Primary Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}15, ${localBranding.color_primary}05)`,
              border: `1px solid ${localBranding.color_primary}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_primary }}
              >
                <input
                  type="color"
                  value={localBranding.color_primary}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_primary: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Primario</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_primary}</p>
              </div>
            </div>
          </motion.div>

          {/* Secondary Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_secondary}15, ${localBranding.color_secondary}05)`,
              border: `1px solid ${localBranding.color_secondary}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_secondary }}
              >
                <input
                  type="color"
                  value={localBranding.color_secondary}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_secondary: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Secundario</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_secondary}</p>
              </div>
            </div>
          </motion.div>

          {/* Accent Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_accent}15, ${localBranding.color_accent}05)`,
              border: `1px solid ${localBranding.color_accent}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_accent }}
              >
                <input
                  type="color"
                  value={localBranding.color_accent}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_accent: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Acento</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_accent}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vista Previa Compacta */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Vista Previa</p>

          {/* Gradient Bar más pequeña */}
          <div
            className="h-12 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary}, ${localBranding.color_accent})`,
              boxShadow: `0 8px 30px ${localBranding.color_primary}25`
            }}
          >
            <span className="font-bold text-sm tracking-wide" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Tu Marca</span>
          </div>

          {/* Button Previews */}
          <div className="flex flex-wrap gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm shadow-md"
              style={{
                background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})`,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Primario
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{
                backgroundColor: 'transparent',
                border: `1.5px solid ${localBranding.color_primary}`,
                color: localBranding.color_primary
              }}
            >
              Secundario
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{ 
                backgroundColor: localBranding.color_accent,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Acento
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Messages y Botón de Guardar */}
      <div className="space-y-4">
        {/* Success/Error Messages */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm font-medium">{saveSuccess}</p>
          </motion.div>
        )}

        {saveError && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm font-medium">{saveError}</p>
          </motion.div>
        )}

        {/* Botón Guardar Premium */}
        <div className="flex justify-end">
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            className="relative overflow-hidden px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})`,
              boxShadow: `0 8px 30px ${localBranding.color_primary}40`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
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
        </div>
      </div>
    </div>
  )
}

