import { CheckCircle, Circle, Lock, PlayCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const USER_PROGRESS_STATUS: Record<string, { className: string; labelKey: string }> = {
  active: { className: 'bg-sky-500/12 text-sky-700 dark:text-sky-300', labelKey: 'userStats.progressModal.status.active' },
  completed: { className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', labelKey: 'userStats.progressModal.status.completed' },
  paused: { className: 'bg-amber-500/12 text-amber-700 dark:text-amber-300', labelKey: 'userStats.progressModal.status.paused' },
  cancelled: { className: 'bg-rose-500/12 text-rose-700 dark:text-rose-300', labelKey: 'userStats.progressModal.status.cancelled' },
}

export const USER_PROGRESS_LEVELS: Record<string, string> = {
  beginner: 'userStats.progressModal.levels.beginner',
  intermediate: 'userStats.progressModal.levels.intermediate',
  advanced: 'userStats.progressModal.levels.advanced',
}

export const USER_PROGRESS_LESSON_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  completed: { icon: CheckCircle, className: 'text-emerald-500' },
  in_progress: { icon: PlayCircle, className: 'text-sky-500' },
  not_started: { icon: Circle, className: 'text-slate-400' },
  locked: { icon: Lock, className: 'text-slate-500' },
}
