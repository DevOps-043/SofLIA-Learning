'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BusinessAssignCourseModal } from '../../../../../features/business-panel/components/BusinessAssignCourseModal'
import { BusinessCourseDefaultModal } from '../../../../../features/business-panel/components/BusinessCourseDefaultModal'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { BusinessCourseContentTab } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseContentTab'
import { BusinessCourseDetailHero } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseDetailHero'
import { BusinessCourseDetailSidebar } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseDetailSidebar'
import {
  BusinessCourseDetailErrorState,
  BusinessCourseDetailLoadingState
} from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseDetailStates'
import { BusinessCourseDetailTabs } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseDetailTabs'
import { BusinessCourseInfoTab } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseInfoTab'
import { BusinessCourseInstructorTab } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseInstructorTab'
import { BusinessCourseReviewsTab } from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseReviewsTab'
import { useBusinessCourseDetailPageLogic } from '../../../../../features/business-panel/hooks/useBusinessCourseDetailPageLogic'
import { useBusinessPanelTheme } from '../../../../../features/business-panel/hooks/useBusinessPanelTheme'
import { useTour } from '@/features/tours'
import { businessPanelCourseDetailTour } from '@/features/tours/config/business-panel-courses.tour'
import styles from '../../../../../features/business-panel/components/business-course-detail/BusinessCourseDetail.module.css'

type DetailVariables = CSSProperties & Record<`--detail-${string}`, string>

