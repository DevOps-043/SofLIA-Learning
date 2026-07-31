'use client'

import { BriefcaseBusiness, Camera, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { UserFormData } from './useUserFormState'
import styles from './BusinessEditUserModal.module.css'

const ROLE_LABELS_FALLBACK = {
  member: { label: 'Miembro', desc: '' },
  admin: { label: 'Administrador', desc: '' },
  owner: { label: 'Propietario', desc: '' },
}

const STATUS_LABELS_FALLBACK = {
  active: 'Activo',
  invited: 'Invitado',
  suspended: 'Suspendido',
  removed: 'Eliminado',
}

interface UserProfilePreviewProps {
  previewImage: string | null
  initials: string
  displayName: string
  email: string
  formData: Pick<UserFormData, 'org_role' | 'org_status' | 'job_title' | 'location'>
  isUploadingImage: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function UserProfilePreview({
  previewImage,
  initials,
  displayName,
  email,
  formData,
  isUploadingImage,
  fileInputRef,
  onFileChange,
}: UserProfilePreviewProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') },
  }

  const statusLabels = {
    active: { label: t('users.status.active'), color: theme.statusColors.active },
    invited: { label: t('users.status.invited'), color: theme.statusColors.invited },
    suspended: { label: t('users.status.suspended'), color: theme.statusColors.suspended },
    removed: { label: t('users.status.removed'), color: theme.statusColors.removed },
  }

  const currentRole = roleLabels[formData.org_role] ?? ROLE_LABELS_FALLBACK[formData.org_role]
  const currentStatus = statusLabels[formData.org_status] ?? {
    label: STATUS_LABELS_FALLBACK[formData.org_status] ?? STATUS_LABELS_FALLBACK.removed,
    color: theme.statusColors.removed,
  }

  return (
    <header className={styles.profileHeader}>
      <div className={styles.avatarStage}>
        <div className={styles.avatar}>
          {previewImage ? (
            <Image src={previewImage} alt="" fill className="object-cover" sizes="108px" />
          ) : (
            initials
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className={styles.avatarAction}
          aria-label={t('users.modals.edit.changePhoto', 'Cambiar fotografía')}
        >
          {isUploadingImage ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <Camera aria-hidden="true" size={17} strokeWidth={1.8} />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <div className={styles.identity}>
        <p className={styles.eyebrow}>{t('users.modals.edit.eyebrow', 'Perfil de miembro')}</p>
        <h2 id="business-edit-user-title" className={styles.displayName}>
          {displayName}
        </h2>
        <p className={styles.email}>{email}</p>
        <div className={styles.identityMeta}>
          <span className={styles.roleBadge}>{currentRole?.label}</span>
          <span className={styles.statusBadge} style={{ color: currentStatus.color }}>
            <span className={styles.statusDot} aria-hidden="true" />
            {currentStatus.label}
          </span>
        </div>
      </div>

      <div className={styles.profileMeta} aria-label={t('users.modals.edit.profileSummary', 'Resumen del perfil')}>
        {formData.job_title ? (
          <div className={styles.metaChip}>
            <BriefcaseBusiness aria-hidden="true" size={15} strokeWidth={1.7} />
            <span>{formData.job_title}</span>
          </div>
        ) : null}
        {formData.location ? (
          <div className={styles.metaChip}>
            <MapPin aria-hidden="true" size={15} strokeWidth={1.7} />
            <span>{formData.location}</span>
          </div>
        ) : null}
      </div>
    </header>
  )
}
