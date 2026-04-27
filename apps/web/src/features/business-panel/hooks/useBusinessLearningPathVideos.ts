'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BusinessLearningPath } from '../services/businessLearningPaths.service'

async function uploadVideoFile(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'intro-videos')
  formData.append('folder', folder)

  const response = await fetch('/api/upload', { method: 'POST', body: formData })
  const result = await response.json()
  if (!result.success || !result.url) throw new Error('Error al subir el video')
  return result.url as string
}

export interface LpVideoState {
  lpVideoUrl: string | null
  courseVideos: Record<string, string | null>
  uploading: Record<string, boolean>
  deleting: Record<string, boolean>
  error: string | null
  success: string | null
}

export function useBusinessLearningPathVideos(
  orgSlug: string,
  learningPath: BusinessLearningPath | null,
  isOpen: boolean,
) {
  const { t } = useTranslation('business')
  const [state, setState] = useState<LpVideoState>({
    lpVideoUrl: null,
    courseVideos: {},
    uploading: {},
    deleting: {},
    error: null,
    success: null,
  })
  const fetchedRef = useRef(false)

  // Cargar URLs existentes cuando el modal se abre
  useEffect(() => {
    if (!isOpen || !learningPath || !orgSlug) return
    fetchedRef.current = false
    void fetchExistingVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, learningPath?.id, orgSlug])

  const fetchExistingVideos = useCallback(async () => {
    if (!learningPath || fetchedRef.current) return
    fetchedRef.current = true

    try {
      const lpFetch = fetch(
        `/api/${orgSlug}/business/intro-videos/learning-path/${learningPath.id}`,
        { credentials: 'include' },
      )

      const courseFetches = learningPath.items.map((item) =>
        fetch(
          `/api/${orgSlug}/business/intro-videos/course/${item.course_id}`,
          { credentials: 'include' },
        ).then((r) => r.json() as Promise<{ success: boolean; introVideoUrl: string | null }>).then((data) => ({
          courseId: item.course_id,
          url: data.success ? data.introVideoUrl : null,
        })),
      )

      const [lpResponse, ...courseResults] = await Promise.all([lpFetch, ...courseFetches])
      const lpData = (await lpResponse.json()) as { success: boolean; introVideoUrl: string | null }

      const courseVideos: Record<string, string | null> = {}
      for (const result of courseResults) {
        courseVideos[result.courseId] = result.url
      }

      setState((prev) => ({
        ...prev,
        lpVideoUrl: lpData.success ? lpData.introVideoUrl : null,
        courseVideos,
        error: null,
      }))
    } catch {
      setState((prev) => ({ ...prev, error: t('learningPathsPage.introVideos.errorLoad') }))
    }
  }, [learningPath, orgSlug, t])

  const setKey = useCallback((key: string, value: Partial<LpVideoState>) => {
    setState((prev) => ({ ...prev, ...value }))
  }, [])

  const setUploading = useCallback((key: string, val: boolean) => {
    setState((prev) => ({ ...prev, uploading: { ...prev.uploading, [key]: val } }))
  }, [])

  const setDeleting = useCallback((key: string, val: boolean) => {
    setState((prev) => ({ ...prev, deleting: { ...prev.deleting, [key]: val } }))
  }, [])

  const clearFeedback = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, success: null }))
  }, [])

  const handleUploadLpVideo = useCallback(
    async (file: File) => {
      if (!learningPath) return
      const key = `lp:${learningPath.id}`
      setUploading(key, true)
      setState((prev) => ({ ...prev, error: null, success: null }))
      try {
        const url = await uploadVideoFile(file, `org/${orgSlug}/lp`)
        await fetch(`/api/${orgSlug}/business/intro-videos/learning-path/${learningPath.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url }),
        })
        setState((prev) => ({
          ...prev,
          lpVideoUrl: url,
          success: t('learningPathsPage.introVideos.uploadSuccess'),
        }))
      } catch {
        setState((prev) => ({ ...prev, error: t('learningPathsPage.introVideos.errorUpload') }))
      } finally {
        setUploading(key, false)
      }
    },
    [learningPath, orgSlug, setUploading, t],
  )

  const handleDeleteLpVideo = useCallback(async () => {
    if (!learningPath) return
    const key = `lp:${learningPath.id}`
    setDeleting(key, true)
    setState((prev) => ({ ...prev, error: null, success: null }))
    try {
      await fetch(`/api/${orgSlug}/business/intro-videos/learning-path/${learningPath.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setState((prev) => ({
        ...prev,
        lpVideoUrl: null,
        success: t('learningPathsPage.introVideos.deleteSuccess'),
      }))
    } catch {
      setState((prev) => ({ ...prev, error: t('learningPathsPage.introVideos.errorDelete') }))
    } finally {
      setDeleting(key, false)
    }
  }, [learningPath, orgSlug, setDeleting, t])

  const handleUploadCourseVideo = useCallback(
    async (courseId: string, file: File) => {
      const key = `course:${courseId}`
      setUploading(key, true)
      setState((prev) => ({ ...prev, error: null, success: null }))
      try {
        const url = await uploadVideoFile(file, `org/${orgSlug}/courses`)
        await fetch(`/api/${orgSlug}/business/intro-videos/course/${courseId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url }),
        })
        setState((prev) => ({
          ...prev,
          courseVideos: { ...prev.courseVideos, [courseId]: url },
          success: t('learningPathsPage.introVideos.uploadSuccess'),
        }))
      } catch {
        setState((prev) => ({ ...prev, error: t('learningPathsPage.introVideos.errorUpload') }))
      } finally {
        setUploading(key, false)
      }
    },
    [orgSlug, setUploading, t],
  )

  const handleDeleteCourseVideo = useCallback(
    async (courseId: string) => {
      const key = `course:${courseId}`
      setDeleting(key, true)
      setState((prev) => ({ ...prev, error: null, success: null }))
      try {
        await fetch(`/api/${orgSlug}/business/intro-videos/course/${courseId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        setState((prev) => ({
          ...prev,
          courseVideos: { ...prev.courseVideos, [courseId]: null },
          success: t('learningPathsPage.introVideos.deleteSuccess'),
        }))
      } catch {
        setState((prev) => ({ ...prev, error: t('learningPathsPage.introVideos.errorDelete') }))
      } finally {
        setDeleting(key, false)
      }
    },
    [orgSlug, setDeleting, t],
  )

  return {
    ...state,
    handleUploadLpVideo,
    handleDeleteLpVideo,
    handleUploadCourseVideo,
    handleDeleteCourseVideo,
    clearFeedback,
  }
}
