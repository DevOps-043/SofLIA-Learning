'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'

import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminStatusBadge, AdminSurface, AdminTabs } from '../ui'
import type { PendingCourseActivity, PendingCourseLesson, PendingCourseMaterial, PendingCourseModule } from './types'
import { parseMaterialContent, resolveVideoEmbedUrl } from './utils'

type LessonTab = 'summary' | 'transcript' | 'activities' | 'materials'

interface QuizQuestion {
  correct_answer?: number | string
  correctAnswer?: number | string
  explanation?: string
  id?: string | number
  options?: string[]
  question?: string
}

interface ScriptScene {
  character?: string
  emotion?: string
  message?: string
}

interface QuizData {
  items?: QuizQuestion[]
  passing_score?: number
  questions?: QuizQuestion[]
}

interface ScriptData {
  conclusion?: string
  introduction?: string
  scenes?: ScriptScene[]
}

function getContentTone(type?: string) {
  if (type === 'quiz') return 'warning' as const
  if (type === 'ai_chat' || type === 'lia_script') return 'info' as const
  if (type === 'interactive') return 'primary' as const
  return 'neutral' as const
}

function VideoPlayer({ provider, providerId }: { provider: string; providerId: string }) {
  const [hasActivatedEmbed, setHasActivatedEmbed] = useState(false)
  const playbackPolicy = useMediaPlaybackPolicy('preview')
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const embedUrl = resolveVideoEmbedUrl(provider, providerId)

  if (!providerId) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
        {t('lessonContent.videoUnavailable')}
      </div>
    )
  }

  if (embedUrl && (provider === 'youtube' || provider === 'vimeo')) {
    if (playbackPolicy.shouldUseEmbedFacade && !hasActivatedEmbed) {
      return (
        <button
          type="button"
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: theme.surfaceSubtle, color: theme.text }}
          onClick={() => setHasActivatedEmbed(true)}
        >
          <span className="flex flex-col items-center gap-2">
            <PlayCircleIcon className="h-12 w-12" style={{ color: theme.action }} />
            <span className="text-sm font-semibold">{tc('media.tapToPlay')}</span>
          </span>
        </button>
      )
    }

    return (
      <iframe
        src={embedUrl}
        className="h-full w-full"
        frameBorder="0"
        allow={playbackPolicy.allowIframeAutoplay ? 'autoplay; fullscreen; picture-in-picture' : 'fullscreen; picture-in-picture'}
        allowFullScreen
        loading="lazy"
      />
    )
  }

  return (
    <video
      src={providerId}
      className="h-full w-full object-contain"
      controls
      controlsList="nodownload"
      playsInline
      preload={playbackPolicy.nativeVideoPreload}
    />
  )
}

function QuizViewer({ data }: { data: QuizData | null }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const questions = data?.questions || data?.items

  if (!data || !questions) {
    return <p className="text-sm italic" style={{ color: theme.textMuted }}>{t('lessonContent.invalidQuiz')}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs" style={{ borderColor: theme.divider, color: theme.textMuted }}>
        <span>{t('lessonContent.passingScore', { score: data.passing_score ?? 0 })}</span>
        <span>{t('lessonContent.questionsCount', { count: questions.length })}</span>
      </div>

      {questions.map((item, index) => (
        <AdminSurface key={item.id || index} className="p-3" style={{ boxShadow: 'none' }}>
          <p className="mb-2 text-sm font-semibold" style={{ color: theme.text }}>
            {index + 1}. {item.question}
          </p>
          <div className="space-y-1 pl-2">
            {item.options?.map((option, optionIndex) => {
              const correctAnswer = item.correct_answer !== undefined ? item.correct_answer : item.correctAnswer
              const isCorrect =
                (typeof correctAnswer === 'number' && correctAnswer === optionIndex) || correctAnswer === option

              return (
                <div
                  key={optionIndex}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: isCorrect ? theme.success : theme.textMuted }}
                >
                  {isCorrect ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border" style={{ borderColor: theme.border }} />
                  )}
                  <span>{option}</span>
                </div>
              )
            })}
          </div>
          {item.explanation ? (
            <AdminSurface className="mt-2 p-2" style={{ backgroundColor: theme.actionSurface, boxShadow: 'none' }}>
              <p className="text-xs" style={{ color: theme.text }}>
                <span className="font-bold">{t('lessonContent.explanation')}</span> {item.explanation}
              </p>
            </AdminSurface>
          ) : null}
        </AdminSurface>
      ))}
    </div>
  )
}

