import { Route } from 'lucide-react'
import { BusinessLearningPathCard } from './Card'
import type { BusinessLearningPathsLogic, BusinessLearningPathsTranslate } from './types'

interface BusinessLearningPathCardsProps {
  logic: BusinessLearningPathsLogic
  t: BusinessLearningPathsTranslate
  onOpenVideos: (id: string) => void
}

export function BusinessLearningPathCards({ logic, t, onOpenVideos }: BusinessLearningPathCardsProps) {
  const { primaryColor, onPrimaryColor, accentColor, textColor, mutedTextColor, borderColor, inputBg } = logic.theme
  return (
    <section id="tour-paths-cards">
      {logic.filteredLearningPaths.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed px-8 py-16 text-center" style={{ backgroundColor: inputBg, borderColor }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] shadow-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
            <Route className="h-8 w-8" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-black" style={{ color: textColor }}>No hay rutas disponibles</h2>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: mutedTextColor }}>Cuando el equipo administrador cree rutas activas, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {logic.filteredLearningPaths.map((path, index) => (
            <BusinessLearningPathCard key={path.id} path={path} index={index} logic={logic} t={t} onOpenVideos={onOpenVideos} />
          ))}
        </div>
      )}
    </section>
  )
}
