'use client'

import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Shield,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  USER_GENDER_VALUES,
  type UserGender,
} from '../../../lib/schemas/user-demographics.schema'
import {
  PremiumDateTimePicker,
  PremiumSelect,
  type PremiumControlPalette,
} from '@/shared/components/premium-form-controls'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import styles from './AdministrativeModal.module.css'

interface BusinessAddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    display_name?: string
    date_of_birth?: string | null
    gender?: UserGender | null
    job_title: string
    org_role?: 'owner' | 'admin' | 'member'
    profile_picture_url?: string
  }) => Promise<void>
}

type OrganizationRole = 'owner' | 'admin' | 'member'

const initialFormData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  display_name: '',
  date_of_birth: '',
  gender: '' as UserGender | '',
  job_title: '',
  org_role: 'member' as OrganizationRole,
  profile_picture_url: '',
}

export function BusinessAddUserModal({
  isOpen,
  onClose,
  onSave,
}: BusinessAddUserModalProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const theme = useBusinessPanelTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  useEffect(() => {
    const fullName = `${formData.first_name} ${formData.last_name}`.trim()
    setFormData((current) =>
      current.display_name === fullName
        ? current
        : { ...current, display_name: fullName },
    )
  }, [formData.first_name, formData.last_name])

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData)
      setError(null)
      setPreviewImage(null)
      setPendingFile(null)
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLoading, isOpen, onClose])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
    setPendingFile(file)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let profilePictureUrl = formData.profile_picture_url
      if (pendingFile) {
        const upload = new FormData()
        upload.append('file', pendingFile)
        const response = await fetch('/api/business/users/upload-picture', {
          method: 'POST',
          body: upload,
          credentials: 'include',
        })
        if (response.ok) {
          const { imageUrl } = await response.json()
          profilePictureUrl = imageUrl
        }
      }

      await onSave({
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        profile_picture_url: profilePictureUrl || undefined,
      })
      onClose()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No fue posible crear el usuario.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  const roleLabels: Record<
    OrganizationRole,
    { label: string; description: string }
  > = {
    member: {
      label: t('users.roles.member'),
      description: t('users.modals.add.roleDesc.member'),
    },
    admin: {
      label: t('users.roles.admin'),
      description: t('users.modals.add.roleDesc.admin'),
    },
    owner: {
      label: t('users.roles.owner'),
      description: t('users.modals.add.roleDesc.owner'),
    },
  }
  const modalStyle = {
    '--admin-modal-accent': theme.accentColor,
    '--admin-modal-border': theme.borderColor,
    '--admin-modal-danger': theme.dangerColor,
    '--admin-modal-input': theme.inputBg,
    '--admin-modal-muted': theme.mutedTextColor,
    '--admin-modal-on-primary': theme.onPrimaryColor,
    '--admin-modal-primary': theme.primaryColor,
    '--admin-modal-surface': theme.panelBg,
    '--admin-modal-text': theme.textColor,
    '--admin-modal-width': '64rem',
    '--admin-modal-height': '46rem',
  } as CSSProperties
  const controlPalette: PremiumControlPalette = {
    accentColor: theme.accentColor,
    borderColor: theme.borderColor,
    inputBg: theme.inputBg,
    menuBg: theme.panelBg,
    mutedText: theme.mutedTextColor,
    onPrimaryColor: theme.onPrimaryColor,
    primaryColor: theme.primaryColor,
    surfaceColor: theme.panelBg,
    textColor: theme.textColor,
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className={styles.overlay}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onMouseDown={() => {
          if (!isLoading) onClose()
        }}
        style={modalStyle}
      >
        <motion.section
          aria-labelledby="business-add-user-title"
          aria-modal="true"
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={styles.dialog}
          data-testid="business-add-user-modal-panel"
          exit={{ opacity: 0, scale: 0.985, y: 12 }}
          initial={{ opacity: 0, scale: 0.975, y: 18 }}
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className={styles.header}>
            <button
              aria-label="Seleccionar fotografía de perfil"
              className={styles.contextButton}
              onClick={() => fileInputRef.current?.click()}
              title="Fotografía opcional"
              type="button"
            >
              {previewImage ? (
                <Image
                  alt=""
                  className={styles.contextPreview}
                  fill
                  sizes="48px"
                  src={previewImage}
                />
              ) : (
                <UserPlus aria-hidden="true" />
              )}
              <Camera aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              accept="image/*"
              hidden
              onChange={handleImageChange}
              type="file"
            />

            <div className={styles.heading}>
              <p className={styles.eyebrow}>Gestión de acceso</p>
              <h2 className={styles.title} id="business-add-user-title">
                Nuevo usuario
              </h2>
              <p className={styles.subtitle}>
                {formData.display_name || 'Completa los datos y define el nivel de acceso.'}
              </p>
            </div>

            <button
              aria-label={t('users.buttons.close', 'Cerrar')}
              className={styles.closeButton}
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formBody}>
              {error && (
                <div className={styles.alert} role="alert">
                  <AlertCircle aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.columns}>
                <section className={styles.section}>
                  <h3 className={styles.sectionLabel}>Información personal</h3>
                  <div className={styles.fieldGrid}>
                    <Field
                      label="Nombre"
                      name="first_name"
                      onChange={handleChange}
                      placeholder="Nombre"
                      value={formData.first_name}
                    />
                    <Field
                      label="Apellido"
                      name="last_name"
                      onChange={handleChange}
                      placeholder="Apellido"
                      value={formData.last_name}
                    />
                    <Field
                      label="Nombre de usuario"
                      name="username"
                      onChange={handleChange}
                      placeholder="usuario"
                      required
                      value={formData.username}
                      wide
                    />
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Fecha de nacimiento
                      </span>
                      <PremiumDateTimePicker
                        ariaLabel={tc('demographics.dateOfBirth')}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(dateOfBirth) =>
                          setFormData((current) => ({
                            ...current,
                            date_of_birth: dateOfBirth,
                          }))
                        }
                        palette={controlPalette}
                        placeholder="Selecciona una fecha"
                        value={formData.date_of_birth}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Género</span>
                      <PremiumSelect
                        ariaLabel={tc('demographics.gender.label')}
                        icon={UserRound}
                        onChange={(gender) =>
                          setFormData((current) => ({
                            ...current,
                            gender: gender as UserGender | '',
                          }))
                        }
                        options={USER_GENDER_VALUES.map((gender) => ({
                          label: tc(
                            `demographics.gender.options.${gender}`,
                          ),
                          value: gender,
                        }))}
                        palette={controlPalette}
                        placeholder={tc(
                          'demographics.gender.placeholder',
                        )}
                        value={formData.gender}
                      />
                    </label>
                  </div>
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionLabel}>Credenciales y cargo</h3>
                  <div className={styles.fieldGrid}>
                    <Field
                      label="Correo electrónico"
                      name="email"
                      onChange={handleChange}
                      placeholder="nombre@empresa.com"
                      required
                      type="email"
                      value={formData.email}
                      wide
                    />
                    <Field
                      label="Contraseña temporal"
                      name="password"
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      type="password"
                      value={formData.password}
                    />
                    <Field
                      label="Cargo o puesto"
                      name="job_title"
                      onChange={handleChange}
                      placeholder="Ej. Gerente de ventas"
                      required
                      value={formData.job_title}
                    />
                  </div>
                </section>
              </div>

              <section className={styles.section}>
                <h3 className={styles.sectionLabel}>Permisos en la organización</h3>
                <div className={styles.roleGrid}>
                  {(['member', 'admin', 'owner'] as const).map((role) => {
                    const isActive = formData.org_role === role
                    return (
                      <button
                        aria-pressed={isActive}
                        className={isActive ? styles.roleCardActive : styles.roleCard}
                        key={role}
                        onClick={() =>
                          setFormData((current) => ({ ...current, org_role: role }))
                        }
                        type="button"
                      >
                        <span className={styles.roleIcon}>
                          <Shield aria-hidden="true" />
                        </span>
                        <span>
                          <span className={styles.roleName}>{roleLabels[role].label}</span>
                          <span className={styles.roleDescription}>
                            {roleLabels[role].description}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <footer className={styles.footer}>
              <span className={styles.footerHint}>
                <UserPlus aria-hidden="true" />
                Registro individual
              </span>
              <div className={styles.footerActions}>
                <button
                  className={styles.secondaryButton}
                  disabled={isLoading}
                  onClick={onClose}
                  type="button"
                >
                  {t('users.buttons.cancel')}
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'Creando…' : t('users.buttons.create')}
                  {!isLoading && <ArrowRight aria-hidden="true" />}
                </button>
              </div>
            </footer>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function Field({
  ariaLabel,
  label,
  max,
  name,
  onChange,
  placeholder,
  required,
  type = 'text',
  value,
  wide = false,
}: {
  ariaLabel?: string
  label: string
  max?: string
  name: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  type?: string
  value: string
  wide?: boolean
}) {
  return (
    <label className={wide ? styles.fieldWide : styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        aria-label={ariaLabel}
        className={styles.input}
        max={max}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}
