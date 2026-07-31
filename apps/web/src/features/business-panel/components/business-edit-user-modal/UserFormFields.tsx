'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  BriefcaseBusiness,
  CircleAlert,
  FileText,
  Info,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { UserFormData } from './useUserFormState'
import styles from './BusinessEditUserModal.module.css'

interface UserFormFieldsProps {
  formData: UserFormData
  error: string | null
  isLoading: boolean
  isUploadingImage: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onRoleChange: (role: UserFormData['org_role']) => void
  onStatusChange: (status: UserFormData['org_status']) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => Promise<void>
}

interface SectionHeaderProps {
  eyebrow: string
  title: string
  icon: ReactNode
}

function SectionHeader({ eyebrow, title, icon }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIcon} aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className={styles.sectionEyebrow}>{eyebrow}</p>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
    </div>
  )
}

function FieldIcon({ children, top = false }: { children: ReactNode; top?: boolean }) {
  return (
    <span className={`${styles.fieldIcon} ${top ? styles.fieldIconTop : ''}`} aria-hidden="true">
      {children}
    </span>
  )
}

export function UserFormFields({
  formData,
  error,
  isLoading,
  isUploadingImage,
  onChange,
  onRoleChange,
  onStatusChange,
  onClose,
  onSubmit,
}: UserFormFieldsProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') },
  }

  const statusLabels: Record<UserFormData['org_status'], { label: string; color: string }> = {
    active: { label: t('users.status.active'), color: theme.statusColors.active },
    invited: { label: t('users.status.invited'), color: theme.statusColors.invited },
    suspended: { label: t('users.status.suspended'), color: theme.statusColors.suspended },
    removed: { label: t('users.status.removed'), color: theme.statusColors.removed },
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.scrollArea}>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.error}
            role="alert"
          >
            <CircleAlert aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>{error}</span>
          </motion.div>
        ) : null}

        <div className={styles.formGrid}>
          <section className={styles.section}>
            <SectionHeader
              eyebrow={t('users.modals.edit.sectionEyebrow.identity', 'Identidad')}
              title={t('users.sections.personalInfo', 'Información personal')}
              icon={<UserRound size={17} strokeWidth={1.7} />}
            />

            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-first-name">
                  {t('users.modals.add.fields.firstName', 'Nombre')}
                </label>
                <input
                  id="edit-user-first-name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={onChange}
                  className={styles.field}
                  placeholder={t('users.modals.add.placeholders.firstName', 'Ej. Ernesto')}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-last-name">
                  {t('users.modals.add.fields.lastName', 'Apellido')}
                </label>
                <input
                  id="edit-user-last-name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={onChange}
                  className={styles.field}
                  placeholder={t('users.modals.add.placeholders.lastName', 'Ej. Hernández')}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullField}`}>
                <label className={styles.label} htmlFor="edit-user-display-name">
                  {t('users.modals.edit.fields.fullName', 'Nombre para mostrar')}
                </label>
                <input
                  id="edit-user-display-name"
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={onChange}
                  className={styles.field}
                  placeholder={t('users.modals.edit.placeholders.fullName', 'Ej. Ernesto Hernández')}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullField}`}>
                <label className={styles.label} htmlFor="edit-user-email">
                  {t('users.modals.add.fields.email', 'Correo electrónico')}
                </label>
                <div className={styles.fieldWrap}>
                  <FieldIcon>
                    <Mail size={16} strokeWidth={1.7} />
                  </FieldIcon>
                  <input
                    id="edit-user-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    className={`${styles.field} ${styles.fieldWithIcon}`}
                    placeholder={t('users.modals.add.placeholders.email', 'correo@empresa.com')}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <SectionHeader
              eyebrow={t('users.modals.edit.sectionEyebrow.context', 'Contexto')}
              title={t('users.sections.professionalDetails', 'Detalles profesionales')}
              icon={<BriefcaseBusiness size={17} strokeWidth={1.7} />}
            />

            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-platform-role">
                  {t('users.modals.add.fields.position', 'Cargo / puesto')}
                </label>
                <div className={styles.fieldWrap}>
                  <FieldIcon>
                    <BriefcaseBusiness size={16} strokeWidth={1.7} />
                  </FieldIcon>
                  <input
                    id="edit-user-platform-role"
                    type="text"
                    name="platform_role"
                    value={formData.platform_role}
                    onChange={onChange}
                    className={`${styles.field} ${styles.fieldWithIcon}`}
                    placeholder={t('users.modals.add.placeholders.position', 'Ej. Dirección')}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-job-title">
                  {t('users.modals.edit.fields.typeRole', 'Área o especialidad')}
                </label>
                <input
                  id="edit-user-job-title"
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={onChange}
                  className={styles.field}
                  placeholder={t('users.modals.edit.placeholders.typeRole', 'Ej. Tecnología')}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-phone">
                  {t('users.modals.edit.fields.phone', 'Teléfono')}
                </label>
                <div className={styles.fieldWrap}>
                  <FieldIcon>
                    <Phone size={16} strokeWidth={1.7} />
                  </FieldIcon>
                  <input
                    id="edit-user-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    className={`${styles.field} ${styles.fieldWithIcon}`}
                    placeholder={t('users.modals.edit.placeholders.phone', '+52 ...')}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="edit-user-location">
                  {t('users.modals.edit.fields.location', 'Ubicación')}
                </label>
                <div className={styles.fieldWrap}>
                  <FieldIcon>
                    <MapPin size={16} strokeWidth={1.7} />
                  </FieldIcon>
                  <input
                    id="edit-user-location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={onChange}
                    className={`${styles.field} ${styles.fieldWithIcon}`}
                    placeholder={t('users.modals.edit.placeholders.location', 'Ciudad, país')}
                  />
                </div>
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullField}`}>
                <label className={styles.label} htmlFor="edit-user-bio">
                  {t('users.modals.edit.fields.bio', 'Biografía')}
                </label>
                <div className={styles.fieldWrap}>
                  <FieldIcon top>
                    <FileText size={16} strokeWidth={1.7} />
                  </FieldIcon>
                  <textarea
                    id="edit-user-bio"
                    name="bio"
                    value={formData.bio}
                    onChange={onChange}
                    rows={3}
                    className={`${styles.field} ${styles.fieldWithIcon}`}
                    placeholder={t('users.modals.edit.placeholders.bio', 'Añade una breve descripción profesional')}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.accessSection}`}>
            <SectionHeader
              eyebrow={t('users.modals.edit.sectionEyebrow.permissions', 'Permisos')}
              title={t('users.sections.accessConfig', 'Configuración de acceso')}
              icon={<ShieldCheck size={17} strokeWidth={1.7} />}
            />

            <div className={styles.accessGrid}>
              <fieldset>
                <legend className={styles.optionLegend}>
                  {t('users.modals.add.fields.orgRole', 'Rol en la organización')}
                </legend>
                <div className={styles.roleGrid}>
                  {(['member', 'admin', 'owner'] as const).map((role) => {
                    const isActive = formData.org_role === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => onRoleChange(role)}
                        className={`${styles.roleOption} ${isActive ? styles.roleOptionActive : ''}`}
                        aria-pressed={isActive}
                      >
                        <span className={styles.roleIcon}>
                          <ShieldCheck aria-hidden="true" size={14} strokeWidth={1.7} />
                        </span>
                        <span className={styles.roleLabel}>{roleLabels[role].label}</span>
                        <span className={styles.roleDescription}>{roleLabels[role].desc}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className={styles.optionLegend}>
                  {t('users.modals.edit.fields.status', 'Estado de la cuenta')}
                </legend>
                <div className={styles.statusGrid}>
                  {(['active', 'invited', 'suspended', 'removed'] as const).map((status) => {
                    const isActive = formData.org_status === status
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusChange(status)}
                        className={`${styles.statusOption} ${isActive ? styles.statusOptionActive : ''}`}
                        style={{ '--status-color': statusLabels[status].color } as CSSProperties}
                        aria-pressed={isActive}
                      >
                        <span className={styles.statusDot} aria-hidden="true" />
                        <span className={styles.statusLabel}>{statusLabels[status].label}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          </section>
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerNote}>
          <Info aria-hidden="true" size={15} strokeWidth={1.7} />
          {t(
            'users.modals.edit.infoNote',
            'Los cambios se aplicarán al perfil y a sus permisos dentro de la organización.'
          )}
        </p>
        <div className={styles.footerActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={styles.secondaryButton}
          >
            {t('users.buttons.cancel', 'Cancelar')}
          </button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || isUploadingImage}
            className={styles.primaryButton}
          >
            {isLoading || isUploadingImage ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>
                  {isUploadingImage
                    ? t('users.buttons.uploading', 'Subiendo...')
                    : t('users.buttons.saving', 'Guardando...')}
                </span>
              </>
            ) : (
              <>
                <Save aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>{t('users.buttons.save', 'Guardar cambios')}</span>
              </>
            )}
          </motion.button>
        </div>
      </footer>
    </form>
  )
}
