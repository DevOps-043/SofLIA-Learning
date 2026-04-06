'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { useCourseManagementContext } from '../CourseManagementContext'
import {
  COURSE_MANAGEMENT_LOADING_SPINNER_CLASS,
  COURSE_MANAGEMENT_MODAL_FOOTER_CLASS,
  COURSE_MANAGEMENT_MODAL_HEADER_GRADIENT_CLASS,
  COURSE_MANAGEMENT_MODAL_SHELL_CLASS,
  COURSE_MANAGEMENT_PRIMARY_BUTTON_CLASS,
  COURSE_MANAGEMENT_SECONDARY_BUTTON_CLASS,
} from '../courseManagementTheme'
import { StudentProgressSection } from './StudentProgressSection'
import { StudentActivitySection } from './StudentActivitySection'

export function CourseManagementStudentDetailsModal() {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Settings className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
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
              ) : null}
            </div>

            <div className={COURSE_MANAGEMENT_MODAL_FOOTER_CLASS}>
              <div className="flex items-center justify-end gap-3">
                <button onClick={closeModal} className={COURSE_MANAGEMENT_SECONDARY_BUTTON_CLASS}>
                  Cerrar
                </button>
                <button className={COURSE_MANAGEMENT_PRIMARY_BUTTON_CLASS}>
                  Enviar Mensaje
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
