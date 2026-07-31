import { motion } from 'framer-motion'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BusinessCourseDetail } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

interface BusinessCourseDetailSidebarProps {
  course: BusinessCourseDetail
  setIsAssignModalOpen: (value: boolean) => void
  onOpenDefaultModal: () => void
  isPurchasing: boolean
  purchaseSuccess: boolean
  purchaseError: string | null
  primaryColor: string
  accentColor: string
  cardBackground: string
  borderColor: string
  dividerColor: string
  textColor: string
  mutedTextColor: string
  onPrimaryColor: string
  successColor: string
  dangerColor: string
  onPurchase: () => void
  formatDate: (dateString: string) => string
}

export function BusinessCourseDetailSidebar({
  course,
  setIsAssignModalOpen,
  onOpenDefaultModal,
  isPurchasing,
  purchaseSuccess,
  purchaseError,
  successColor,
  dangerColor,
  onPurchase,
  formatDate,
}: BusinessCourseDetailSidebarProps) {
  const { t } = useTranslation('business')
  const isPurchased = course.subscription_status?.is_organization_purchased
  const isFree = course.subscription_status?.can_purchase_for_free

  const statusTitle = isPurchased
    ? 'Adquirido'
    : isFree
      ? 'Disponible sin costo'
      : `$${course.price?.toFixed(2) || '0.00'} USD`
  const statusDescription = isPurchased
    ? 'Listo para asignar'
    : isFree
      ? 'Incluido en tu membresía'
      : 'Licencia para tu organización'

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className={styles.sidebar}
      aria-labelledby="course-access-title"
    >
      <span className={styles.sidebarAccent} aria-hidden="true" />
      <header className={styles.sidebarStatus}>
        <span className={styles.sidebarStatusIcon} aria-hidden="true">
          {isPurchased ? <CheckCircle2 /> : <Zap />}
        </span>
        <div className={styles.sidebarStatusCopy}>
          <small>Estado de acceso</small>
          <strong id="course-access-title">{statusTitle}</strong>
          <span>{statusDescription}</span>
        </div>
      </header>

      {purchaseSuccess ? (
        <div
          className={styles.sidebarMessage}
          role="status"
          style={{
            color: successColor,
            borderColor: `color-mix(in srgb, ${successColor} 25%, var(--detail-border))`,
            backgroundColor: `color-mix(in srgb, ${successColor} 7%, transparent)`,
          }}
        >
          <CheckCircle2 aria-hidden="true" />
          Curso adquirido correctamente. Ya puedes asignarlo.
        </div>
      ) : null}

      {purchaseError ? (
        <div
          className={styles.sidebarMessage}
          role="alert"
          style={{
            color: dangerColor,
            borderColor: `color-mix(in srgb, ${dangerColor} 25%, var(--detail-border))`,
            backgroundColor: `color-mix(in srgb, ${dangerColor} 7%, transparent)`,
          }}
        >
          <AlertCircle aria-hidden="true" />
          {purchaseError}
        </div>
      ) : null}

      <div className={styles.sidebarActions}>
        <button
          type="button"
          onClick={isPurchased ? () => setIsAssignModalOpen(true) : onPurchase}
          disabled={isPurchasing || course.subscription_status?.has_subscription === false}
          className={styles.sidebarPrimary}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Procesando
            </>
          ) : isPurchased ? (
            <>
              <span className={styles.buttonIcon}><Users aria-hidden="true" /></span>
              Asignar a usuarios
            </>
          ) : (
            <>
              <span className={styles.buttonIcon}><Zap aria-hidden="true" /></span>
              Adquirir curso
            </>
          )}
        </button>

        {isPurchased ? (
          <button type="button" onClick={onOpenDefaultModal} className={styles.sidebarSecondary}>
            <span className={styles.buttonIcon}><Sparkles aria-hidden="true" /></span>
            {t('assignCourse.defaults.title')}
          </button>
        ) : null}
      </div>

      {course.subscription_status?.has_subscription === false ? (
        <p className={styles.sidebarNote}>Requiere una membresía activa.</p>
      ) : null}

      <ul className={styles.featureList}>
        <li><span className={styles.featureIcon}><Shield aria-hidden="true" /></span><span>Acceso de por vida</span></li>
        <li><span className={styles.featureIcon}><Video aria-hidden="true" /></span><span>{course.stats.total_lessons} lecciones en video</span></li>
        <li><span className={styles.featureIcon}><Award aria-hidden="true" /></span><span>Certificado de finalización</span></li>
        <li><span className={styles.featureIcon}><TrendingUp aria-hidden="true" /></span><span>Actualizado {formatDate(course.updated_at)}</span></li>
      </ul>
    </motion.section>
  )
}
