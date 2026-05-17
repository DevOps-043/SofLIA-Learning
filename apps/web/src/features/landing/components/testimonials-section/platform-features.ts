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
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#00D4B3]/80',
  },
  {
    id: 'reels',
    icon: Video,
    title: 'Reels',
    description:
      'Contenido en video corto para aprender de forma rapida y entretenida.',
    link: '/reels',
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#10B981]/80',
  },
  {
    id: 'communities',
    icon: Users,
    title: 'Comunidades',
    description:
      'Conecta con otros estudiantes y profesionales en comunidades especializadas.',
    link: '/communities',
    color: '#0A2540',
    gradient: 'from-[#0A2540] to-[#0A2540]/80',
  },
  {
    id: 'study-planner',
    icon: Calendar,
    title: 'Planificador de Estudios',
    description:
      'Organiza tu tiempo y optimiza tu aprendizaje con un planificador inteligente.',
    link: '/study-planner',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#F59E0B]/80',
  },
]
