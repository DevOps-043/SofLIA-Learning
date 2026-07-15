import { Newspaper, Route, Video } from 'lucide-react'
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
    id: 'learning-paths',
    icon: Route,
    title: 'Rutas de Aprendizaje',
    description:
      'Rutas estructuradas y secuenciales para guiar la capacitación de tu equipo.',
    link: '/learning-paths',
    color: 'var(--color-primary)',
    gradient: 'from-primary to-primary/80',
  },
]
