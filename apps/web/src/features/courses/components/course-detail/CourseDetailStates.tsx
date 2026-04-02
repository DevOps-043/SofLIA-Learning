'use client'

interface CourseDetailErrorStateProps {
  error: string
  goBack: () => void
}

export function CourseDetailLoadingState() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300 text-lg">Cargando curso...</p>
      </div>
    </div>
  )
}

export function CourseDetailErrorState({ error, goBack }: CourseDetailErrorStateProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
        <button onClick={goBack} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">
          Volver
        </button>
      </div>
    </div>
  )
}
