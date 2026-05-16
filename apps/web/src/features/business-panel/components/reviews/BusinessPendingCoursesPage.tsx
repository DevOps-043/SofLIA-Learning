'use client'

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/date-formatter'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Inbox,
  RefreshCcw,
  Sparkles,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { useAdminPendingCourses } from '@/features/admin/hooks/useAdminPendingCourses'
import { ConfirmationModal } from '@/features/admin/components/ConfirmationModal'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { BusinessPanelSearchInput } from '../shared/BusinessPanelSearchInput'
import { BusinessPanelStatCard } from '../shared/BusinessPanelStatCard'
import Joyride from 'react-joyride'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'
import { getAdminReviewsSteps, ADMIN_REVIEWS_TOUR_ID } from '@/features/tours/config/business-panel/admin-reviews-steps'

interface BusinessPendingCoursesPageProps {
  basePath: string
}

function CourseThumbnail({
  thumbnailUrl,
  title,
}: {
  thumbnailUrl?: string
  title: string
}) {
  const panelTheme = useBusinessPanelTheme()

  if (!thumbnailUrl) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at top, ${panelTheme.actionSurface}, ${panelTheme.hoverBg})`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center border"
          style={{
            backgroundColor: panelTheme.inputBg,
            borderColor: panelTheme.borderColor,
          }}
        >
          <FileText className="w-8 h-8" style={{ color: panelTheme.actionColor }} />
        </div>
      </div>
    )
  }

  return <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
}

export function BusinessPendingCoursesPage({
  basePath,
}: BusinessPendingCoursesPageProps) {
  const router = useRouter()
  const panelTheme = useBusinessPanelTheme()
  const { courses, isLoading, error, approveCourse, rejectCourse, deleteCourse } =
    useAdminPendingCourses()
  const { i18n, t: tBusiness } = useTranslation('business')
  const tReviews = (key: string) => tBusiness(`reviewsPage.${key}`)
  const tourSteps = useMemo(() => getAdminReviewsSteps(tBusiness), [tBusiness])

  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_REVIEWS_TOUR_ID,
    steps: tourSteps,
    enabled: !isLoading,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending')
  const [courseToApprove, setCourseToApprove] = useState<string | null>(null)
  const [courseToReject, setCourseToReject] = useState<string | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)

  const counts = useMemo(() => {
    return {
      pending: courses.filter((course) => course.approval_status === 'pending').length,
      rejected: courses.filter((course) => course.approval_status === 'rejected').length,
      updates: courses.filter((course) => course.is_update).length,
      fresh: courses.filter((course) => !course.is_update).length,
    }
  }, [courses])

  const filteredCourses = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesTab = course.approval_status === activeTab
      if (!matchesTab) return false
      if (!query) return true

      return [course.title, course.instructor_name, course.category, course.level]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [activeTab, courses, deferredSearchTerm])

  const handleApprove = async () => {
    if (!courseToApprove) return
    await approveCourse(courseToApprove, '')
    setCourseToApprove(null)
  }

  const handleReject = async () => {
    if (!courseToReject) return
    await rejectCourse(courseToReject, tReviews('rejectReason'))
    setCourseToReject(null)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    await deleteCourse(courseToDelete)
    setCourseToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-14 h-14 rounded-full border-4 animate-spin"
          style={{
            borderColor: `${panelTheme.actionColor}22`,
            borderTopColor: panelTheme.actionColor,
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-3xl border p-8 text-center"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: `${panelTheme.dangerColor}22`,
        }}
      >
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: panelTheme.dangerColor }} />
        <p className="font-semibold mb-2" style={{ color: panelTheme.textColor }}>
          {tReviews('errors.loadTitle')}
        </p>
        <p style={{ color: panelTheme.subtextColor }}>{error}</p>
      </div>
    )
  }

  return (
    <>
      {joyrideProps.run ? <Joyride {...joyrideProps} /> : null}
    <div className="space-y-8">
      <div id="tour-reviews-header" className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: panelTheme.textColor }}>
          {tReviews('title')}
        </h1>
        <p className="text-base" style={{ color: panelTheme.subtextColor }}>
          {tReviews('subtitle')}
        </p>
      </div>

      <div id="tour-reviews-stats" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <BusinessPanelStatCard
          icon={<Clock3 className="w-5 h-5" />}
          title={tReviews('stats.pending')}
          value={counts.pending}
          iconColor={panelTheme.actionColor}
        />
        <BusinessPanelStatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          title={tReviews('stats.rejected')}
          value={counts.rejected}
          iconColor={panelTheme.dangerColor}
        />
        <BusinessPanelStatCard
          icon={<RefreshCcw className="w-5 h-5" />}
          title={tReviews('stats.updates')}
          value={counts.updates}
          iconColor={panelTheme.brandColor}
        />
        <BusinessPanelStatCard
          icon={<Sparkles className="w-5 h-5" />}
          title={tReviews('stats.fresh')}
          value={counts.fresh}
          iconColor={panelTheme.successColor}
        />
      </div>

      <div id="tour-reviews-filters" className="space-y-5">
        <div
          className="inline-flex p-1 rounded-[18px] border gap-1"
          style={{
            backgroundColor: panelTheme.cardBg,
            borderColor: panelTheme.borderColor,
          }}
        >
          {[
            { id: 'pending', label: tReviews('tabs.pending'), count: counts.pending },
            { id: 'rejected', label: tReviews('tabs.rejected'), count: counts.rejected },
          ].map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'pending' | 'rejected')}
                className="px-5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2"
                style={{
                  backgroundColor: isActive ? panelTheme.actionColor : 'transparent',
                  color: isActive ? panelTheme.onActionColor : panelTheme.textColor,
                  border: `1px solid ${isActive ? `${panelTheme.actionColor}30` : 'transparent'}`,
                  opacity: isActive ? 1 : 0.76,
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? `${panelTheme.onActionColor}1A` : panelTheme.hoverBg,
                    color: isActive ? panelTheme.onActionColor : panelTheme.mutedTextColor,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="rounded-3xl border p-4"
          style={{
            backgroundColor: panelTheme.cardBg,
            borderColor: panelTheme.borderColor,
          }}
        >
          <BusinessPanelSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={tReviews('searchPlaceholder')}
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div
          className="rounded-3xl border p-12 text-center"
          style={{
            backgroundColor: panelTheme.cardBg,
            borderColor: panelTheme.borderColor,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: panelTheme.hoverBg,
              borderColor: panelTheme.borderColor,
            }}
          >
            <Inbox className="w-8 h-8" style={{ color: panelTheme.mutedTextColor }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: panelTheme.textColor }}>
            {activeTab === 'pending'
              ? tReviews('empty.pendingTitle')
              : tReviews('empty.rejectedTitle')}
          </p>
          <p style={{ color: panelTheme.subtextColor }}>
            {tReviews('empty.description')}
          </p>
        </div>
      ) : (
        <motion.div
          id="tour-reviews-grid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredCourses.map((course, index) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[28px] overflow-hidden border"
              style={{
                backgroundColor: panelTheme.cardBg,
                borderColor: panelTheme.borderColor,
                boxShadow: panelTheme.isDark
                  ? '0 18px 44px -26px rgba(0,0,0,0.55)'
                  : '0 18px 34px -28px rgba(15,23,42,0.18)',
              }}
            >
              <div className="relative h-52 overflow-hidden">
                <CourseThumbnail thumbnailUrl={course.thumbnail_url} title={course.title} />
                <div
                  className="absolute inset-x-0 bottom-0 h-24"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.84) 100%)',
                  }}
                />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <ReviewBadge
                    label={course.approval_status === 'rejected' ? tReviews('badges.rejected') : tReviews('badges.pending')}
                    tone={
                      course.approval_status === 'rejected'
                        ? {
                            color: panelTheme.dangerColor,
                            background: `${panelTheme.dangerColor}18`,
                            border: `${panelTheme.dangerColor}32`,
                          }
                        : {
                            color: panelTheme.warningColor,
                            background: `${panelTheme.warningColor}18`,
                            border: `${panelTheme.warningColor}32`,
                          }
                    }
                  />
                  <ReviewBadge
                    label={course.is_update ? tReviews('badges.update') : tReviews('badges.new')}
                    tone={
                      course.is_update
                        ? {
                            color: panelTheme.brandColor,
                            background: `${panelTheme.brandColor}18`,
                            border: `${panelTheme.brandColor}32`,
                          }
                        : {
                            color: panelTheme.successColor,
                            background: `${panelTheme.successColor}18`,
                            border: `${panelTheme.successColor}32`,
                          }
                    }
                  />
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold leading-tight line-clamp-2" style={{ color: panelTheme.textColor }}>
                    {course.title}
                  </h2>
                  <div className="flex items-center gap-2 text-sm" style={{ color: panelTheme.subtextColor }}>
                    <UserCircle2 className="w-4 h-4" />
                    <span className="line-clamp-1">{course.instructor_name || tReviews('fallbacks.pendingInstructor')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoPill label={tReviews('labels.date')} value={formatDate(course.created_at, i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })} />
                  <InfoPill label={tReviews('labels.level')} value={course.level || tReviews('fallbacks.notAvailable')} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ActionButton
                    label={activeTab === 'rejected' ? tReviews('actions.reconsider') : tReviews('actions.approve')}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => setCourseToApprove(course.id)}
                    backgroundColor={panelTheme.actionColor}
                    color={panelTheme.onActionColor}
                    borderColor={`${panelTheme.actionColor}22`}
                  />
                  <ActionButton
                    label={tReviews('actions.view')}
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => router.push(`${basePath}/${course.id}`)}
                    backgroundColor={panelTheme.inputBg}
                    color={panelTheme.textColor}
                    borderColor={panelTheme.borderColor}
                  />
                </div>

                {activeTab === 'pending' ? (
                  <ActionButton
                    label={tReviews('actions.reject')}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    onClick={() => setCourseToReject(course.id)}
                    backgroundColor={`${panelTheme.dangerColor}12`}
                    color={panelTheme.dangerColor}
                    borderColor={`${panelTheme.dangerColor}24`}
                  />
                ) : (
                  <ActionButton
                    label={tReviews('actions.deletePermanently')}
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setCourseToDelete(course.id)}
                    backgroundColor={`${panelTheme.dangerColor}12`}
                    color={panelTheme.dangerColor}
                    borderColor={`${panelTheme.dangerColor}24`}
                  />
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={!!courseToApprove}
        onClose={() => setCourseToApprove(null)}
        onConfirm={handleApprove}
        title={activeTab === 'rejected' ? tReviews('approveModal.reconsiderTitle') : tReviews('approveModal.approveTitle')}
        message={
          activeTab === 'rejected'
            ? tReviews('approveModal.reconsiderMessage')
            : tReviews('approveModal.approveMessage')
        }
        confirmText={activeTab === 'rejected' ? tReviews('approveModal.reconsiderConfirm') : tReviews('approveModal.approveConfirm')}
        cancelText={tReviews('actions.cancel')}
        type="success"
      />

      <ConfirmationModal
        isOpen={!!courseToReject}
        onClose={() => setCourseToReject(null)}
        onConfirm={handleReject}
        title={tReviews('rejectModal.title')}
        message={tReviews('rejectModal.message')}
        confirmText={tReviews('rejectModal.confirm')}
        cancelText={tReviews('actions.cancel')}
        type="danger"
      />

      <ConfirmationModal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleDelete}
        title={tReviews('deleteModal.title')}
        message={tReviews('deleteModal.message')}
        confirmText={tReviews('deleteModal.confirm')}
        cancelText={tReviews('actions.cancel')}
        type="danger"
      />
    </div>
    </>
  )
}

function ReviewBadge({
  label,
  tone,
}: {
  label: string
  tone: { color: string; background: string; border: string }
}) {
  return (
    <span
      className="backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-xl border"
      style={{
        color: tone.color,
        backgroundColor: tone.background,
        borderColor: tone.border,
      }}
    >
      {label}
    </span>
  )
}

function InfoPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="rounded-2xl border px-3 py-2"
      style={{
        backgroundColor: panelTheme.hoverBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: panelTheme.mutedTextColor }}>
        {label}
      </p>
      <p className="text-sm font-medium truncate mt-1" style={{ color: panelTheme.textColor }}>
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  backgroundColor,
  color,
  borderColor,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  backgroundColor: string
  color: string
  borderColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
