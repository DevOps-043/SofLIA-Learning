import { Users } from 'lucide-react'
import { BusinessLearningPathAssignmentRow } from './AssignmentRow'
import type { BusinessLearningPathsLogic } from './types'

interface BusinessLearningPathAssignmentsProps {
  logic: BusinessLearningPathsLogic
  language: string
}

export function BusinessLearningPathAssignments({ logic, language }: BusinessLearningPathAssignmentsProps) {
  const { textColor, mutedTextColor, borderColor, inputBg, panelBg } = logic.theme
  const assignmentCards = logic.assignments.slice().sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
  return (
    <section id="tour-paths-assignments">
      <div className="mb-5">
        <h2 className="text-lg font-black" style={{ color: textColor }}>Asignaciones activas</h2>
        <p className="mt-0.5 text-sm" style={{ color: mutedTextColor }}>Revisa qué usuarios tienen cada ruta y revoca accesos cuando sea necesario.</p>
      </div>
      {assignmentCards.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed px-8 py-12 text-center" style={{ backgroundColor: inputBg, borderColor }}>
          <Users className="mx-auto mb-3 h-8 w-8 opacity-30" style={{ color: textColor }} />
          <p className="font-black" style={{ color: textColor }}>Sin asignaciones todavía</p>
          <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>Asigna una ruta a tus usuarios desde las tarjetas de arriba.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border" style={{ borderColor }}>
          <div className="hidden grid-cols-[1fr_1fr_130px_auto] items-center gap-4 border-b px-6 py-3.5 md:grid" style={{ backgroundColor: panelBg, borderColor }}>
            {['Usuario', 'Ruta', 'Asignado', ''].map((heading) => (
              <p key={heading} className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: mutedTextColor }}>{heading}</p>
            ))}
          </div>
          <div style={{ backgroundColor: inputBg }}>
            {assignmentCards.map((assignment, index) => (
              <BusinessLearningPathAssignmentRow key={assignment.id} assignment={assignment} index={index} language={language} logic={logic} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
