'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CompanyMember, Course } from '../courses-section.types'
import { colors } from '../courses-section.types'

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
  isOpen,
  onClose,
  members,
  allCourses,
  selectedUserForCourse,
  setSelectedUserForCourse,
  selectedCourseForUser,
  setSelectedCourseForUser,
  isAssigning,
  onConfirm,
}: AssignUserModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="dark fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border" style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Asignar a Usuario</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>Asigna un curso especifico del catalogo de la organizacion.</p>
            </div>
            <div className="p-8 space-y-8">
              <LabeledSelect label="Seleccionar Miembro" value={selectedUserForCourse || ''} onChange={setSelectedUserForCourse}>
                <option value="">Buscar miembro...</option>
                {members.map(member => (
                  <option key={member.user_id} value={member.user_id}>{member.user.display_name || member.user.email}</option>
                ))}
              </LabeledSelect>
              <LabeledSelect label="Seleccionar Curso" value={selectedCourseForUser || ''} onChange={setSelectedCourseForUser}>
                <option value="">Buscar curso...</option>
                {allCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </LabeledSelect>
            </div>
            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">Cancelar</button>
              <button disabled={!selectedUserForCourse || !selectedCourseForUser || isAssigning} onClick={onConfirm} className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl" style={{ backgroundColor: colors.accent, color: colors.primary }}>
                {isAssigning ? 'Asignando...' : 'Confirmar Asignacion'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface LabeledSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

function LabeledSelect({ label, value, onChange, children }: LabeledSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>{label}</label>
      <div className="relative group">
        <select className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} value={value} onChange={event => onChange(event.target.value)}>
          {children}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
      </div>
    </div>
  )
}
