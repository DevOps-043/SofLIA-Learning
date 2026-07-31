'use client'

import { Search, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type {
  ReportsAnalyticsResponse,
  ReportsAnalyticsUserRankingRow,
} from '../../types/reports-analytics.types'
import { PremiumSelectFilter } from './PremiumSelectFilter'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsT } from './types'

type ProgressState = 'completed' | 'in_progress' | 'not_started'
type ProgressStateFilter = 'all' | ProgressState

const PAGE_SIZE = 8

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function getProgressState(row: ReportsAnalyticsUserRankingRow): ProgressState {
  const progress = clampPercentage(row.averageProgress)
  const completion = clampPercentage(row.completionRate)

  if (completion >= 100 || progress >= 100) return 'completed'
  if (progress > 0 || completion > 0) return 'in_progress'
  return 'not_started'
}

function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function ProgressMeter({
  value,
  label,
}: {
  value: number
  label: string
}) {
  const percentage = clampPercentage(value)

  return (
    <div
      className={styles.progressCell}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <span className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${percentage}%` }} />
      </span>
      <span className={styles.progressValue}>{percentage}%</span>
    </div>
  )
}

function StatusBadge({
  status,
  t,
}: {
  status: ProgressState
  t: ReportsAnalyticsT
}) {
  const statusClass =
    status === 'completed'
      ? styles.statusCompleted
      : status === 'in_progress'
        ? styles.statusInProgress
        : styles.statusNotStarted

  return (
    <span className={`${styles.statusBadge} ${statusClass}`}>
      {t(`reportsAnalytics.progressOverview.status.${status}`)}
    </span>
  )
}

interface ProgressOverviewTableProps {
  data: Pick<ReportsAnalyticsResponse, 'filters' | 'filterOptions' | 'rankings'>
  t: ReportsAnalyticsT
  onCourseChange: (courseId: string) => void
}

export function ProgressOverviewTable({
  data,
  t,
  onCourseChange,
}: ProgressOverviewTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProgressStateFilter>('all')
  const [page, setPage] = useState(1)

  const rowsWithStatus = useMemo(
    () => data.rankings.users.map((row) => ({ row, status: getProgressState(row) })),
    [data.rankings.users],
  )

  const statusCounts = useMemo(
    () => rowsWithStatus.reduce(
      (counts, item) => {
        counts[item.status] += 1
        return counts
      },
      { completed: 0, in_progress: 0, not_started: 0 },
    ),
    [rowsWithStatus],
  )

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery)

    return rowsWithStatus.filter(({ row, status }) => {
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (!normalizedQuery) return true

      return normalizeSearchValue(
        [
          row.displayName,
          row.email,
          row.jobTitle,
          row.teamName,
          row.regionName,
          row.zoneName,
        ].join(' '),
      ).includes(normalizedQuery)
    })
  }, [rowsWithStatus, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const selectedCourseLabel =
    data.filterOptions.courses.find((course) => course.value === data.filters.courseId)?.label
    ?? t('reportsAnalytics.filters.allCourses')

  useEffect(() => {
    setPage(1)
  }, [data.filters.courseId, searchQuery, statusFilter])

  return (
    <section className={styles.progressPanel} aria-labelledby="reports-progress-title">
      <header className={styles.progressHeader}>
        <div className={styles.progressHeaderCopy}>
          <h2 id="reports-progress-title">
            {t('reportsAnalytics.sections.progressOverview')}
          </h2>
          <p>{t('reportsAnalytics.sections.progressOverviewSubtitle')}</p>
        </div>

        <div className={styles.progressSummary} aria-label={t('reportsAnalytics.progressOverview.summary')}>
          <span className={`${styles.summaryPill} ${styles.statusCompleted}`}>
            {statusCounts.completed} {t('reportsAnalytics.progressOverview.status.completed')}
          </span>
          <span className={`${styles.summaryPill} ${styles.statusInProgress}`}>
            {statusCounts.in_progress} {t('reportsAnalytics.progressOverview.status.in_progress')}
          </span>
          <span className={`${styles.summaryPill} ${styles.statusNotStarted}`}>
            {statusCounts.not_started} {t('reportsAnalytics.progressOverview.status.not_started')}
          </span>
        </div>
      </header>

      <div className={styles.progressToolbar}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>
            {t('reportsAnalytics.progressOverview.userFilter')}
          </span>
          <span className={styles.searchField}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('reportsAnalytics.progressOverview.searchPlaceholder')}
            />
          </span>
        </label>

        <PremiumSelectFilter
          value={data.filters.courseId ?? ''}
          label={t('reportsAnalytics.filters.course')}
          options={data.filterOptions.courses}
          allLabel={t('reportsAnalytics.filters.allCourses')}
          onChange={onCourseChange}
        />

        <PremiumSelectFilter
          value={statusFilter === 'all' ? '' : statusFilter}
          label={t('reportsAnalytics.progressOverview.completionFilter')}
          options={[
            {
              value: 'completed',
              label: t('reportsAnalytics.progressOverview.status.completed'),
            },
            {
              value: 'in_progress',
              label: t('reportsAnalytics.progressOverview.status.in_progress'),
            },
            {
              value: 'not_started',
              label: t('reportsAnalytics.progressOverview.status.not_started'),
            },
          ]}
          allLabel={t('reportsAnalytics.progressOverview.allStatuses')}
          onChange={(value) => setStatusFilter((value || 'all') as ProgressStateFilter)}
        />

        <span className={styles.resultsCount} aria-live="polite">
          {filteredRows.length} {t('reportsAnalytics.progressOverview.results')}
        </span>
      </div>

      {visibleRows.length > 0 ? (
        <>
          <div className={styles.tableViewport}>
            <table className={styles.progressTable}>
              <thead>
                <tr>
                  <th>{t('reportsAnalytics.table.user')}</th>
                  <th>{t('reportsAnalytics.progressOverview.learningScope')}</th>
                  <th>{t('reportsAnalytics.filters.status')}</th>
                  <th>{t('reportsAnalytics.table.progress')}</th>
                  <th>{t('reportsAnalytics.table.completion')}</th>
                  <th>{t('reportsAnalytics.table.overdue')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ row, status }) => (
                  <tr key={row.userId}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.userAvatar} aria-hidden="true">
                          {getInitials(row.displayName)}
                        </span>
                        <span>
                          <p className={styles.userName}>{row.displayName}</p>
                          <p className={styles.userMeta}>{row.jobTitle || row.email}</p>
                        </span>
                      </div>
                    </td>
                    <td data-label={t('reportsAnalytics.progressOverview.learningScope')}>
                      <div className={styles.courseContext}>
                        {selectedCourseLabel}
                        {row.teamName && row.teamName !== 'unspecified'
                          ? ` · ${row.teamName}`
                          : ''}
                      </div>
                    </td>
                    <td data-label={t('reportsAnalytics.filters.status')}>
                      <StatusBadge status={status} t={t} />
                    </td>
                    <td data-label={t('reportsAnalytics.table.progress')}>
                      <ProgressMeter
                        value={row.averageProgress}
                        label={`${t('reportsAnalytics.table.progress')}: ${row.displayName}`}
                      />
                    </td>
                    <td data-label={t('reportsAnalytics.table.completion')}>
                      <ProgressMeter
                        value={row.completionRate}
                        label={`${t('reportsAnalytics.table.completion')}: ${row.displayName}`}
                      />
                    </td>
                    <td data-label={t('reportsAnalytics.table.overdue')}>
                      <span className={styles.numericValue}>{row.overdueAssignments}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label={t('reportsAnalytics.progressOverview.paginationLabel')}>
              <p className={styles.paginationSummary}>
                {t('reportsAnalytics.progressOverview.page')} {safePage} {t('reportsAnalytics.progressOverview.of')} {totalPages}
              </p>
              <div className={styles.paginationActions}>
                <button
                  type="button"
                  className={styles.paginationButton}
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {t('reportsAnalytics.progressOverview.previous')}
                </button>
                <button
                  type="button"
                  className={styles.paginationButton}
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  {t('reportsAnalytics.progressOverview.next')}
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <div className={styles.emptyProgress}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <UsersRound />
          </span>
          <h3>{t('reportsAnalytics.progressOverview.emptyTitle')}</h3>
          <p>{t('reportsAnalytics.progressOverview.emptyDescription')}</p>
        </div>
      )}
    </section>
  )
}
