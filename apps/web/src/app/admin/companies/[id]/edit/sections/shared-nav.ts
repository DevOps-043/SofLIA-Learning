import {
  AcademicCapIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { colors } from './shared-colors'

export const NAV_ITEMS = [
  { id: 'general', label: 'General', icon: Cog6ToothIcon, color: colors.accent },
  { id: 'users', label: 'Usuarios', icon: UserGroupIcon, color: colors.blue },
  { id: 'courses', label: 'Cursos', icon: AcademicCapIcon, color: colors.purple },
  { id: 'stats', label: 'Estadísticas', icon: ChartBarIcon, color: colors.success },
  { id: 'customization', label: 'Personalización', icon: PaintBrushIcon, color: colors.pink },
]
