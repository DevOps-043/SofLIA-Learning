'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Award, TrendingUp, Filter, Eye, EyeOff } from 'lucide-react'
import { SkillBadgeList } from '../../skills/components/SkillBadgeList'
import { SkillLevel, getLevelInfo } from '../../skills/constants/skillLevels'

interface UserSkill {
  id: string
  skill_id: string
  skill: {
    skill_id: string
    name: string
    slug: string
    description?: string
    category: string
    icon_url?: string
    icon_type?: string
    icon_name?: string
    color?: string
    level?: string
  }
  level: SkillLevel | null
  course_count: number
  badge_url: string | null
  is_displayed: boolean
}

interface UserSkillsSectionProps {
  userId: string
  skills: UserSkill[]
  onToggleDisplay?: (skillId: string, isDisplayed: boolean) => void
}

export function UserSkillsSection({
  userId,
  skills,
  onToggleDisplay
}: UserSkillsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set())

  const displayedSkills = useMemo(() => {
    // Mostrar todas las skills que no estén explícitamente ocultas (is_displayed !== false)
    // Si is_displayed es null o undefined, también se muestran
    return skills.filter(s => s.is_displayed !== false)
  }, [skills])

  const categories = useMemo(() => {
    const cats = new Set(displayedSkills.map(s => s.skill.category || 'other'))
    return Array.from(cats)
  }, [displayedSkills])

  const filteredSkills = useMemo(() => {
    return displayedSkills.filter(skill => {
      const matchesCategory = selectedCategory === 'all' || skill.skill.category === selectedCategory
      const isHidden = hiddenSkills.has(skill.skill_id)
      return matchesCategory && !isHidden
    })
  }, [displayedSkills, selectedCategory, hiddenSkills])

  const stats = useMemo(() => {
    const total = displayedSkills.length
    const byLevel = displayedSkills.reduce((acc, skill) => {
      const level = skill.level || 'none'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const highestLevel = displayedSkills.reduce((highest, skill) => {
      if (!skill.level) return highest
      const levelOrder: Record<SkillLevel, number> = {
        diamond: 5,
        gold: 4,
        silver: 3,
        bronze: 2,
        green: 1
      }
      const currentOrder = levelOrder[skill.level] || 0
      const highestOrder = highest ? levelOrder[highest] || 0 : 0
      return currentOrder > highestOrder ? skill.level : highest
    }, null as SkillLevel | null)

    return {
      total,
      byLevel,
      highestLevel
    }
  }, [displayedSkills])

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

  const skillsForList = filteredSkills.map(skill => ({
    skill_id: skill.skill_id,
    name: skill.skill.name,
    slug: skill.skill.slug,
    description: skill.skill.description,
    category: skill.skill.category,
    icon_url: skill.skill.icon_url || null,
    level: skill.level,
    badge_url: skill.badge_url,
    course_count: skill.course_count
  }))

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Award className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nivel Más Alto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.highestLevel ? getLevelInfo(stats.highestLevel).displayName : 'N/A'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Todas
        </button>
        {categories.map(category => {
          const categoryLabels: Record<string, string> = {
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
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {categoryLabels[category] || category}
            </button>
          )
        })}
      </div>

      {/* Lista de Skills */}
      <SkillBadgeList
        skills={skillsForList}
        showFilter={false}
        showHideOption={true}
        size="sm"
        layout="overlap"
      />
    </div>
  )
}
