'use client'

import React, { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Film,
  Layers,
  Loader2,
  Play,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { STREAMABLE_VIDEO_ACCEPT } from '@/lib/media/video-upload-policy'
import { useHlsPlayback } from '@/lib/media/useHlsPlayback'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useBusinessLearningPathVideos } from '../hooks/useBusinessLearningPathVideos'
import type { BusinessLearningPath } from '../services/businessLearningPaths.service'

interface BusinessLearningPathVideosModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  learningPath: BusinessLearningPath | null
}

interface VideoSlotProps {
  title: string
  videoUrl: string | null
  isUploading: boolean
  isDeleting: boolean
  onUpload: (file: File) => void
  onDelete: () => void
  theme: ReturnType<typeof useBusinessPanelTheme>
  t: ReturnType<typeof useTranslation<'business'>>['t']
}

function VideoSlot({ title, videoUrl, isUploading, isDeleting, onUpload, onDelete, theme, t }: VideoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useHlsPlayback(videoRef, videoUrl ?? '')

  return (
    <div
      className="rounded-[1.8rem] border overflow-hidden"
      style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b" style={{ borderColor: theme.borderColor }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Video className="h-4 w-4 shrink-0 opacity-50" style={{ color: theme.textColor }} />
          <span className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>{title}</span>
        </div>
        {videoUrl && !isUploading && !isDeleting && (
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: theme.successColor }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.successColor }}>
              {t('learningPathsPage.introVideos.active')}
            </span>
          </div>
        )}
      </div>

      {/* Slot body */}
      <div className="p-4">
        {videoUrl ? (
          <div className="space-y-3">
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              controls
              preload="metadata"
              className="w-full rounded-2xl block bg-gray-900"
              style={{ maxHeight: 160 }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading || isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor, color: theme.mutedTextColor }}
              >
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {isUploading ? t('learningPathsPage.introVideos.uploading') : t('learningPathsPage.introVideos.upload')}
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isUploading || isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 5.9%, transparent)`,
                  borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.5%, transparent)`,
                  color: theme.dangerColor,
                }}
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? t('learningPathsPage.introVideos.deleting') : t('learningPathsPage.introVideos.delete')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-7 transition-all disabled:opacity-50 hover:opacity-80"
            style={{ borderColor: theme.borderColor }}
          >
            {isUploading
              ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.actionColor }} />
              : <Upload className="h-6 w-6" style={{ color: theme.actionColor }} />
            }
            <span className="text-xs font-medium" style={{ color: theme.mutedTextColor }}>
              {isUploading
                ? t('learningPathsPage.introVideos.uploading')
                : t('learningPathsPage.introVideos.noVideo')}
            </span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept={STREAMABLE_VIDEO_ACCEPT} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = '' } }}
      />
    </div>
  )
}