function ScriptViewer({ data }: { data: ScriptData | null }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  if (!data?.scenes) {
    return <p className="text-sm italic" style={{ color: theme.textMuted }}>{t('lessonContent.invalidScript')}</p>
  }

  return (
    <div className="space-y-4">
      {data.introduction ? (
        <AdminSurface className="p-3" style={{ backgroundColor: theme.actionSurface, boxShadow: 'none' }}>
          <p className="text-sm italic" style={{ color: theme.text }}>"{data.introduction}"</p>
        </AdminSurface>
      ) : null}

      <div className="space-y-3">
        {data.scenes.map((scene, index) => {
          const isUser = scene.character?.toLowerCase() === 'usuario' || scene.character?.toLowerCase() === 'user'

          return (
            <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: isUser ? theme.actionSurface : theme.surfaceSubtle, color: isUser ? theme.action : theme.textMuted }}
              >
                {scene.character?.[0] || '?'}
              </div>
              <div
                className="max-w-[80%] rounded-2xl p-3 text-sm"
                style={{ backgroundColor: isUser ? theme.actionSurface : theme.surfaceSubtle, color: theme.text }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold opacity-75">{scene.character}</span>
                  {scene.emotion ? (
                    <span className="rounded border px-1 text-[10px] uppercase tracking-wide opacity-60" style={{ borderColor: theme.border }}>
                      {scene.emotion}
                    </span>
                  ) : null}
                </div>
                <p>{scene.message}</p>
              </div>
            </div>
          )
        })}
      </div>

      {data.conclusion ? (
        <AdminSurface className="mt-4 p-3" style={{ backgroundColor: theme.surfaceSubtle, boxShadow: 'none' }}>
          <p className="text-sm" style={{ color: theme.text }}>
            <span className="font-bold">{t('lessonContent.conclusion')}</span> {data.conclusion}
          </p>
        </AdminSurface>
      ) : null}
    </div>
  )
}

