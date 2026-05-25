import { ListChecks, Users2 } from 'lucide-react'

export function StudentsTableHeader({ total }: { total: number }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
        <ListChecks className="h-6 w-6 text-white" />
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estudiantes Inscritos
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/60">
          {total} estudiantes en total
        </p>
      </div>
    </div>
  )
}

export function StudentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 dark:border-gray-500/30 dark:bg-carbon-800">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
        <Users2 className="h-10 w-10 text-gray-500 dark:text-white/40" />
      </div>
      <p className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        No hay estudiantes inscritos
      </p>
      <p className="text-center text-sm text-gray-500 dark:text-white/60">
        Los estudiantes apareceran aqui cuando se inscriban al curso
      </p>
    </div>
  )
}
