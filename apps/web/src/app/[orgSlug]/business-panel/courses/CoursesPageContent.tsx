'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Filter,
  GraduationCap,
  LayoutGrid,
  LibraryBig,
  List,
  Search,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

import { PrefetchLink } from '@/core/components/PrefetchLink'
import { PremiumSelect } from '@/shared/components/premium-form-controls'
import { useTour } from '@/features/tours'
import { businessPanelCoursesTour } from '@/features/tours/config/business-panel-courses.tour'
import { useMotionSafe } from '@/lib/utils/motion'

import { CourseCard } from './CourseCard'
import { CourseStatCard } from './CourseStatCard'
import styles from './ContentPanel.module.css'
import { useCoursesPageLogic } from './useCoursesPageLogic'

export function CoursesPageContent() {
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const {
    t,
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
    viewMode,
    setViewMode,
    orgSlug,
    heroBackground,
    heroBorderColor,
    actionColor,
    onActionColor,
    accentColor,
    borderColor,
    inputBg,
    panelBg,
    cardBg,
    textColor,
    subtextColor,
  } = useCoursesPageLogic()
  const { autoStartIfNeeded } = useTour(businessPanelCoursesTour)

  useEffect(() => autoStartIfNeeded(), [autoStartIfNeeded])

  if (isLoading) {
    return (
      <div className={styles.loadingPage} aria-label="Cargando catálogo de cursos">
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        <div className={`${styles.skeleton} ${styles.skeletonStats}`} />
        <div className={`${styles.skeleton} ${styles.skeletonToolbar}`} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className={`${styles.skeleton} ${styles.skeletonCard}`} />
          ))}
        </div>
      </div>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('all')
    setFilterLevel('all')
  }
  const controlPalette = {
    accentColor,
    borderColor,
    inputBg,
    menuBg: cardBg,
    mutedText: subtextColor,
    onPrimaryColor: onActionColor,
    primaryColor: actionColor,
    surfaceColor: panelBg,
    textColor,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={interfaceTransition}
      className={styles.contentStack}
    >
      <motion.section
        data-tour-id="business-panel-courses--hero"
        initial={{ opacity: 0, y: disableHeavy ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={interfaceTransition}
        className={styles.hero}
        style={{ background: heroBackground, borderColor: heroBorderColor }}
        aria-labelledby="courses-page-title"
      >
        <div className={styles.heroAtmosphere} aria-hidden="true" />
        <div className={styles.heroRingLarge} aria-hidden="true" />
        <div className={styles.heroRingSmall} aria-hidden="true" />
        <div className={styles.heroDot} aria-hidden="true" />

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t('courses.badge')}</p>
          <h1 id="courses-page-title" className={styles.heroTitle}>
            {t('courses.title')}
          </h1>
          <p className={styles.heroDescription}>{t('courses.subtitle')}</p>
        </div>

        <div className={styles.heroIcon} aria-hidden="true">
          <BookOpen />
        </div>
      </motion.section>

      <div data-tour-id="business-panel-courses--stats" className={styles.statsSurface}>
        {courseStats.map((stat, index) => (
          <CourseStatCard key={stat.title} {...stat} delay={index} />
        ))}
      </div>

      {error ? (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <section
        data-tour-id="business-panel-courses--filters"
        className={styles.controlsSurface}
        aria-label="Buscar y filtrar cursos"
      >
        <div className={styles.primaryFilters}>
          <label className={styles.search}>
            <span className="sr-only">{t('courses.filters.search')}</span>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder={t('courses.filters.search')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={styles.searchInput}
            />
          </label>

          <div className={styles.selectSlot}>
            <PremiumSelect
              ariaLabel={t('courses.filters.category')}
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: 'all', label: t('courses.filters.allCategories') },
                ...categories.map((category) => ({ value: category, label: category })),
              ]}
              palette={controlPalette}
              placeholder={t('courses.filters.category')}
              icon={Filter}
            />
          </div>

          <div className={styles.selectSlot}>
            <PremiumSelect
              ariaLabel={t('courses.filters.level')}
              value={filterLevel}
              onChange={setFilterLevel}
              options={[
                { value: 'all', label: t('courses.filters.allLevels') },
                ...levels.map((level) => ({ value: level, label: level })),
              ]}
              palette={controlPalette}
              placeholder={t('courses.filters.level')}
              icon={GraduationCap}
            />
          </div>

          <div
            data-tour-id="business-panel-courses--view-toggle"
            className={styles.viewToggle}
            aria-label="Cambiar vista del catálogo"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
              aria-label="Vista en cuadrícula"
              aria-pressed={viewMode === 'grid'}
              title="Vista en cuadrícula"
            >
              <LayoutGrid aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
              aria-label="Vista en lista"
              aria-pressed={viewMode === 'list'}
              title="Vista en lista"
            >
              <List aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <header className={styles.collectionHeader}>
        <div>
          <h2 className={styles.collectionTitle}>Cursos disponibles</h2>
          <p className={styles.collectionSummary} aria-live="polite">
            {filteredCourses.length} de {courses.length} cursos
          </p>
        </div>
      </header>

      {filteredCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <BookOpen />
            </span>
            <h3>
              {courses.length === 0 ? t('courses.empty.noCourses') : t('courses.empty.noResults')}
            </h3>
            <p>
              {courses.length === 0
                ? t('courses.empty.noCoursesSubtitle')
                : t('courses.empty.noResultsSubtitle')}
            </p>
            {courses.length > 0 ? (
              <button type="button" onClick={clearFilters} className={styles.emptyAction}>
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div data-tour-id="business-panel-courses--grid" className={styles.courseGrid}>
          {filteredCourses.map((course, index) => (
            <PrefetchLink
              key={course.id}
              href={`/${orgSlug}/business-panel/courses/${course.id}`}
              className={styles.courseLink}
              {...(index === 0 ? { 'data-tour-id': 'business-panel-courses--first-card' } : {})}
            >
              <CourseCard course={course} index={index} />
            </PrefetchLink>
          ))}
        </div>
      ) : (
        <div className={styles.courseList}>
          {filteredCourses.map((course, index) => (
            <PrefetchLink
              key={course.id}
              href={`/${orgSlug}/business-panel/courses/${course.id}`}
              className={styles.courseLink}
            >
              <motion.article
                initial={{ opacity: 0, y: disableHeavy ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...interfaceTransition,
                  delay: disableHeavy ? 0 : Math.min(index * interfaceStaggerSeconds, 0.08),
                }}
                className={styles.courseListItem}
              >
                <div className={styles.courseListMedia}>
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt=""
                      fill
                      priority={index < 6}
                      sizes="90px"
                    />
                  ) : (
                    <div className={styles.courseFallback}>
                      <BookOpen aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className={styles.courseListIdentity}>
                  <h3>{course.title}</h3>
                  <p>{course.instructor.name}</p>
                </div>
                <div className={styles.courseListMeta}>
                  <span>{t('courses.filters.category')}</span>
                  <strong>{course.category || 'Sin categoría'}</strong>
                </div>
                <div className={styles.courseListMeta}>
                  <span>{t('courses.filters.level')}</span>
                  <strong>{course.level || 'Sin nivel'}</strong>
                </div>
                <span className={styles.courseListArrow} aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </motion.article>
            </PrefetchLink>
          ))}
        </div>
      )}
    </motion.div>
  )
}