function ActivityItem({ activity }: { activity: PendingCourseActivity }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { error, parsedContent } = parseMaterialContent(activity.activity_content)

  return (
    <AdminSurface className="overflow-hidden" style={{ boxShadow: 'none' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: theme.divider }}>
        <div className="flex min-w-0 items-center gap-2">
          <AdminStatusBadge tone={getContentTone(activity.activity_type)}>{activity.activity_type}</AdminStatusBadge>
          <h5 className="truncate text-sm font-semibold" style={{ color: theme.text }}>
            {activity.activity_title}
          </h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded-xl p-3 text-xs font-mono" style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}>
            {t('lessonContent.parseError', { error })}
            {' '}
            {t('lessonContent.rawPrefix', { value: String(activity.activity_content).substring(0, 100) })}
          </div>
        ) : (
          <div className="text-sm">
            {activity.activity_type === 'quiz' ? <QuizViewer data={parsedContent as QuizData | null} /> : null}
            {activity.activity_type === 'lia_script' || activity.activity_type === 'ai_chat' ? (
              <ScriptViewer data={parsedContent as ScriptData | null} />
            ) : null}
            {activity.activity_type !== 'quiz' &&
            activity.activity_type !== 'lia_script' &&
            activity.activity_type !== 'ai_chat' ? (
              <pre className="overflow-x-auto rounded-xl p-3 text-xs" style={{ backgroundColor: theme.surfaceSubtle, color: theme.text }}>
                {JSON.stringify(parsedContent, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </div>
    </AdminSurface>
  )
}

function MaterialItem({ material }: { material: PendingCourseMaterial }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  if (!material.material_type || (material.material_type !== 'quiz' && material.material_type !== 'interactive')) {
    return (
      <a
        href={material.file_url || material.external_url || '#'}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border p-3 transition hover:opacity-85"
        style={{ borderColor: theme.border, color: theme.text }}
      >
        <DocumentTextIcon className="h-5 w-5 shrink-0" style={{ color: theme.textMuted }} />
        <span className="min-w-0 flex-1 truncate text-sm">{material.material_title}</span>
        <AdminStatusBadge tone="neutral">{material.material_type || t('lessonContent.fileFallback')}</AdminStatusBadge>
      </a>
    )
  }

  const { error, parsedContent } = parseMaterialContent(material.content_data)

  return (
    <AdminSurface className="overflow-hidden" style={{ boxShadow: 'none' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: theme.divider }}>
        <div className="flex min-w-0 items-center gap-2">
          <AdminStatusBadge tone={getContentTone(material.material_type)}>{material.material_type}</AdminStatusBadge>
          <h5 className="truncate text-sm font-semibold" style={{ color: theme.text }}>
            {material.material_title}
          </h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded-xl p-3 text-xs font-mono" style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}>
            {error}
          </div>
        ) : (
          <div className="text-sm">
            {material.material_type === 'quiz' ? <QuizViewer data={parsedContent as QuizData | null} /> : null}
          </div>
        )}
      </div>
    </AdminSurface>
  )
}

export function AdminPendingCourseLessonDetails({ lesson }: { lesson: PendingCourseLesson }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [activeTab, setActiveTab] = useState<LessonTab>('summary')
  const tabs = [
    { value: 'summary' as const, label: t('lessonContent.summary') },
    { value: 'transcript' as const, label: t('lessonContent.transcript') },
    { value: 'activities' as const, label: t('lessonContent.activitiesCount', { count: lesson.activities?.length || 0 }) },
    { value: 'materials' as const, label: t('lessonContent.materialsCount', { count: lesson.materials?.length || 0 }) },
  ]

  return (
    <div className="space-y-5">
      <div className="mx-auto aspect-video max-w-2xl overflow-hidden rounded-2xl border" style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}>
        <VideoPlayer provider={lesson.video_provider} providerId={lesson.video_provider_id} />
      </div>

      <AdminTabs<LessonTab> value={activeTab} onChange={setActiveTab} tabs={tabs} />

      <AdminSurface className="min-h-[150px] p-4" style={{ boxShadow: 'none' }}>
        {activeTab === 'summary' ? (
          <div className="max-w-none text-sm leading-6" style={{ color: theme.text }}>
            {lesson.summary_content ? lesson.summary_content : <p className="italic" style={{ color: theme.textMuted }}>{t('lessonContent.noSummary')}</p>}
          </div>
        ) : null}

        {activeTab === 'transcript' ? (
          <div className="h-64 overflow-y-auto whitespace-pre-wrap rounded-xl p-3 text-sm" style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
            {lesson.transcript_content || t('lessonContent.noTranscript')}
          </div>
        ) : null}

        {activeTab === 'activities' ? (
          <div className="space-y-4">
            {lesson.activities?.length ? (
              lesson.activities.map((activity) => <ActivityItem key={activity.activity_id} activity={activity} />)
            ) : (
              <p className="italic" style={{ color: theme.textMuted }}>{t('lessonContent.noActivities')}</p>
            )}
          </div>
        ) : null}

        {activeTab === 'materials' ? (
          <div className="space-y-2">
            {lesson.materials?.length ? (
              lesson.materials.map((material) => <MaterialItem key={material.material_id} material={material} />)
            ) : (
              <p className="italic" style={{ color: theme.textMuted }}>{t('lessonContent.noMaterials')}</p>
            )}
          </div>
        ) : null}
      </AdminSurface>
    </div>
  )
}

function LessonItem({ lesson }: { lesson: PendingCourseLesson }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <div style={{ borderTop: `1px solid ${theme.divider}` }}>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:opacity-85"
      >
        <div className="rounded-xl p-2" style={{ backgroundColor: theme.actionSurface, color: theme.action }}>
          <PlayCircleIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold" style={{ color: theme.text }}>
            {lesson.lesson_title}
          </h4>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {t('lessonContent.durationSeconds', {
              seconds: lesson.duration_seconds,
              provider: lesson.video_provider,
            })}
          </p>
        </div>
        <div className="mr-2 hidden flex-wrap gap-2 sm:flex">
          {lesson.transcript_content ? <AdminStatusBadge tone="neutral">{t('lessonContent.transcriptBadge')}</AdminStatusBadge> : null}
          {lesson.summary_content ? <AdminStatusBadge tone="neutral">{t('lessonContent.summaryBadge')}</AdminStatusBadge> : null}
          {lesson.activities?.length ? (
            <AdminStatusBadge tone="info">{t('lessonContent.activityBadge', { count: lesson.activities.length })}</AdminStatusBadge>
          ) : null}
        </div>
        <ChevronLeftIcon
          className={`h-4 w-4 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`}
          style={{ color: theme.textMuted }}
        />
      </button>

      {isExpanded ? (
        <div className="border-t p-4" style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.divider }}>
          <AdminPendingCourseLessonDetails lesson={lesson} />
        </div>
      ) : null}
    </div>
  )
}

export function AdminPendingCourseLessonContent({ modules }: { modules?: PendingCourseModule[] }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  if (!modules?.length) {
    return (
      <AdminSurface className="mb-8 p-6 text-center">
        <p className="text-sm" style={{ color: theme.textMuted }}>{t('lessonContent.noModules')}</p>
      </AdminSurface>
    )
  }

  return (
    <div className="mb-8 space-y-4">
      {modules.map((module) => (
        <AdminSurface key={module.module_id} className="overflow-hidden">
          <div className="border-b px-6 py-4" style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.divider }}>
            <h3 className="font-bold" style={{ color: theme.text }}>
              {t('lessonContent.moduleTitle', {
                order: module.module_order_index,
                title: module.module_title,
              })}
            </h3>
          </div>
          <div>
            {module.lessons?.map((lesson) => (
              <LessonItem key={lesson.lesson_id} lesson={lesson} />
            ))}
          </div>
        </AdminSurface>
      ))}
    </div>
  )
}