export function BusinessLearningPathVideosModal({
  isOpen,
  onClose,
  orgSlug,
  learningPath,
}: BusinessLearningPathVideosModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const {
    lpVideoUrl, courseVideos, uploading, deleting, error, success,
    handleUploadLpVideo, handleDeleteLpVideo,
    handleUploadCourseVideo, handleDeleteCourseVideo, clearFeedback,
  } = useBusinessLearningPathVideos(orgSlug, learningPath, isOpen)

  if (!isOpen || !learningPath) return null

  const sortedItems = [...learningPath.items].sort((a, b) => a.position - b.position)
  const primaryColor = theme.primaryColor
  const onPrimaryColor = theme.onPrimaryColor
  const textColor = theme.textColor
  const mutedText = theme.mutedTextColor
  const borderColor = theme.borderColor
  const inputBg = theme.inputBg
  const surfaceColor = theme.panelBg

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate"
        style={{ zIndex: 99999 }}
      >
        {/* Click-away capture */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-transparent"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl h-full sm:h-[85vh] sm:max-h-[750px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col h-full overflow-hidden border"
            style={{ backgroundColor: surfaceColor, borderColor }}
          >
            {/* ── Header ── */}
            <div className="relative shrink-0 pt-6 pb-4 px-6 lg:px-10 border-b" style={{ borderColor }}>
              <div className="flex items-center gap-5">
                <div
                  className="w-14 h-14 rounded-[1.4rem] flex items-center justify-center shadow-xl border-4 shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${theme.accentColor})`, borderColor }}
                >
                  <Film className="w-6 h-6" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: mutedText }}>
                    {t('learningPathsPage.introVideos.modalTitle')}
                  </p>
                  <h2 className="text-xl font-black tracking-tight line-clamp-1" style={{ color: textColor }}>
                    {learningPath.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl border transition-all shrink-0"
                  style={{ backgroundColor: inputBg, borderColor, color: mutedText }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Error / Success banner ── */}
            <AnimatePresence>
              {(error || success) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <div
                    className="flex items-center justify-between gap-3 px-8 py-3 text-[10px] font-black uppercase tracking-widest border-b"
                    style={{
                      backgroundColor: error ? `color-mix(in srgb, ${theme.dangerColor} 6.3%, transparent)` : `color-mix(in srgb, ${theme.successColor} 6.3%, transparent)`,
                      borderColor: error ? `color-mix(in srgb, ${theme.dangerColor} 12.5%, transparent)` : `color-mix(in srgb, ${theme.successColor} 12.5%, transparent)`,
                    }}
                  >
                    <span className="flex items-center gap-2" style={{ color: error ? theme.dangerColor : theme.successColor }}>
                      {error
                        ? <AlertCircle className="h-4 w-4 shrink-0" />
                        : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      {error ?? success}
                    </span>
                    <button type="button" onClick={clearFeedback} style={{ color: error ? theme.dangerColor : theme.successColor }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Body ── */}
            <div
              className="flex-1 overflow-y-auto pt-6 pb-10 px-6 lg:px-10 space-y-8"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${borderColor} transparent` }}
            >
              {/* LP video section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 flex items-center gap-2" style={{ color: mutedText }}>
                  <Layers className="h-3.5 w-3.5" />
                  {t('learningPathsPage.introVideos.lpVideoTitle')}
                </label>
                <VideoSlot
                  title={learningPath.title}
                  videoUrl={lpVideoUrl}
                  isUploading={Boolean(uploading[`lp:${learningPath.id}`])}
                  isDeleting={Boolean(deleting[`lp:${learningPath.id}`])}
                  onUpload={(file) => void handleUploadLpVideo(file)}
                  onDelete={() => void handleDeleteLpVideo()}
                  theme={theme}
                  t={t}
                />
              </div>

              {/* Course videos section */}
              {sortedItems.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 flex items-center gap-2" style={{ color: mutedText }}>
                    <Play className="h-3.5 w-3.5" />
                    {t('learningPathsPage.introVideos.coursesSectionTitle')}
                  </label>
                  <div className="space-y-4">
                    {sortedItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div
                          className="mt-5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black"
                          style={{ backgroundColor: inputBg, borderColor, color: mutedText, border: `1px solid ${borderColor}` }}
                        >
                          {item.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <VideoSlot
                            title={item.course?.title ?? t('learningPathsPage.introVideos.unnamedCourse')}
                            videoUrl={courseVideos[item.course_id] ?? null}
                            isUploading={Boolean(uploading[`course:${item.course_id}`])}
                            isDeleting={Boolean(deleting[`course:${item.course_id}`])}
                            onUpload={(file) => void handleUploadCourseVideo(item.course_id, file)}
                            onDelete={() => void handleDeleteCourseVideo(item.course_id)}
                            theme={theme}
                            t={t}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div
              className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
                <Film className="w-5 h-5" style={{ color: textColor }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: textColor }}>
                  {t('learningPathsPage.introVideos.modalTitle')}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                  style={{ color: mutedText, backgroundColor: inputBg, borderColor }}
                >
                  {t('learningPathsPage.introVideos.close')}
                </button>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-[2] sm:flex-none px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
                  style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                >
                  <span>{t('learningPathsPage.introVideos.done')}</span>
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
