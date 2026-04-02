'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ErrorModal } from '../../../../core/components/ErrorModal'
import { SuccessModal } from '../../../../core/components/SuccessModal'
import { CourseDetailHero } from './CourseDetailHero'
import { CourseDetailInfoTab } from './CourseDetailInfoTab'
import { CourseDetailContentTab } from './CourseDetailContentTab'
import { CourseDetailInstructorTab } from './CourseDetailInstructorTab'
import { CourseDetailSidebar } from './CourseDetailSidebar'
import { CourseDetailTabs } from './CourseDetailTabs'
import type { ReturnTypeUseCourseDetailPageLogic } from './types'

interface CourseDetailPageContentProps {
  logic: ReturnTypeUseCourseDetailPageLogic
}

export function CourseDetailPageContent({ logic }: CourseDetailPageContentProps) {
  if (!logic.detail) {
    return null
  }

  const { course, modules, skills, instructor, isPurchased } = logic.detail

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button onClick={logic.goBack} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 dark:hover:text-white rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        <CourseDetailHero course={course} summary={logic.summary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
              <CourseDetailTabs activeTab={logic.activeTab} onChange={logic.setActiveTab} />
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {logic.activeTab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <CourseDetailInfoTab course={course} skills={skills} summary={logic.summary} />
                    </motion.div>
                  )}

                  {logic.activeTab === 'content' && (
                    <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <CourseDetailContentTab modules={modules} summary={logic.summary} expandedModules={logic.expandedModules} onToggleModule={logic.toggleModule} />
                    </motion.div>
                  )}

                  {logic.activeTab === 'instructor' && (
                    <motion.div key="instructor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <CourseDetailInstructorTab course={course} instructor={instructor} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <CourseDetailSidebar
              course={course}
              summary={logic.summary}
              isPurchased={isPurchased}
              isPurchasing={logic.isPurchasing}
              onPurchase={logic.handlePurchase}
              onGoToLearn={logic.goToLearn}
            />
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={logic.showSuccessModal}
        onClose={async () => {
          logic.setShowSuccessModal(false)
          await logic.refreshPurchaseState()
        }}
        title={logic.successMessage}
        message="Ya puedes comenzar a aprender"
        duration={4000}
      />

      <ErrorModal
        isOpen={logic.showErrorModal}
        onClose={() => logic.setShowErrorModal(false)}
        title={logic.errorMessage}
        message="Por favor, intenta de nuevo mas tarde"
        duration={5000}
      />
    </motion.div>
  )
}
