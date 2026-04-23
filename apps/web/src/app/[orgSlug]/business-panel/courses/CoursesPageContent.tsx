'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Search,
  Filter,
  GraduationCap,
  Award,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { CourseStatCard } from './CourseStatCard'
import { CourseCard } from './CourseCard'
import { useCoursesPageLogic } from './useCoursesPageLogic'

export function CoursesPageContent() {
  const {
    t,
    isDark,
    primaryColor,
    accentColor,
    secondaryColor,
    textColor,
    cardBg,
    borderColor,
    courses,
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
  } = useCoursesPageLogic()

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

      {/* Stats Grid - Minimalist Dashboard Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {courseStats.map((stat, index) => (
          <CourseStatCard key={stat.title} {...stat} delay={index} />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl border-2"
          style={{
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.05)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-medium text-amber-500">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Filters Section - EXACT Replication of Users Page Style */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search Input - Matching Users Page Design */}
        <div className="flex-1 relative group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-opacity ${isDark ? 'group-focus-within:opacity-70 opacity-40' : 'group-focus-within:opacity-50 opacity-30'}`}
            style={{ color: textColor }}
          />
          <input
            type="text"
            placeholder={t('courses.filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all duration-300"
            style={{
              backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: textColor,
            }}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-64">
          <PremiumSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: t('courses.filters.allCategories') },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            placeholder={t('courses.filters.category')}
            icon={<Filter className="w-4 h-4" />}
          />
        </div>

        {/* Level Filter */}
        <div className="w-full lg:w-64">
          <PremiumSelect
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { value: 'all', label: t('courses.filters.allLevels') },
              ...levels.map(level => ({ value: level, label: level }))
            ]}
            placeholder={t('courses.filters.level')}
            icon={<GraduationCap className="w-4 h-4" />}
          />
        </div>

        {/* View Mode Toggle - Matching Users Page */}
        <div
          className="flex items-center rounded-xl border-2 overflow-hidden ml-auto"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF',
          }}
        >
          <button
            onClick={() => {/* setViewMode('grid') */}}
            className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            style={{ backgroundColor: `${primaryColor}30` }}
          >
            <LayoutGrid className="w-5 h-5" style={{ color: primaryColor }} />
          </button>
          <div className="w-px h-6" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          <button
            onClick={() => {/* setViewMode('list') */}}
            className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <List className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
          </button>
        </div>
      </div>

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
              {t('courses.results.showing')}{' '}
              <span className="font-semibold" style={{ color: textColor }}>
                {filteredCourses.length}
              </span>{' '}
              {t('courses.results.courses')}
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onClick={() => handleCourseClick(course.id)}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
