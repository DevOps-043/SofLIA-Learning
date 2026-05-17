import type { CourseOption, LpTranslator } from './types'

interface AddWorkshopCardProps {
  availableCourses: CourseOption[]
  lp: LpTranslator
  saving: boolean
  selectedCourseId: string
  setSelectedCourseId: (value: string) => void
  onAddCourse: () => Promise<void>
}

export function AddWorkshopCard({
  availableCourses,
  lp,
  saving,
  selectedCourseId,
  setSelectedCourseId,
  onAddCourse,
}: AddWorkshopCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('addWorkshop', 'Agregar taller')}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
        {lp('addWorkshopDescription', 'El mismo taller puede vivir en varias rutas, pero una sola vez dentro de esta.')}
      </p>
      <div className="mt-4 space-y-3">
        <select
          value={selectedCourseId}
          onChange={event => setSelectedCourseId(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
        >
          <option value="">{lp('selectWorkshop', 'Selecciona un taller')}</option>
          {availableCourses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <button
          type="button"
          disabled={!selectedCourseId || saving}
          onClick={() => void onAddCourse()}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
        >
          {saving ? lp('adding', 'Agregando...') : lp('addToPath', 'Agregar a la ruta')}
        </button>
      </div>
    </div>
  )
}
