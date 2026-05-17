export function getEstadoBadgeClass(estado?: string | null) {
  switch (estado) {
    case 'pendiente':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
    case 'en_revision':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
    case 'en_progreso':
      return 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20'
    case 'resuelto':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
    case 'rechazado':
    case 'duplicado':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
  }
}

export function getPrioridadBadgeClass(prioridad?: string | null) {
  switch (prioridad) {
    case 'critica':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
    case 'alta':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20'
    case 'media':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
    case 'baja':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
  }
}
