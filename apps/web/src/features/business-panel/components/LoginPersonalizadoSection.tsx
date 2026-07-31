'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Copy,
  Info,
  KeyRound,
  Link2,
  ShieldCheck,
} from 'lucide-react'
import { type OrganizationData } from '../hooks/useBusinessSettings'
import styles from './SettingsSections.module.css'

export function LoginPersonalizadoSection({
  organization,
  updateOrganization,
}: {
  organization: OrganizationData
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
}) {
  const [copied, setCopied] = useState<'login' | 'register' | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [updatingProvider, setUpdatingProvider] = useState<
    'google' | 'microsoft' | null
  >(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const loginUrl = `${baseUrl}/auth/${organization.slug}`
  const registerUrl = `${baseUrl}/auth/${organization.slug}/register`
  const canUseCustomLogin =
    Boolean(organization.slug) &&
    ['team', 'business', 'enterprise'].includes(
      organization.subscription_plan || '',
    ) &&
    ['active', 'trial'].includes(organization.subscription_status || '') &&
    organization.is_active

  const copyToClipboard = async (
    text: string,
    type: 'login' | 'register',
  ) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopied(type)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const handleToggleSSO = async (
    provider: 'google' | 'microsoft',
    value: boolean,
  ) => {
    setUpdatingProvider(provider)
    try {
      await updateOrganization({ [`${provider}_login_enabled`]: value })
    } finally {
      setUpdatingProvider(null)
    }
  }

  if (!canUseCustomLogin) {
    return (
      <section className={styles.section}>
        <SectionHeader
          icon={<AlertTriangle />}
          title="Acceso personalizado no disponible"
          description="Esta experiencia requiere una suscripción Team, Business o Enterprise activa."
        />
        <div className={styles.sectionBody}>
          <div className={styles.notice}>
            <Info aria-hidden="true" />
            El acceso estándar de SofLIA continúa disponible. Al actualizar el plan,
            esta configuración se habilitará sin cambios adicionales.
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <SectionHeader
          icon={<Link2 />}
          title="Rutas de acceso"
          description="Enlaces estables para iniciar sesión o registrar miembros dentro de esta organización."
        />
        <div className={styles.sectionBody}>
          <div className={styles.linkList}>
            {[
              {
                label: 'Inicio de sesión',
                url: loginUrl,
                type: 'login' as const,
              },
              {
                label: 'Registro',
                url: registerUrl,
                type: 'register' as const,
              },
            ].map((item) => (
              <div className={styles.linkRow} key={item.type}>
                <div className={styles.linkCopy}>
                  <span>{item.label}</span>
                  <code>{item.url}</code>
                </div>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => void copyToClipboard(item.url, item.type)}
                >
                  {copied === item.type ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {copied === item.type ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          icon={<KeyRound />}
          title="Proveedores de identidad"
          description="Controla qué opciones de inicio de sesión social aparecen en la pantalla de acceso."
        />
        <div className={styles.sectionBody}>
          <div className={styles.providerGrid}>
            <ProviderRow
              label="Google"
              description="Cuenta de Google Workspace o Gmail"
              icon={<GoogleLogo />}
              enabled={Boolean(organization.google_login_enabled)}
              loading={updatingProvider === 'google'}
              onToggle={() =>
                void handleToggleSSO(
                  'google',
                  !organization.google_login_enabled,
                )
              }
            />
            <ProviderRow
              label="Microsoft"
              description="Microsoft 365 y cuentas personales"
              icon={<MicrosoftLogo />}
              enabled={Boolean(organization.microsoft_login_enabled)}
              loading={updatingProvider === 'microsoft'}
              onToggle={() =>
                void handleToggleSSO(
                  'microsoft',
                  !organization.microsoft_login_enabled,
                )
              }
            />
          </div>
        </div>
      </section>

      <div className={styles.notice}>
        <ShieldCheck aria-hidden="true" />
        Los usuarios verán el logotipo y el nombre configurados para esta
        organización. Los proveedores activos se muestran como opciones
        complementarias, no sustituyen el acceso con contraseña.
      </div>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <header className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <div className={styles.sectionCopy}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </header>
  )
}

function ProviderRow({
  label,
  description,
  icon,
  enabled,
  loading,
  onToggle,
}: {
  label: string
  description: string
  icon: ReactNode
  enabled: boolean
  loading: boolean
  onToggle: () => void
}) {
  return (
    <div className={styles.providerRow}>
      <div className={styles.providerIdentity}>
        <span className={styles.providerLogo}>{icon}</span>
        <div className={styles.providerCopy}>
          <strong>{label}</strong>
          <span>{description}</span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={`Permitir acceso con ${label}`}
        aria-checked={enabled}
        className={styles.switch}
        data-checked={enabled}
        disabled={loading}
        onClick={onToggle}
      />
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        className={styles.googleBlue}
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        className={styles.googleGreen}
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06a6.42 6.42 0 0 1-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        className={styles.googleYellow}
        d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        className={styles.googleRed}
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84A6.42 6.42 0 0 1 12 5.38Z"
      />
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 23 23" aria-hidden="true">
      <path className={styles.microsoftRed} d="M1 1h10v10H1z" />
      <path className={styles.microsoftGreen} d="M12 1h10v10H12z" />
      <path className={styles.microsoftBlue} d="M1 12h10v10H1z" />
      <path className={styles.microsoftYellow} d="M12 12h10v10H12z" />
    </svg>
  )
}
