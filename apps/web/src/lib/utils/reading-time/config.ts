import type { ReadingSpeed, ReadingSpeedConfig } from './types'

export const READING_SPEEDS: Record<ReadingSpeed, ReadingSpeedConfig> = {
  slow: {
    wordsPerMinute: 180,
    label: 'Lectura cuidadosa',
    description: 'Para contenido técnico o que requiere reflexión (160-190 ppm)',
  },
  average: {
    wordsPerMinute: 200,
    label: 'Lectura promedio',
    description: 'Velocidad estándar para textos informativos (200-220 ppm)',
  },
  fast: {
    wordsPerMinute: 250,
    label: 'Lectura rápida',
    description: 'Para lectores experimentados o repaso (240-280 ppm)',
  },
}

export const DEFAULT_READING_SPEED: ReadingSpeed = 'slow'
