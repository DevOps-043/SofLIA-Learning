'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, Copy, Info, Link as LinkIcon, Sparkles } from 'lucide-react'
import { useThemeStore } from '@/core/stores/themeStore'
import { type OrganizationData } from '../hooks/useBusinessSettings'

export function LoginPersonalizadoSection({
  organization,
  updateOrganization
}: {
  organization: OrganizationData
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
}) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [isUpdatingGoogle, setIsUpdatingGoogle] = useState(false)
  const [isUpdatingMicrosoft, setIsUpdatingMicrosoft] = useState(false)

  useEffect(() => {
    // Obtener URL base del navegador
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const loginUrl = `${baseUrl}/auth/${organization.slug}`
  const registerUrl = `${baseUrl}/auth/${organization.slug}/register`

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
      }).catch(() => {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
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

  const canUseCustomLogin = () => {
    if (!organization.slug) return false
    const allowedPlans = ['team', 'business', 'enterprise']
    const activeStatuses = ['active', 'trial']
    return (
      allowedPlans.includes(organization.subscription_plan || '') &&
      activeStatuses.includes(organization.subscription_status || '') &&
      organization.is_active
    )
  }

  if (!canUseCustomLogin()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 border backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
          borderColor: 'rgba(234, 179, 8, 0.3)'
        }}
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-yellow-500/20"
          >
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">
              Login Personalizado No Disponible
            </h3>
            <p className="text-yellow-300/80 text-sm">
              Para acceder a login personalizado, necesitas una suscripción activa (Team, Business o Enterprise).
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl" />
      </div>

      {/* Header with icon */}
      <div className="relative flex items-center gap-3 mb-6">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
        >
          <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Link Personalizado de Login</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comparte estos links con tus empleados</p>
        </div>
      </div>

      {/* Links de Login y Registro */}
      <div className="space-y-4 mb-6">
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
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(10, 37, 64, 0.3)'
                }}
                title={`Copiar ${item.label.toLowerCase()}`}
              >
                {item.copied ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
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

      {/* Configuración SSO - Premium Design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 p-5 rounded-2xl border backdrop-blur-md bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
      >
        <h4 className="text-base font-semibold mb-5 text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Inicio de Sesión Social (SSO)
        </h4>
        <div className="space-y-4">
          {/* Google Switch */}
          <motion.div
            className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg border border-gray-100 dark:border-transparent">
                <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Google</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permitir iniciar sesión con Google</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('google', !organization.google_login_enabled)}
              disabled={isUpdatingGoogle}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.google_login_enabled
                  ? 'linear-gradient(135deg, #0A2540, #1e3a5f)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.google_login_enabled ? 30 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-5 w-5 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>

          <div className="h-px bg-gray-200 dark:bg-white/10" />

          {/* Microsoft Switch */}
          <motion.div
            className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg border border-gray-100 dark:border-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23">
                  <path fill="#f35022" d="M1 1h10v10H1z" />
                  <path fill="#80bb03" d="M12 1h10v10H12z" />
                  <path fill="#03a5f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Microsoft</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permitir iniciar sesión con Microsoft</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('microsoft', !organization.microsoft_login_enabled)}
              disabled={isUpdatingMicrosoft}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.microsoft_login_enabled
                  ? 'linear-gradient(135deg, #0A2540, #1e3a5f)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.microsoft_login_enabled ? 30 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-5 w-5 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Información adicional - Premium Info Box */}
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
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-lg bg-blue-500/20"
          >
            <Info className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong className="text-blue-800 dark:text-blue-200">Nota:</strong> Los usuarios que accedan a estos links verán el login personalizado con tu logo y nombre de empresa.
              Si intentan acceder al login principal, serán redirigidos automáticamente a tu login personalizado.
            </p>
          </div>
        </div>
        {/* Subtle animated gradient */}
        <motion.div
          className="absolute inset-0 opacity-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
            backgroundSize: '200% 100%'
          }}
        />
      </motion.div>
    </motion.div>
  )
}

