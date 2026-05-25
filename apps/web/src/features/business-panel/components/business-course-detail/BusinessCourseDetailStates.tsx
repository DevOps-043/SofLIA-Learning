import { ArrowLeft, BookOpen } from 'lucide-react'

interface BusinessCourseDetailLoadingStateProps {
  cardBackground: string
}

export function BusinessCourseDetailLoadingState({ cardBackground }: BusinessCourseDetailLoadingStateProps) {
  return (
    <div className="p-6 lg:p-8 min-h-screen animate-pulse">
      <div className="h-10 w-32 bg-white/5 rounded-xl mb-8" />
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
        <div className="2xl:col-span-2 space-y-6">
          <div className="h-80 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-96 rounded-2xl" style={{ backgroundColor: cardBackground }} />
      </div>
    </div>
  )
}

interface BusinessCourseDetailErrorStateProps {
  error: string
  courseId: string
  primaryColor: string
  cardBackground: string
  borderColor: string
  textColor: string
  onBack: () => void
}

export function BusinessCourseDetailErrorState({
  error,
  courseId,
  primaryColor,
  cardBackground,
  borderColor,
  textColor,
  onBack
}: BusinessCourseDetailErrorStateProps) {
  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>
      <div
        className="rounded-3xl p-16 border text-center shadow-sm"
        style={{ backgroundColor: cardBackground, borderColor }}
      >
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 12.5%, transparent)` }}>
          <BookOpen className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>{error || 'Curso no encontrado'}</h3>
        <p className="text-sm" style={{ color: `color-mix(in srgb, ${textColor} 43.9%, transparent)` }}>El curso con ID "{courseId}" no existe o no tienes acceso.</p>
      </div>
    </div>
  )
}
