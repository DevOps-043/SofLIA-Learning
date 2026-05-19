import { Calendar, Newspaper, Users, Video } from 'lucide-react'
import type { PlatformFeature } from './types'

export const platformFeatures: PlatformFeature[] = [
  {
    id: 'news',
    icon: Newspaper,
    title: 'Noticias',
    description:
      'Mantente actualizado con las ultimas tendencias y noticias del mundo de la IA.',
    link: '/news',
    color: 'var(--color-accent)',
    gradient: 'from-accent to-accent/80',
  },
  {
    id: 'reels',
    icon: Video,
    title: 'Reels',
    description:
      'Contenido en video corto para aprender de forma rapida y entretenida.',
    link: '/reels',
    color: 'var(--color-success)',
    gradient: 'from-success to-success/80',
  },
  {
    id: 'communities',
    icon: Users,
    title: 'Comunidades',
    description:
      'Conecta con otros estudiantes y profesionales en comunidades especializadas.',
    link: '/communities',
    color: 'var(--color-primary)',
    gradient: 'from-primary to-primary/80',
  },
  {
    id: 'study-planner',
    icon: Calendar,
    title: 'Planificador de Estudios',
    description:
      'Organiza tu tiempo y optimiza tu aprendizaje con un planificador inteligente.',
    link: '/study-planner',
    color: 'var(--color-warning)',
    gradient: 'from-warning to-warning/80',
  },
]
