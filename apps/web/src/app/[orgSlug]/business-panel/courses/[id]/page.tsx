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
import { useBusinessPanelTheme } from '../../../../../features/business-panel/hooks/useBusinessPanelTheme'

export default function BusinessCourseDetailPage() {
  const logic = useBusinessCourseDetailPageLogic()
  const theme = useBusinessPanelTheme()

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="lg:p-8 min-h-screen"
      style={{ backgroundColor: theme.panelBg }}
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8 px-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => logic.router.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 transition-all hover:bg-white/10 active:scale-95 shrink-0"
            style={{ color: theme.textColor }}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="font-black uppercase tracking-widest text-[9px] whitespace-nowrap">Cursos</span>
          </motion.button>
      </div>

      {/* Unified Main Section */}
      <div className="max-w-[1550px] mx-auto px-6 lg:px-8 space-y-4 lg:space-y-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[2rem] border overflow-hidden shadow-2xl"
              style={{
                backgroundColor: logic.cardBackground,
                borderColor: logic.borderColor
              }}
            >
              <BusinessCourseDetailTabs
                activeTab={logic.activeTab}
                setActiveTab={logic.setActiveTab}
                isDark={logic.isDark}
                textColor={logic.textColor}
                borderColor={logic.borderColor}
                accentColor={logic.accentColor}
              />

              <div className="p-6 lg:p-10">
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

                  {logic.activeTab === 'analytics' ? (
                    <motion.div key="analytics-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <CourseAnalyticsTab
                        courseId={logic.course.id}
                        orgSlug={logic.orgSlug}
                        refreshKey={logic.assignmentRefreshKey}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
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
              dividerColor={logic.dividerColor}
              textColor={logic.textColor}
              mutedTextColor={logic.mutedTextColor}
              onPrimaryColor={logic.onPrimaryColor}
              successColor={logic.successColor}
              dangerColor={logic.dangerColor}
              onPurchase={logic.handlePurchase}
              formatDate={logic.formatDate}
            />
          </div>
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
    </motion.div>
  )
}
