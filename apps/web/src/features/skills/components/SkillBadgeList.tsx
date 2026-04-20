'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMotionSafe } from '../../../lib/utils/motion'
import { Filter, Search, Eye, EyeOff } from 'lucide-react'
import { SkillBadge, SkillBadgeProps } from './SkillBadge'
import { SkillLevel } from '../constants/skillLevels'

export interface SkillBadgeListProps {
  skills: Array<
    SkillBadgeProps['skill'] & {
      icon_url?: string | null
      description?: string | null
      category?: string | null
    }
  >
  showFilter?: boolean
  showHideOption?: boolean
  onSkillClick?: (skill: SkillBadgeProps['skill']) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  layout?: 'grid' | 'overlap'
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  programming: 'Programación',
  design: 'Diseño',
  marketing: 'Marketing',
  business: 'Negocios',
  data: 'Datos',
  ai: 'Inteligencia Artificial',
  cloud: 'Cloud Computing',
  security: 'Seguridad',
  devops: 'DevOps',
  leadership: 'Liderazgo',
  communication: 'Comunicación',
  other: 'Otros'
}

export function SkillBadgeList({
  skills,
  showFilter = true,
  showHideOption = false,
  onSkillClick,
  size = 'md',
  className = '',
  layout = 'grid'
}: SkillBadgeListProps) {
  const { disableHeavy } = useMotionSafe()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'name' | 'level'>('name')

  const categories = useMemo(() => {
    const cats = new Set(skills.map(s => s.category || 'other'))
    return Array.from(cats)
  }, [skills])

  const filteredAndSortedSkills = useMemo(() => {
    let filtered = skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
      
      const isHidden = hiddenSkills.has(skill.skill_id)
      
      return matchesSearch && matchesCategory && !isHidden
    })

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        // Ordenar por nivel (diamond > gold > silver > bronze > green > null)
        const levelOrder: Record<string, number> = {
          diamond: 5,
          gold: 4,
          silver: 3,
          bronze: 2,
          green: 1
        }
        const aLevel = a.level ? levelOrder[a.level] || 0 : 0
        const bLevel = b.level ? levelOrder[b.level] || 0 : 0
        return bLevel - aLevel
      }
    })

    return filtered
  }, [skills, searchTerm, selectedCategory, hiddenSkills, sortBy])

  const toggleSkillVisibility = (skillId: string) => {
    setHiddenSkills(prev => {
      const newSet = new Set(prev)
      if (newSet.has(skillId)) {
        newSet.delete(skillId)
      } else {
        newSet.add(skillId)
      }
      return newSet
    })
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No hay skills disponibles</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtros */}
      {showFilter && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'level')}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="level">Ordenar por nivel</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid de Badges */}
      {filteredAndSortedSkills.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No se encontraron skills con los filtros aplicados</p>
        </div>
      ) : (
        <div
          className={
            layout === 'overlap'
              ? 'flex flex-wrap items-center gap-0'
              : `grid ${
                  size === 'sm'
                    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                }`
          }
        >
          {filteredAndSortedSkills.map((skill, index) => (
            <motion.div
              key={skill.skill_id}
              initial={{ opacity: 0, scale: layout === 'overlap' ? 0.95 : 0.9 }}
              animate={
                layout === 'overlap'
                  ? { opacity: 1, scale: 1, ...(disableHeavy ? {} : { y: [0, -4, 0] }) }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                layout === 'overlap'
                  ? {
                      opacity: { delay: index * 0.05 },
                      scale: { type: 'spring', stiffness: 120, damping: 12 },
                      y: {
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.15
                      }
                    }
                  : { delay: index * 0.02 }
              }
              whileHover={
                layout === 'overlap'
                  ? { scale: 1.08, zIndex: 40, rotate: 0.5 }
                  : { scale: 1.03 }
              }
              className={
                layout === 'overlap'
                  ? `relative transition-all duration-300 ${
                      index !== 0 ? '-ml-10 md:-ml-12' : ''
                    }`
                  : 'flex flex-col items-center gap-2'
              }
              style={
                layout === 'overlap'
                  ? {
                      zIndex: 20 + filteredAndSortedSkills.length - index
                    }
                  : undefined
              }
            >
              <SkillBadge
                skill={skill}
                size={size}
                showTooltip={true}
                onClick={() => onSkillClick?.(skill)}
                className=""
              />
              {size !== 'sm' && (
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                    {skill.name}
                  </p>
                  {skill.level && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {skill.course_count || 0} curso{skill.course_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
              {showHideOption && (
                <button
                  onClick={() => toggleSkillVisibility(skill.skill_id)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={hiddenSkills.has(skill.skill_id) ? 'Mostrar' : 'Ocultar'}
                >
                  {hiddenSkills.has(skill.skill_id) ? (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Eye className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
