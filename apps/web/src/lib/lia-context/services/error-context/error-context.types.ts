import type { ConsoleError } from '../../types'

export interface UserError {
  message: string
  stack?: string
  url?: string
  timestamp?: Date
  type?: string
}

export interface SimilarBug {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  estado: string | null
  pagina_url: string
  pathname: string | null
  prioridad: string | null
  pasos_reproducir: string | null
  comportamiento_esperado: string | null
  created_at: string | null
  notas_admin: string | null
}

export type RecentError = ConsoleError | UserError

export interface BugStatsForPage {
  total: number
  open: number
  resolved: number
  byCategory: Record<string, number>
}
