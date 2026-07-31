'use client'

import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../AdministrativeModal.module.css'

export function ImportUsersFormatInfo() {
  const { t } = useTranslation('business')
  const fields = [
    { field: 'username', description: t('users.modals.import.format.username'), required: true },
    { field: 'email', description: t('users.modals.import.format.email'), required: true },
    { field: 'password', description: t('users.modals.import.format.password'), required: true },
    { field: 'job_title', description: 'Cargo o puesto', required: true },
    { field: 'org_role', description: t('users.modals.import.format.role'), required: false },
    { field: 'date_of_birth', description: t('users.modals.import.format.dateOfBirth'), required: false },
    { field: 'gender', description: t('users.modals.import.format.gender'), required: false },
  ]

  return (
    <section className={styles.formatCard}>
      <h3 className={styles.formatTitle}>
        <FileText aria-hidden="true" />
        {t('users.modals.import.format.title')}
      </h3>
      <div className={styles.formatGrid}>
        {fields.map((item) => (
          <div className={styles.formatItem} key={item.field}>
            <code className={styles.formatCode}>{item.field}</code>
            <span className={styles.formatDescription}>{item.description}</span>
            {item.required && (
              <span className={styles.requiredBadge}>
                {t('users.modals.import.format.required')}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
