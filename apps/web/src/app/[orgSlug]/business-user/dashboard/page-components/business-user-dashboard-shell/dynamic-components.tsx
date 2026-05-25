import dynamic from 'next/dynamic'

export const ModernNavbar = dynamic(
  () => import('../../components/ModernNavbar').then((mod) => ({ default: mod.ModernNavbar })),
  { ssr: false },
)

export const ModernStatsCard = dynamic(
  () => import('../../components/ModernStatsCard').then((mod) => ({ default: mod.ModernStatsCard })),
  { ssr: false },
)

export const CourseCard3D = dynamic(
  () => import('../../components/CourseCard3D').then((mod) => ({ default: mod.CourseCard3D })),
  { ssr: false },
)

export const LearningPathView = dynamic(
  () => import('../../components/LearningPathView').then((mod) => ({ default: mod.LearningPathView })),
  { ssr: false },
)
