'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { CompanyMember, Course } from '../courses-section.types'
import { colors } from '../courses-section.types'
import { AssignSelectField } from './AssignSelectField'

interface AssignUserModalProps {
  isOpen: boolean
  onClose: () => void
  members: CompanyMember[]
  allCourses: Course[]
  selectedUserForCourse: string | null
  setSelectedUserForCourse: (v: string | null) => void
  selectedCourseForUser: string | null
  setSelectedCourseForUser: (v: string | null) => void
  isAssigning: boolean
  onConfirm: () => void
}

export function AssignUserModal({
  isOpen, onClose, members, allCourses,
  selectedUserForCourse, setSelectedUserForCourse,
  selectedCourseForUser, setSelectedCourseForUser,
  isAssigning, onConfirm
}: AssignUserModalProps) {
  const memberOptions = members.map(m => ({ id: m.user_id, label: m.user.display_name || m.user.email }))
  const courseOptions = allCourses.map(c => ({ id: c.id, label: c.title }))

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="dark fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Asignar a Usuario</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>Asigna un curso específico del catálogo de la organización.</p>
            </div>
            <div className="p-8 space-y-8">
              <AssignSelectField label="Seleccionar Miembro" placeholder="Buscar miembro..." value={selectedUserForCourse} onChange={setSelectedUserForCourse} options={memberOptions} />
              <AssignSelectField label="Seleccionar Curso" placeholder="Buscar curso..." value={selectedCourseForUser} onChange={setSelectedCourseForUser} options={courseOptions} />
            </div>
            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">Cancelar</button>
              <button
                disabled={!selectedUserForCourse || !selectedCourseForUser || isAssigning}
                onClick={onConfirm}
                className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
