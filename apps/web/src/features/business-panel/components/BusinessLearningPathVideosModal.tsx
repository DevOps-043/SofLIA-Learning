'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronRight, Film, Layers, Loader2, Play, Trash2, Upload, Video, X } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { STREAMABLE_VIDEO_ACCEPT } from '@/lib/media/video-upload-policy'
import { useHlsPlayback } from '@/lib/media/useHlsPlayback'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useBusinessLearningPathVideos } from '../hooks/useBusinessLearningPathVideos'
import type { BusinessLearningPath } from '../services/businessLearningPaths.service'
import modalStyles from './ContentModal.module.css'

interface BusinessLearningPathVideosModalProps {
  isOpen: boolean
  learningPath: BusinessLearningPath | null
  onClose: () => void
  orgSlug: string
}

interface VideoSlotProps {
  isDeleting: boolean
  isUploading: boolean
  onDelete: () => void
  onUpload: (file: File) => void
  t: ReturnType<typeof useTranslation<'business'>>['t']
  title: string
  videoUrl: string | null
}

function VideoSlot({
  isDeleting,
  isUploading,
  onDelete,
  onUpload,
  t,
  title,
  videoUrl,
}: VideoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useHlsPlayback(videoRef, videoUrl ?? '')

  return (
    <article className={modalStyles.videoSlot}>
      <header className={modalStyles.videoSlotHeader}>
        <div className={modalStyles.videoSlotTitle}>
          <Video aria-hidden="true" />
          <span>{title}</span>
        </div>
        {videoUrl && !isUploading && !isDeleting ? (
          <span className={modalStyles.videoSlotStatus}>
            <CheckCircle2 aria-hidden="true" />
            {t('learningPathsPage.introVideos.active')}
          </span>
        ) : null}
      </header>
      <div className={modalStyles.videoSlotBody}>
        {videoUrl ? (
          <>
            <video className={modalStyles.videoPreview} controls key={videoUrl} preload="metadata" ref={videoRef} src={videoUrl} />
            <div className={modalStyles.videoActions}>
              <button className={modalStyles.secondaryButton} disabled={isUploading || isDeleting} onClick={() => inputRef.current?.click()} type="button">
                {isUploading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Upload aria-hidden="true" />}
                {isUploading ? t('learningPathsPage.introVideos.uploading') : t('learningPathsPage.introVideos.upload')}
              </button>
              <button className={modalStyles.dangerButton} disabled={isUploading || isDeleting} onClick={onDelete} type="button">
                {isDeleting ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Trash2 aria-hidden="true" />}
                {isDeleting ? t('learningPathsPage.introVideos.deleting') : t('learningPathsPage.introVideos.delete')}
              </button>
            </div>
          </>
        ) : (
          <button className={modalStyles.uploadZone} disabled={isUploading} onClick={() => inputRef.current?.click()} type="button">
            {isUploading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Upload aria-hidden="true" />}
            <span>{isUploading ? t('learningPathsPage.introVideos.uploading') : t('learningPathsPage.introVideos.noVideo')}</span>
          </button>
        )}
      </div>
      <input
        accept={STREAMABLE_VIDEO_ACCEPT}
        className={modalStyles.hiddenInput}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          onUpload(file)
          event.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
    </article>
  )
}

