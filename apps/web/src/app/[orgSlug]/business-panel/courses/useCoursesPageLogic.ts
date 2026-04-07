'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  Users,
  BarChart3,
  Layers
} from 'lucide-react'
import { useBusinessCourses } from '@/features/business-panel/hooks/useBusinessCourses'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'

export function useCoursesPageLogic() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { courses, stats, isLoading, error } = useBusinessCourses()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const router = useRouter()
  const params = useParams()
  const orgSlug = params?.orgSlug as string

  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const secondaryColor = panelStyles?.secondary_button_color || '#3B82F6'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const cardBg = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const borderColor = isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)'

  const categories = useMemo(() => {
    const cats = new Set<string>()
    courses.forEach(course => {
      if (course.category) cats.add(course.category)
    })
    return Array.from(cats).sort()
  }, [courses])

  const levels = useMemo(() => {
    const levs = new Set<string>()
    courses.forEach(course => {
      if (course.level) levs.add(course.level)
    })
    return Array.from(levs).sort()
  }, [courses])

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = searchTerm === '' ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = filterCategory === 'all' || course.category === filterCategory
      const matchesLevel = filterLevel === 'all' || course.level === filterLevel

      return matchesSearch && matchesCategory && matchesLevel
    })
  }, [courses, searchTerm, filterCategory, filterLevel])

  const courseStats = useMemo(() => [
    {
      title: t('courses.stats.total'),
      value: courses.length,
      icon: BookOpen,
      color: primaryColor
    },
    {
      title: t('courses.stats.categories'),
      value: categories.length,
      icon: Layers,
      color: secondaryColor
    },
    {
      title: t('courses.stats.levels'),
      value: levels.length,
      icon: BarChart3,
      color: accentColor
    },
    {
      title: t('courses.stats.totalStudents'),
      value: courses.reduce((acc, c) => acc + (c.student_count || 0), 0),
      icon: Users,
      color: '#F59E0B'
    },
  ], [courses, categories, levels, primaryColor, secondaryColor, accentColor, t])

  const handleCourseClick = (courseId: string) => {
    router.push(`/${orgSlug}/business-panel/courses/${courseId}`)
  }

  return {
    t,
    isDark,
    primaryColor,
    accentColor,
    secondaryColor,
    textColor,
    cardBg,
    borderColor,
    courses,
    stats,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterLevel,
    setFilterLevel,
    categories,
    levels,
    filteredCourses,
    courseStats,
    handleCourseClick,
  }
}
