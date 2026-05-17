import {
  BookOpen,
  Brain,
  Grid3X3,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react'
import type { DirectoryNavOption, MobileNavItem } from './mobile-bottom-nav.types'

export const navigationItems: MobileNavItem[] = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen, route: '/dashboard' },
  { id: 'directory', name: 'Directorio IA', icon: Brain, route: null },
  { id: 'community', name: 'Comunidad', icon: Users, route: '/communities' },
  { id: 'news', name: 'Noticias', icon: Newspaper, route: '/news' },
]

export const directoryOptions: DirectoryNavOption[] = [
  {
    id: 'prompt-directory',
    name: 'Prompt Directory',
    description: 'Prompts de IA',
    icon: Sparkles,
    route: '/prompt-directory',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'apps-directory',
    name: 'Apps Directory',
    description: 'Herramientas de IA',
    icon: Grid3X3,
    route: '/apps-directory',
    gradient: 'from-blue-500 to-cyan-500',
  },
]
