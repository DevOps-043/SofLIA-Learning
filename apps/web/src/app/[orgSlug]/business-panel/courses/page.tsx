'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  Search,
  Filter,
  Star,
  Users,
  Clock,
  GraduationCap,
  TrendingUp,
  Tag,
  Award,
  Play,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  Layers
} from 'lucide-react'
import { useBusinessCourses, type BusinessCourse } from '@/features/business-panel/hooks/useBusinessCourses'
import { StarRating } from '@/features/courses/components/StarRating'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'

// ============================================
// COMPONENTE: StatCard Premium para Cursos
// ============================================
interface CourseStatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  delay: number
  isDark?: boolean
}

function CourseStatCard({ title, value, icon: Icon, color, delay, isDark }: CourseStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group overflow-hidden rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{ 
        backgroundColor: 'var(--org-card-background, #1E2329)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)` }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <h4 className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h4>
          <p className="text-sm font-medium" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B' }}>
            {title}
          </p>
        </div>
      </div>

      {/* Subtle gradient bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-r-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ delay: delay * 0.1 + 0.3, duration: 0.6 }}
      />
    </motion.div>
  )
}

// ============================================
// COMPONENTE: CourseCard Premium
// ============================================
interface CourseCardProps {
  course: BusinessCourse
  index: number
  primaryColor: string
  textColor: string
  cardBg: string
  onClick: () => void
  isDark?: boolean
}

function CourseCard({ course, index, primaryColor, textColor, cardBg, onClick, isDark }: CourseCardProps) {
  const { t } = useTranslation('business')
  type TranslateFn = (key: string) => string
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const getLevelStyles = (level: string | null, translate: TranslateFn) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', text: translate('courses.levels.beginner') }
      case 'intermediate':
      case 'intermedio':
        return { bg: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', text: translate('courses.levels.intermediate') }
      case 'advanced':
      case 'avanzado':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', text: translate('courses.levels.advanced') }
      default:
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', text: level || 'N/A' }
    }
  }

  const levelStyles = getLevelStyles(course.level, t)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md"
      style={{ backgroundColor: cardBg, borderColor: 'rgba(0,0,0,0.05)' }}
    >
      {/* Thumbnail with Overlay */}
      <div className="relative h-44 overflow-hidden">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` }}
          >
            <BookOpen className="w-16 h-16" style={{ color: `${primaryColor}60` }} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Level Badge */}
        <div className="absolute top-3 left-3">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
            style={{ backgroundColor: levelStyles.bg, color: levelStyles.color }}
          >
            {levelStyles.text}
          </span>
        </div>

        {/* Play Button on Hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20"
            style={{ backgroundColor: `${primaryColor}90` }}
          >
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        </motion.div>

        {/* Rating Badge */}
        <div 
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Star className="w-3.5 h-3.5" style={{ color: '#FACC15', fill: '#FACC15' }} />
          <span className="text-xs font-semibold" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>
            {course.rating ? course.rating.toFixed(1) : '0.0'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {course.category && (
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-xs font-medium" style={{ color: primaryColor }}>
              {course.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className="text-base font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          style={{ color: textColor }}
        >
          {course.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: textColor, opacity: 0.7 }}
        >
          {course.description || t('courses.card.noDescription')}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
          >
            {course.instructor.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: textColor }}>
              {course.instructor.name}
            </p>
            <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
              {t('courses.card.instructor')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" style={{ color: textColor, opacity: 0.6 }}>
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{formatDuration(course.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: textColor, opacity: 0.6 }}>
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">{course.student_count || 0}</span>
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group/arrow"
            style={{ 
              backgroundColor: isDark ? 'transparent' : '#E9ECEF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #6C757D'
            }}
            whileHover={{ 
              backgroundColor: primaryColor,
              borderColor: 'transparent'
            }}
          >
            <ChevronRight
              className="w-4 h-4 transition-colors group-hover/arrow:text-white"
              style={{ 
                color: isDark ? 'rgba(255,255,255,0.5)' : '#6C757D'
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: BusinessPanelCoursesPage
// ============================================
export default function BusinessPanelCoursesPage() {
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

  // Theme Colors
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Theme Colors con fallbacks correctos
  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const secondaryColor = panelStyles?.secondary_button_color || '#3B82F6'
  // En modo claro, forzamos colores legibles ignorando posibles configuraciones oscuras de la organización
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const cardBg = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const borderColor = isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)'

  // Obtener categorías y niveles únicos
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

  // Filtrar cursos
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

  // Stats data
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

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen animate-pulse">
        {/* Hero Skeleton */}
        <div className="h-48 rounded-3xl bg-white/5 mb-8" />

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="h-16 bg-white/5 rounded-2xl mb-8" />

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 min-h-screen"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 mb-8 shadow-lg"
        style={{
          background: isDark 
            ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        {/* Decorative Elements */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: primaryColor }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: accentColor }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" style={{ color: isDark ? accentColor : '#FFFFFF' }} />
            </motion.div>
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: isDark ? accentColor : '#FFFFFF', opacity: 0.9 }}
            >
              {t('courses.badge')}
            </span>
          </div>

          <h1
            className="text-3xl lg:text-4xl font-bold mb-3"
            style={{ color: isDark ? textColor : '#FFFFFF' }}
          >
            {t('courses.title')}
          </h1>
          <p
            className="text-base lg:text-lg max-w-2xl"
            style={{ color: isDark ? `${textColor}99` : '#FFFFFF', opacity: 0.8 }}
          >
            {t('courses.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-8">
        {courseStats.map((stat, index) => (
          <CourseStatCard key={stat.title} {...stat} delay={index} isDark={isDark} />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderColor: 'rgba(234, 179, 8, 0.3)'
          }}
        >
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-400">{t('courses.error.info')}</h4>
              <p className="text-xs mt-1" style={{ color: textColor, opacity: 0.8 }}>{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-5 mb-8 shadow-sm"
        style={{ 
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`
        }}
      >
        <div className="flex flex-col 2xl:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200"
              style={{ color: `${textColor}50` }}
            />
            <input
              type="text"
              placeholder={t('courses.filters.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
              style={{
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="w-full 2xl:w-56">
            <PremiumSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: 'all', label: t('courses.filters.allCategories') },
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
              placeholder={t('courses.filters.category')}
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          {/* Level Filter */}
          <div className="w-full 2xl:w-56">
            <PremiumSelect
              value={filterLevel}
              onChange={setFilterLevel}
              options={[
                { value: 'all', label: t('courses.filters.allLevels') },
                ...levels.map(level => ({ value: level, label: level }))
              ]}
              placeholder={t('courses.filters.level')}
              icon={<GraduationCap className="w-5 h-5" />}
            />
          </div>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl p-16 border border-white/10 text-center"
          style={{ backgroundColor: cardBg }}
        >
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <BookOpen className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
            {courses.length === 0 ? t('courses.empty.noCourses') : t('courses.empty.noResults')}
          </h3>
          <p className="text-sm" style={{ color: `${textColor}70` }}>
            {courses.length === 0
              ? t('courses.empty.noCoursesSubtitle')
              : t('courses.empty.noResultsSubtitle')}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-6"
          >
            <p className="text-sm" style={{ color: `${textColor}70` }}>
              {t('courses.results.showing')} <span className="font-semibold" style={{ color: textColor }}>{filteredCourses.length}</span> {t('courses.results.courses')}
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                primaryColor={primaryColor}
                textColor={textColor}
                cardBg={cardBg}
                onClick={() => router.push(`/${orgSlug}/business-panel/courses/${course.id}`)}
                isDark={isDark}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
