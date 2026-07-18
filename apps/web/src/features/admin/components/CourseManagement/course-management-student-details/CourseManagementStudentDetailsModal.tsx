'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from '../CourseManagementContext'
import {
  COURSE_MANAGEMENT_LOADING_SPINNER_CLASS,
  COURSE_MANAGEMENT_MODAL_FOOTER_CLASS,
  COURSE_MANAGEMENT_MODAL_HEADER_GRADIENT_CLASS,
  COURSE_MANAGEMENT_MODAL_SHELL_CLASS,
  COURSE_MANAGEMENT_SECONDARY_BUTTON_CLASS,
} from '../courseManagementTheme'
import { StudentProgressSection } from './StudentProgressSection'
import { StudentActivitySection } from './StudentActivitySection'

export function CourseManagementStudentDetailsModal() {
  const { t } = useTranslation('admin')
  const {
    state: {
      showStudentDetailsModal,
      setShowStudentDetailsModal,
      selectedStudent,
      setSelectedStudent,
      studentDetailsData,
      setStudentDetailsData,
      loadingStudentDetails,
    },
  } = useCourseManagementContext()

  const closeModal = () => {
    setShowStudentDetailsModal(false)
    setStudentDetailsData(null)
    setSelectedStudent(null)
  }

  return (
    <AnimatePresence>
      {showStudentDetailsModal && selectedStudent ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className={COURSE_MANAGEMENT_MODAL_SHELL_CLASS}
          >
            <div className={`p-6 ${COURSE_MANAGEMENT_MODAL_HEADER_GRADIENT_CLASS}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedStudent.profile_picture ? (
                    <img
                      src={selectedStudent.profile_picture}
                      alt={selectedStudent.display_name}
                      className="h-16 w-16 rounded-full border-4 border-white/20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
                      {selectedStudent.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStudent.display_name}</h2>
                    <p className="text-sm text-white/80">{selectedStudent.email || selectedStudent.username}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  aria-label={t('workshops.editor.stats.studentDetails.closeLabel')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              {loadingStudentDetails ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className={`h-8 w-8 ${COURSE_MANAGEMENT_LOADING_SPINNER_CLASS}`}
                  />
                </div>
              ) : studentDetailsData ? (
                <div className="space-y-6">
                  <StudentProgressSection
                    studentDetailsData={studentDetailsData as Record<string, unknown>}
                    selectedStudent={selectedStudent as unknown as Record<string, unknown>}
                  />
                  <StudentActivitySection
                    selectedStudent={selectedStudent as unknown as Record<string, unknown>}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Info className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-primary dark:text-white">
                    {t('workshops.editor.stats.studentDetails.emptyTitle')}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-white/60">
                    {t('workshops.editor.stats.studentDetails.emptyDescription')}
                  </p>
                </div>
              )}
            </div>

            <div className={COURSE_MANAGEMENT_MODAL_FOOTER_CLASS}>
              <div className="flex items-center justify-end gap-3">
                <button onClick={closeModal} className={COURSE_MANAGEMENT_SECONDARY_BUTTON_CLASS}>
                  {t('workshops.editor.stats.studentDetails.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
