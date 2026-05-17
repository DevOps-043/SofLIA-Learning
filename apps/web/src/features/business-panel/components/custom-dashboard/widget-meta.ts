import { Activity, BarChart3, BookOpen, Users } from 'lucide-react'
import type { WidgetType } from './custom-dashboard.types'

export const WIDGET_META: Record<
  WidgetType,
  {
    label: string
    description: string
    icon: typeof BarChart3
  }
> = {
  stats: { label: 'Estadísticas', description: 'Resumen de métricas clave', icon: BarChart3 },
  users: { label: 'Usuarios', description: 'Actividad y crecimiento', icon: Users },
  courses: { label: 'Cursos', description: 'Avance y asignaciones', icon: BookOpen },
  activity: { label: 'Actividad', description: 'Eventos recientes del panel', icon: Activity },
}

export function getWidgetType(widgetId: string): WidgetType | null {
  const widgetType = widgetId.split('-')[0]
  return widgetType in WIDGET_META ? (widgetType as WidgetType) : null
}
