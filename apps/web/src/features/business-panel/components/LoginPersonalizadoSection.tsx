'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Copy, Info, Link as LinkIcon, Sparkles } from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { type OrganizationData } from '../hooks/useBusinessSettings'

export function LoginPersonalizadoSection({
  organization,
  updateOrganization,
}: {
  organization: OrganizationData
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
}) {
  const theme = useBusinessPanelTheme()
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

  const loginUrl = `${baseUrl}/auth/${organization.slug}`
  const registerUrl = `${baseUrl}/auth/${organization.slug}/register`

  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      })
      return
    }

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
  }

  const handleToggleSSO = async (provider: 'google' | 'microsoft', value: boolean) => {
    if (provider === 'google') setIsUpdatingGoogle(true)
    else setIsUpdatingMicrosoft(true)

    try {
      await updateOrganization({ [`${provider}_login_enabled`]: value })
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
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`,
          borderColor: `color-mix(in srgb, ${theme.warningColor} 20%, transparent)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${theme.warningColor} 12.5%, transparent)` }}
          >
            <AlertCircle className="w-6 h-6" style={{ color: theme.warningColor }} />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: theme.warningColor }}
            >
              Login personalizado no disponible
            </h3>
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              Para acceder al login personalizado necesitas una suscripción activa
              Team, Business o Enterprise.
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
      className="rounded-2xl p-6 border"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
        >
          <LinkIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>
            Link Personalizado de Login
          </h3>
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            Comparte estos links con tus empleados.
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {[
          {
            label: 'Link de Login',
            url: loginUrl,
            copied: copiedLogin,
            type: 'login' as const,
          },
          {
            label: 'Link de Registro',
            url: registerUrl,
            copied: copiedRegister,
            type: 'register' as const,
          },
        ].map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * index }}
          >
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textColor }}
            >
              {item.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.url}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl text-sm border-2 cursor-default"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              />
              <motion.button
                type="button"
                onClick={() => copyToClipboard(item.url, item.type)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg"
                style={{
                  backgroundColor: item.copied
                    ? theme.successColor
                    : theme.actionColor,
                  color: item.copied ? 'var(--color-bg-light)' : theme.onActionColor,
                  boxShadow: `0 6px 18px color-mix(in srgb, ${
                    item.copied ? theme.successColor : theme.actionColor
                  } 20%, transparent)`,
                }}
                title={`Copiar ${item.label.toLowerCase()}`}
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 p-5 rounded-2xl border"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
        }}
      >
        <h4
          className="text-base font-semibold mb-5 flex items-center gap-2"
          style={{ color: theme.textColor }}
        >
          <Sparkles className="w-4 h-4" style={{ color: theme.actionColor }} />
          Inicio de Sesión Social (SSO)
        </h4>

        <div className="space-y-4">
          <SSORow
            label="Google"
            description="Permitir iniciar sesión con Google"
            enabled={Boolean(organization.google_login_enabled)}
            loading={isUpdatingGoogle}
            theme={theme}
            icon={
              <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--color-legacy-4285f4)" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--color-legacy-34a853)" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--color-legacy-fbbc05)" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--color-legacy-ea4335)" />
              </svg>
            }
            onToggle={() =>
              handleToggleSSO('google', !organization.google_login_enabled)
            }
          />

          <div className="h-px" style={{ backgroundColor: theme.dividerColor }} />

          <SSORow
            label="Microsoft"
            description="Permitir iniciar sesión con Microsoft"
            enabled={Boolean(organization.microsoft_login_enabled)}
            loading={isUpdatingMicrosoft}
            theme={theme}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23">
                <path fill="var(--color-legacy-f35022)" d="M1 1h10v10H1z" />
                <path fill="var(--color-legacy-80bb03)" d="M12 1h10v10H12z" />
                <path fill="var(--color-legacy-03a5f0)" d="M1 12h10v10H1z" />
                <path fill="var(--color-legacy-ffba08)" d="M12 12h10v10H12z" />
              </svg>
            }
            onToggle={() =>
              handleToggleSSO('microsoft', !organization.microsoft_login_enabled)
            }
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 border"
        style={{
          backgroundColor: theme.actionSurface,
          borderColor: `color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${theme.actionColor} 12.2%, transparent)` }}
          >
            <Info className="w-5 h-5" style={{ color: theme.actionColor }} />
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ color: theme.textColor }}>
              <strong style={{ color: theme.actionColor }}>Nota:</strong> Los usuarios
              que accedan a estos links verán el login personalizado con tu logo y
              nombre de empresa. Si habilitas SSO, también podrán iniciar sesión
              con Google o Microsoft.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SSORow({
  label,
  description,
  enabled,
  loading,
  onToggle,
  icon,
  theme,
}: {
  label: string
  description: string
  enabled: boolean
  loading: boolean
  onToggle: () => void
  icon: ReactNode
  theme: ReturnType<typeof useBusinessPanelTheme>
}) {
  return (
    <motion.div
      className="flex items-center justify-between p-3 rounded-xl transition-all"
      whileHover={{ x: 2 }}
      style={{ backgroundColor: theme.hoverBg }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg border border-gray-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: theme.subtextColor }}>
            {description}
          </p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onToggle}
        disabled={loading}
        whileTap={{ scale: 0.95 }}
        className="relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none shadow-inner disabled:opacity-60"
        style={{
          backgroundColor: enabled ? theme.actionColor : theme.hoverBg,
        }}
      >
        <motion.span
          animate={{ x: enabled ? 30 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-5 w-5 rounded-full bg-white shadow-lg"
        />
      </motion.button>
    </motion.div>
  )
}
