'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Film, Layers, Loader2, Play, Trash2, Upload, Video, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useBusinessLearningPathVideos } from '../hooks/useBusinessLearningPathVideos'
import type { BusinessLearningPath } from '../services/businessLearningPaths.service'

const VIDEO_MIME_TYPES = 'video/mp4,video/webm,video/ogg,video/quicktime'
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024

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
  t: (key: string) => string
}

function VideoSlot({
  title,
  videoUrl,
  isUploading,
  isDeleting,
  onUpload,
  onDelete,
  theme,
  t,
}: VideoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      alert(t('learningPathsPage.introVideos.errorFileTooLarge'))
      return
    }
    onUpload(file)
    e.target.value = ''
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
        >
          <Video className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>
          {title}
        </p>
      </div>

      {videoUrl ? (
        <div className="space-y-2">
          <video
            src={videoUrl}
            controls
            preload="metadata"
            className="w-full rounded-xl overflow-hidden"
            style={{ maxHeight: 180, backgroundColor: '#000' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
              style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isUploading ? t('learningPathsPage.introVideos.uploading') : t('learningPathsPage.introVideos.upload')}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
              style={{
                backgroundColor: `${theme.dangerColor}0d`,
                borderColor: `${theme.dangerColor}25`,
                color: theme.dangerColor,
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {isDeleting ? t('learningPathsPage.introVideos.deleting') : t('learningPathsPage.introVideos.delete')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition disabled:opacity-50"
          style={{ borderColor: theme.borderColor }}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.actionColor }} />
          ) : (
            <Upload className="h-6 w-6" style={{ color: theme.actionColor }} />
          )}
          <p className="text-xs font-medium" style={{ color: theme.subtextColor }}>
            {isUploading ? t('learningPathsPage.introVideos.uploading') : t('learningPathsPage.introVideos.noVideo')}
          </p>
          {!isUploading && (
            <span
              className="rounded-lg px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              {t('learningPathsPage.introVideos.upload')}
            </span>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_MIME_TYPES}
        className="hidden"
        onChange={handleFileChange}
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
    lpVideoUrl,
    courseVideos,
    uploading,
    deleting,
    error,
    success,
    handleUploadLpVideo,
    handleDeleteLpVideo,
    handleUploadCourseVideo,
    handleDeleteCourseVideo,
    clearFeedback,
  } = useBusinessLearningPathVideos(orgSlug, learningPath, isOpen)

  if (!isOpen || !learningPath) return null

  const sortedItems = [...learningPath.items].sort((a, b) => a.position - b.position)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border shadow-2xl"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-3 px-6 py-4 border-b"
            style={{ borderColor: theme.borderColor }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
              >
                <Film className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.subtextColor }}>
                  {t('learningPathsPage.introVideos.modalTitle')}
                </p>
                <h2 className="text-base font-black leading-tight line-clamp-1" style={{ color: theme.textColor }}>
                  {learningPath.title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition"
              style={{ backgroundColor: theme.inputBg, color: theme.subtextColor }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: error ? `${theme.dangerColor}12` : `${theme.successColor}12`,
                    color: error ? theme.dangerColor : theme.successColor,
                  }}
                >
                  <span>{error ?? success}</span>
                  <button type="button" onClick={clearFeedback} className="text-xs font-black uppercase tracking-widest">✕</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* LP intro video */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 shrink-0" style={{ color: theme.actionColor }} />
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.textColor }}>
                  {t('learningPathsPage.introVideos.lpVideoTitle')}
                </h3>
              </div>
              <VideoSlot
                title={learningPath.title}
                videoUrl={lpVideoUrl}
                isUploading={Boolean(uploading[`lp:${learningPath.id}`])}
                isDeleting={Boolean(deleting[`lp:${learningPath.id}`])}
                onUpload={handleUploadLpVideo}
                onDelete={handleDeleteLpVideo}
                theme={theme}
                t={t}
              />
            </section>

            {/* Course intro videos */}
            {sortedItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Play className="h-4 w-4 shrink-0" style={{ color: theme.actionColor }} />
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.textColor }}>
                    {t('learningPathsPage.introVideos.coursesSectionTitle')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {sortedItems.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <span
                        className="mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                        style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
                      >
                        {item.position}
                      </span>
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
              </section>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex justify-end"
            style={{ borderColor: theme.borderColor }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-5 py-2 text-sm font-bold transition"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              {t('actions.close')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
