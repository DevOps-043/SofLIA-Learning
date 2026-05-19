'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SkillLevel, getLevelInfo, getLevelDisplayName, getLevelColor } from '../constants/skillLevels'

export interface SkillBadgeProps {
  skill: {
    skill_id: string
    name: string
    slug: string
    level?: SkillLevel | null
    badge_url?: string | null
    icon_url?: string | null
    course_count?: number
  }
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  onClick?: () => void
  className?: string
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-40 h-40',
  lg: 'w-48 h-48'
}

export function SkillBadge({
  skill,
  size = 'md',
  showTooltip = true,
  onClick,
  className = ''
}: SkillBadgeProps) {
  const [imageError, setImageError] = useState(false)
  const level = skill.level || null
  const badgeUrl = skill.badge_url || null
  const iconUrl = skill.icon_url || null
  const levelInfo = level ? getLevelInfo(level) : null

  // Si hay nivel, usar badge_url; si no, usar icon_url
  const imageUrl = level && badgeUrl ? badgeUrl : iconUrl
  
  // Si no hay imagen o hay error, mostrar fallback
  const showFallback = !imageUrl || imageError

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} relative rounded-lg overflow-hidden cursor-pointer transition-transform ${
          onClick ? 'hover:scale-110' : ''
        }`}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.1 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        title={showTooltip && levelInfo ? `${skill.name} - ${levelInfo.displayName}` : skill.name}
      >
        {showFallback ? (
          // Fallback: mostrar icono genérico con color del nivel
          <div
            className="w-full h-full flex items-center justify-center rounded-lg border-2"
            style={{
              backgroundColor: levelInfo?.color || 'var(--color-legacy-6b7280)',
              borderColor: levelInfo?.color || 'var(--color-legacy-6b7280)',
              opacity: 0.8
            }}
          >
            <span className="text-white font-bold text-xs sm:text-sm">
              {skill.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        ) : (
          // Mostrar badge o icono desde URL
          <img
            src={imageUrl}
            alt={`${skill.name}${levelInfo ? ` - ${levelInfo.displayName}` : ''}`}
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
          />
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && levelInfo && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
          <div className="font-semibold">{skill.name}</div>
          <div className="text-gray-300">
            {levelInfo.displayName} - {levelInfo.description}
          </div>
          {skill.course_count !== undefined && (
            <div className="text-gray-400 mt-1">
              {skill.course_count} curso{skill.course_count !== 1 ? 's' : ''} completado{skill.course_count !== 1 ? 's' : ''}
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}

