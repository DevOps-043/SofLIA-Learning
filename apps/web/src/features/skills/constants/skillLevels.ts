export type SkillLevel = 'green' | 'bronze' | 'silver' | 'gold' | 'diamond'

export const SKILL_LEVELS = {
  GREEN: 'green' as const,
  BRONZE: 'bronze' as const,
  SILVER: 'silver' as const,
  GOLD: 'gold' as const,
  DIAMOND: 'diamond' as const
} as const

export interface SkillLevelInfo {
  name: string
  displayName: string
  color: string
  coursesRequired: number
  description: string
  nextLevel?: SkillLevel
}

export const SKILL_LEVEL_INFO: Record<SkillLevel, SkillLevelInfo> = {
  green: {
    name: 'green',
    displayName: 'Verde',
    color: 'var(--color-legacy-22c55e)',
    coursesRequired: 1,
    description: 'Primer curso completado',
    nextLevel: 'bronze'
  },
  bronze: {
    name: 'bronze',
    displayName: 'Bronce',
    color: 'var(--color-legacy-cd7f32)',
    coursesRequired: 2,
    description: 'Segundo curso completado',
    nextLevel: 'silver'
  },
  silver: {
    name: 'silver',
    displayName: 'Plata',
    color: 'var(--color-legacy-c0c0c0)',
    coursesRequired: 3,
    description: 'Tercer curso completado',
    nextLevel: 'gold'
  },
  gold: {
    name: 'gold',
    displayName: 'Oro',
    color: 'var(--color-legacy-ffd700)',
    coursesRequired: 4,
    description: 'Cuarto curso completado',
    nextLevel: 'diamond'
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamante',
    color: 'var(--color-legacy-b9f2ff)',
    coursesRequired: 5,
    description: 'Dominio completo - 5+ cursos completados',
    nextLevel: undefined
  }
}

export function getLevelInfo(level: SkillLevel): SkillLevelInfo {
  return SKILL_LEVEL_INFO[level]
}

export function getLevelDisplayName(level: SkillLevel): string {
  return SKILL_LEVEL_INFO[level].displayName
}

export function getLevelColor(level: SkillLevel): string {
  return SKILL_LEVEL_INFO[level].color
}

