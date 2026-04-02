'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { BusinessAssignCourseModal } from '../../../../../features/business-panel/components/BusinessAssignCourseModal'
import { CourseAnalyticsTab } from '../../../../../features/business-panel/components/CourseAnalyticsTab'
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

export default function BusinessCourseDetailPage() {
  const logic = useBusinessCourseDetailPageLogic()

  if (logic.loading) {
    return <BusinessCourseDetailLoadingState cardBackground={logic.cardBackground} />
  }

  if (logic.error || !logic.course) {
    return (
      <BusinessCourseDetailErrorState
        error={logic.error || 'Curso no encontrado'}
        courseId={logic.courseId}
        primaryColor={logic.primaryColor}
        cardBackground={logic.cardBackground}
        borderColor={logic.borderColor}
        textColor={logic.textColor}
        onBack={() => logic.router.push(`/${logic.params.orgSlug}/business-panel/courses`)}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 min-h-screen">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => logic.router.back()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all mb-8 shadow-sm"
        style={{ borderColor: logic.borderColor, backgroundColor: logic.cardBackground, color: logic.textColor }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Volver a Cursos</span>
      </motion.button>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
        <div className="2xl:col-span-2 space-y-6">
          <BusinessCourseDetailHero
            course={logic.course}
            levelStyles={logic.levelStyles}
            primaryColor={logic.primaryColor}
            accentColor={logic.accentColor}
            textColor={logic.textColor}
            isDark={logic.isDark}
            formatDuration={logic.formatDuration}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: logic.cardBackground, borderColor: logic.borderColor }}
          >
            <BusinessCourseDetailTabs
              activeTab={logic.activeTab}
              setActiveTab={logic.setActiveTab}
              isDark={logic.isDark}
              textColor={logic.textColor}
              borderColor={logic.borderColor}
            />

            <div className="p-6">
              <AnimatePresence mode="wait">
                {logic.activeTab === 'info' ? (
                  <BusinessCourseInfoTab
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
                    course={logic.course}
                    expandedModules={logic.expandedModules}
                    toggleModule={logic.toggleModule}
                    textColor={logic.textColor}
                    borderColor={logic.borderColor}
                    primaryColor={logic.primaryColor}
                    isDark={logic.isDark}
                    formatDuration={logic.formatDuration}
                    formatDurationSeconds={logic.formatDurationSeconds}
                  />
                ) : null}

                {logic.activeTab === 'reviews' ? (
                  <BusinessCourseReviewsTab
                    course={logic.course}
                    textColor={logic.textColor}
                    primaryColor={logic.primaryColor}
                    borderColor={logic.borderColor}
                    isDark={logic.isDark}
                    formatDate={logic.formatDate}
                  />
                ) : null}

                {logic.activeTab === 'instructor' ? (
                  <BusinessCourseInstructorTab
                    course={logic.course}
                    textColor={logic.textColor}
                    primaryColor={logic.primaryColor}
                    accentColor={logic.accentColor}
                    isDark={logic.isDark}
                  />
                ) : null}

                {logic.activeTab === 'analytics' ? (
                  <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <CourseAnalyticsTab courseId={logic.course.id} orgSlug={logic.orgSlug} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <BusinessCourseDetailSidebar
            course={logic.course}
            setIsAssignModalOpen={logic.setIsAssignModalOpen}
            isPurchasing={logic.isPurchasing}
            purchaseSuccess={logic.purchaseSuccess}
            purchaseError={logic.purchaseError}
            primaryColor={logic.primaryColor}
            accentColor={logic.accentColor}
            cardBackground={logic.cardBackground}
            borderColor={logic.borderColor}
            textColor={logic.textColor}
            isDark={logic.isDark}
            onPurchase={logic.handlePurchase}
            formatDate={logic.formatDate}
          />
        </div>
      </div>

      <BusinessAssignCourseModal
        isOpen={logic.isAssignModalOpen}
        onClose={() => logic.setIsAssignModalOpen(false)}
        courseId={logic.course.id}
        courseTitle={logic.course.title}
        orgSlug={logic.orgSlug}
        onAssignComplete={() => {}}
      />
    </motion.div>
  )
}