export function BusinessLearningPathVideosModal({
  isOpen,
  learningPath,
  onClose,
  orgSlug,
}: BusinessLearningPathVideosModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const {
    clearFeedback,
    courseVideos,
    deleting,
    error,
    handleDeleteCourseVideo,
    handleDeleteLpVideo,
    handleUploadCourseVideo,
    handleUploadLpVideo,
    lpVideoUrl,
    success,
    uploading,
  } = useBusinessLearningPathVideos(orgSlug, learningPath, isOpen)

  if (!isOpen || !learningPath) return null

  const sortedItems = [...learningPath.items].sort((a, b) => a.position - b.position)
  const modalVariables = {
    '--modal-accent': theme.accentColor,
    '--modal-action': theme.actionColor,
    '--modal-on-action': theme.onActionColor,
    '--modal-card': theme.cardBg,
    '--modal-surface': theme.panelBg,
    '--modal-text': theme.textColor,
    '--modal-muted': theme.subtextColor,
    '--modal-border': theme.borderColor,
    '--modal-input': theme.inputBg,
    '--modal-divider': theme.dividerColor,
    '--modal-danger': theme.dangerColor,
  } as CSSProperties

  return (
    <AnimatePresence>
      <div className={modalStyles.overlay}>
        <motion.div animate={{ opacity: 1 }} className={modalStyles.backdrop} exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose} />
        <motion.section
          aria-labelledby="learning-path-videos-title"
          aria-modal="true"
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${modalStyles.dialog} ${modalStyles.dialogVideo}`}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={modalVariables}
        >
          <header className={modalStyles.header}>
            <div className={modalStyles.headerIcon}><Film aria-hidden="true" /></div>
            <div className={modalStyles.headerCopy}>
              <p className={modalStyles.eyebrow}>{t('learningPathsPage.introVideos.modalTitle')}</p>
              <h2 className={modalStyles.title} id="learning-path-videos-title">{learningPath.title}</h2>
              <p className={modalStyles.description}>Configura las introducciones de la ruta y de cada curso.</p>
            </div>
            <button aria-label="Cerrar videos introductorios" className={modalStyles.closeButton} onClick={onClose} type="button"><X aria-hidden="true" /></button>
          </header>

          {error || success ? (
            <div className={error ? modalStyles.errorNotice : modalStyles.notice}>
              {error ? <AlertCircle aria-hidden="true" className="mr-2 inline h-4 w-4" /> : <CheckCircle2 aria-hidden="true" className="mr-2 inline h-4 w-4" />}
              {error ?? success}
              <button aria-label="Cerrar mensaje" className={modalStyles.iconButton} onClick={clearFeedback} type="button"><X aria-hidden="true" /></button>
            </div>
          ) : null}

          <div className={modalStyles.videoBody}>
            <section className={modalStyles.videoGroup}>
              <div className={modalStyles.videoGroupHeading}>
                <p className={modalStyles.videoGroupLabel}><span><Layers aria-hidden="true" /></span>{t('learningPathsPage.introVideos.lpVideoTitle')}</p>
                <small>Presentación principal</small>
              </div>
              <VideoSlot
                isDeleting={Boolean(deleting[`lp:${learningPath.id}`])}
                isUploading={Boolean(uploading[`lp:${learningPath.id}`])}
                onDelete={() => void handleDeleteLpVideo()}
                onUpload={(file) => void handleUploadLpVideo(file)}
                t={t}
                title={learningPath.title}
                videoUrl={lpVideoUrl}
              />
            </section>
            {sortedItems.length > 0 ? (
              <section className={modalStyles.videoGroup}>
                <div className={modalStyles.videoGroupHeading}>
                  <p className={modalStyles.videoGroupLabel}><span><Play aria-hidden="true" /></span>{t('learningPathsPage.introVideos.coursesSectionTitle')}</p>
                  <small>{sortedItems.length} cursos en secuencia</small>
                </div>
                {sortedItems.map((item) => (
                  <div className={modalStyles.videoCourseItem} key={item.id}>
                    <span className={modalStyles.sequenceIndex}>{item.position}</span>
                    <VideoSlot
                      isDeleting={Boolean(deleting[`course:${item.course_id}`])}
                      isUploading={Boolean(uploading[`course:${item.course_id}`])}
                      onDelete={() => void handleDeleteCourseVideo(item.course_id)}
                      onUpload={(file) => void handleUploadCourseVideo(item.course_id, file)}
                      t={t}
                      title={item.course?.title ?? t('learningPathsPage.introVideos.unnamedCourse')}
                      videoUrl={courseVideos[item.course_id] ?? null}
                    />
                  </div>
                ))}
              </section>
            ) : null}
          </div>

          <footer className={modalStyles.footer}>
            <p className={modalStyles.footerNote}>Los videos se procesan para reproducción adaptativa y conservan el orden de la ruta.</p>
            <div className={modalStyles.footerActions}>
              <button className={modalStyles.secondaryButton} onClick={onClose} type="button">{t('learningPathsPage.introVideos.close')}</button>
              <button className={modalStyles.primaryButton} onClick={onClose} type="button">
                {t('learningPathsPage.introVideos.done')}<ChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        </motion.section>
      </div>
    </AnimatePresence>
  )
}
