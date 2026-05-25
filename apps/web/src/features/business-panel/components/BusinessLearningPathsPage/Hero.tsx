import { Route } from 'lucide-react'
import type { BusinessLearningPathsTheme } from './types'

export function BusinessLearningPathsHero({ theme }: { theme: BusinessLearningPathsTheme }) {
  const { primaryColor, onPrimaryColor, accentColor, textColor, mutedTextColor, borderColor, inputBg } = theme
  return (
    <div id="tour-paths-hero" className="relative overflow-hidden rounded-[2rem] border px-8 py-8 lg:py-10" style={{ borderColor, backgroundColor: inputBg }}>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-64 opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }} />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: mutedTextColor }}>Gestión de rutas</p>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2" style={{ color: textColor }}>Rutas de aprendizaje</h1>
          <p className="text-sm max-w-md" style={{ color: mutedTextColor }}>
            Asigna a tus usuarios las rutas creadas por la plataforma directamente desde el panel de empresa.
          </p>
        </div>
        <div className="hidden lg:flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] shadow-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
          <Route className="h-7 w-7" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}