export default function BusinessCourseDetailPage() {
  const logic = useBusinessCourseDetailPageLogic()
  const theme = useBusinessPanelTheme()
  const { autoStartIfNeeded } = useTour(businessPanelCourseDetailTour)

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container')
    scrollContainer?.scrollTo({ top: 0, behavior: 'auto' })
  }, [logic.courseId])

  useEffect(() => {
    if (!logic.loading && !logic.error && logic.course) {
      return autoStartIfNeeded()
    }
  }, [autoStartIfNeeded, logic.loading, logic.error, logic.course])

  if (logic.loading) {
    return <BusinessCourseDetailLoadingState />
  }

  if (logic.error || !logic.course) {
    return (
      <BusinessCourseDetailErrorState
        error={logic.error || 'Curso no encontrado'}
        courseId={logic.courseId}
        onBack={() => logic.router.push(`/${logic.params.orgSlug}/business-panel/courses`)}
      />
    )
  }

  const detailVariables: DetailVariables = {
    '--detail-accent': theme.accentColor,
    '--detail-action': theme.actionColor,
    '--detail-border': theme.borderColor,
    '--detail-card': theme.cardBg,
    '--detail-divider': theme.dividerColor,
    '--detail-input': theme.inputBg,
    '--detail-muted': theme.subtextColor,
    '--detail-on-action': theme.onActionColor,
    '--detail-text': theme.textColor,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.page}
      style={detailVariables}
    >
      <div className={styles.pageStack}>
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => logic.router.back()}
          className={styles.backButton}
        >
          <ArrowLeft aria-hidden="true" />
          Volver a cursos
        </motion.button>

        <div data-tour-id="business-panel-course-detail--hero">
          <BusinessCourseDetailHero
            course={logic.course}
            levelStyles={logic.levelStyles}
            primaryColor={logic.primaryColor}
            accentColor={logic.accentColor}
            textColor={logic.textColor}
            mutedTextColor={logic.mutedTextColor}
            borderColor={logic.borderColor}
            formatDuration={logic.formatDuration}
          />
        </div>

        <div className={styles.detailGrid}>
          <motion.section
            data-tour-id="business-panel-course-detail--tabs-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={styles.tabSurface}
          >
            <BusinessCourseDetailTabs
              activeTab={logic.activeTab}
              setActiveTab={logic.setActiveTab}
              isDark={logic.isDark}
              textColor={logic.textColor}
              borderColor={logic.borderColor}
              accentColor={logic.accentColor}
            />

            <div className={styles.tabContent}>
              <AnimatePresence mode="wait">
                {logic.activeTab === 'info' ? (
                  <BusinessCourseInfoTab
                    key="tab-info"
                    course={logic.course}
                    textColor={logic.textColor}
                    borderColor={logic.borderColor}
                    primaryColor={logic.primaryColor}
                    accentColor={logic.accentColor}
                    isDark={logic.isDark}
                    formatDuration={logic.formatDuration}
                  />
                ) : null}

                {logic.activeTab === 'content' ? (
                  <BusinessCourseContentTab
                    key="tab-content"
                    course={logic.course}
                    expandedModules={logic.expandedModules}
                    toggleModule={logic.toggleModule}
                    textColor={logic.textColor}
                    mutedTextColor={logic.mutedTextColor}
                    borderColor={logic.borderColor}
                    primaryColor={logic.primaryColor}
                    onPrimaryColor={logic.onPrimaryColor}
                    formatDuration={logic.formatDuration}
                    formatDurationSeconds={logic.formatDurationSeconds}
                  />
                ) : null}

                {logic.activeTab === 'reviews' ? (
                  <BusinessCourseReviewsTab
                    key="tab-reviews"
                    course={logic.course}
                    textColor={logic.textColor}
                    primaryColor={logic.primaryColor}
                    borderColor={logic.borderColor}
                    onPrimaryColor={logic.onPrimaryColor}
                    mutedTextColor={logic.mutedTextColor}
                    successColor={logic.successColor}
                    formatDate={logic.formatDate}
                  />
                ) : null}

                {logic.activeTab === 'instructor' ? (
                  <BusinessCourseInstructorTab
                    key="tab-instructor"
                    course={logic.course}
                    textColor={logic.textColor}
                    primaryColor={logic.primaryColor}
                    accentColor={logic.accentColor}
                    onPrimaryColor={logic.onPrimaryColor}
                    mutedTextColor={logic.mutedTextColor}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </motion.section>

          <aside data-tour-id="business-panel-course-detail--sidebar">
            <BusinessCourseDetailSidebar
              course={logic.course}
              setIsAssignModalOpen={logic.setIsAssignModalOpen}
              onOpenDefaultModal={() => logic.setIsDefaultModalOpen(true)}
              isPurchasing={logic.isPurchasing}
              purchaseSuccess={logic.purchaseSuccess}
              purchaseError={logic.purchaseError}
              primaryColor={logic.primaryColor}
              accentColor={logic.accentColor}
              cardBackground={logic.cardBackground}
              borderColor={logic.borderColor}
              dividerColor={logic.dividerColor}
              textColor={logic.textColor}
              mutedTextColor={logic.mutedTextColor}
              onPrimaryColor={logic.onPrimaryColor}
              successColor={logic.successColor}
              dangerColor={logic.dangerColor}
              onPurchase={logic.handlePurchase}
              formatDate={logic.formatDate}
            />
          </aside>
        </div>
      </div>

      <BusinessAssignCourseModal
        isOpen={logic.isAssignModalOpen}
        onClose={() => logic.setIsAssignModalOpen(false)}
        courseId={logic.course.id}
        courseTitle={logic.course.title}
        orgSlug={logic.orgSlug}
        onAssignComplete={() => {
          void logic.handleAssignmentComplete()
        }}
      />

      <BusinessCourseDefaultModal
        isOpen={logic.isDefaultModalOpen}
        onClose={() => logic.setIsDefaultModalOpen(false)}
        orgSlug={logic.orgSlug}
        course={{ id: logic.course.id, title: logic.course.title }}
        rules={logic.defaultRules}
        hierarchyNodes={logic.hierarchyNodes}
        onChanged={logic.handleDefaultRulesChanged}
      />

      <ToastNotification
        isOpen={logic.toast.isOpen}
        onClose={logic.hideToast}
        message={logic.toast.message}
        type={logic.toast.type}
        position="top-right"
      />
    </motion.div>
  )
}
