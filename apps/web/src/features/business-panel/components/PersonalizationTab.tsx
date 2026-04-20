'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, CheckCircle, Copy, Info, Link as LinkIcon, Loader2, Save, Settings2, Sparkles } from 'lucide-react'
import { useMotionSafe } from '../../../lib/utils/motion'
import { type OrganizationData } from '../hooks/useBusinessSettings'

export function PersonalizationTab({
  organization,
  updateOrganization,
  saveSuccess,
  setSaveSuccess,
  saveError,
  setSaveError
}: {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const { disableHeavy } = useMotionSafe()
  const [slug, setSlug] = useState(organization?.slug || '')
  const [isSaving, setIsSaving] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [isUpdatingGoogle, setIsUpdatingGoogle] = useState(false)
  const [isUpdatingMicrosoft, setIsUpdatingMicrosoft] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (organization?.slug) {
      setSlug(organization.slug)
    }
  }, [organization?.slug])

  const loginUrl = slug ? `${baseUrl}/auth/${slug}` : ''
  const registerUrl = slug ? `${baseUrl}/auth/${slug}/register` : ''

  // Validar formato del slug
  const validateSlug = (value: string): string | null => {
    if (!value) return 'El identificador es requerido'
    if (value.length < 3) return 'Mínimo 3 caracteres'
    if (value.length > 50) return 'Máximo 50 caracteres'
    if (!/^[a-z0-9-]+$/.test(value)) return 'Solo letras minúsculas, números y guiones'
    if (value.startsWith('-') || value.endsWith('-')) return 'No puede empezar o terminar con guión'
    return null
  }

  // Verificar disponibilidad del slug (debounced)
  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (!slug || slug === organization?.slug) {
        setSlugAvailable(null)
        return
      }

      const error = validateSlug(slug)
      if (error) {
        setSlugError(error)
        setSlugAvailable(null)
        return
      }

      setIsCheckingSlug(true)
      setSlugError(null)

      try {
        const fetchUrl = orgSlug 
          ? `/api/${orgSlug}/business/settings/check-slug?slug=${encodeURIComponent(slug)}`
          : `/api/business/settings/check-slug?slug=${encodeURIComponent(slug)}`;

        const response = await fetch(fetchUrl, {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.success) {
          setSlugAvailable(data.available)
          if (!data.available) {
            setSlugError('Este identificador ya está en uso')
          }
        }
      } catch (err) {
      } finally {
        setIsCheckingSlug(false)
      }
    }

    const debounceTimeout = setTimeout(checkSlugAvailability, 500)
    return () => clearTimeout(debounceTimeout)
  }, [slug, organization?.slug])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(value)
    setSlugAvailable(null)
    
    const error = validateSlug(value)
    setSlugError(error)
  }

  const handleSaveSlug = async () => {
    if (!slug || slugError || !slugAvailable) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateOrganization({ slug })
      
      if (success) {
        setSaveSuccess('Identificador de login guardado correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
        setSlugAvailable(null)
      } else {
        setSaveError('Error al guardar el identificador')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSSO = async (provider: 'google' | 'microsoft', value: boolean) => {
    if (provider === 'google') setIsUpdatingGoogle(true)
    else setIsUpdatingMicrosoft(true)

    try {
      await updateOrganization({
        [`${provider}_login_enabled`]: value
      })
    } finally {
      if (provider === 'google') setIsUpdatingGoogle(false)
      else setIsUpdatingMicrosoft(false)
    }
  }

  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      })
    }
  }

  if (!organization) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <Info className="w-20 h-20 mx-auto mb-6 text-white/60" />
        <p className="text-white/80 text-lg">No hay información de organización disponible</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header de la sección */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
      >
        <div className="p-3 rounded-xl bg-amber-500/20">
          <Settings2 className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Login Personalizado</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configura tu enlace de inicio de sesión exclusivo y opciones de SSO</p>
        </div>
      </motion.div>

      {/* Configuración del Slug */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent blur-2xl" />
        </div>

        <div className="relative flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
          >
            <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identificador de URL</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define el identificador único para tu link de login</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Identificador (slug) *
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="flex items-center">
                  <span className="px-4 py-3 rounded-l-xl border-2 border-r-0 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-sm border-gray-200 dark:border-white/10">
                    {baseUrl}/auth/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="mi-empresa"
                    className={`flex-1 px-4 py-3 rounded-r-xl border-2 transition-all duration-300 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                      slugError 
                        ? 'border-red-500 focus:border-red-500' 
                        : slugAvailable === true 
                          ? 'border-green-500 focus:border-green-500' 
                          : 'border-gray-200 dark:border-white/10 focus:border-amber-500'
                    }`}
                  />
                </div>
                {isCheckingSlug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full"
                    />
                  </div>
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <motion.button
                type="button"
                onClick={handleSaveSlug}
                disabled={isSaving || !slug || !!slugError || slugAvailable !== true}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff'
                }}
              >
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
                    Guardar
                  </>
                )}
              </motion.button>
            </div>
            {slugError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 mt-2 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {slugError}
              </motion.p>
            )}
            {slugAvailable === true && !slugError && slug !== organization?.slug && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-400 mt-2 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Identificador disponible
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Links de Login (solo si hay slug configurado) */}
      {organization.slug && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
        >
          <div className="relative flex items-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-3 rounded-xl"
              style={{ background: isDark ? 'linear-gradient(135deg, #0A2540, #1e3a5f)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Links de Acceso</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comparte estos links con tus empleados</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Link de Login', url: loginUrl, copied: copiedLogin, type: 'login' as const },
              { label: 'Link de Registro', url: registerUrl, copied: copiedRegister, type: 'register' as const }
            ].map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {item.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.url}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl text-sm bg-white dark:bg-white/5 border-2 cursor-default border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                  />
                  <motion.button
                    type="button"
                    onClick={() => copyToClipboard(item.url, item.type)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg"
                    style={{
                      background: item.copied
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #0A2540, #1e3a5f)',
                      color: '#ffffff'
                    }}
                  >
                    {item.copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Configuración SSO */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="relative flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inicio de Sesión Social (SSO)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Permite a tus usuarios iniciar sesión con sus cuentas de Google o Microsoft</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Google Switch */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-gray-100 dark:border-transparent">
                <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">Google</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permitir inicio de sesión con Google</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('google', !organization.google_login_enabled)}
              disabled={isUpdatingGoogle}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.google_login_enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.google_login_enabled ? 34 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-6 w-6 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>

          {/* Microsoft Switch */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-gray-100 dark:border-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23">
                  <path fill="#f35022" d="M1 1h10v10H1z" />
                  <path fill="#80bb03" d="M12 1h10v10H12z" />
                  <path fill="#03a5f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">Microsoft</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permitir inicio de sesión con Microsoft</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('microsoft', !organization.microsoft_login_enabled)}
              disabled={isUpdatingMicrosoft}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.microsoft_login_enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.microsoft_login_enabled ? 34 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-6 w-6 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1))',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-start gap-4 relative z-10">
          <motion.div
            animate={disableHeavy ? {} : { rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-lg bg-blue-500/20"
          >
            <Info className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong className="text-blue-800 dark:text-blue-200">Nota:</strong> Los usuarios que accedan a tu link personalizado verán el login con tu logo y branding.
              Si habilitas SSO, podrán elegir iniciar sesión con Google o Microsoft además de email/contraseña.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mensajes de éxito/error */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <p className="text-emerald-300 font-medium">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-red-300 font-medium">{saveError}</p>
        </motion.div>
      )}
    </div>
  )
}

// Tab: Branding
