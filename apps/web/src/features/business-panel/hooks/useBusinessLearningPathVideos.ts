'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BusinessLearningPath } from '../services/businessLearningPaths.service'

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm'] as const
type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number]

/**
 * Upload de video usando el endpoint /api/upload existente (service role, sin
 * límites de CORS). Para archivos grandes en producción se usaría un signed URL
 * directo, pero en la arquitectura actual el proxy server-side es suficiente y
 * más confiable al evitar los problemas de CORS/timeout con signed URLs.
 */
async function uploadVideoDirect(
  file: File,
  orgSlug: string,
  folder: string,
): Promise<string> {
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`El archivo excede el límite de 100 MB`)
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMime)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'intro-videos')
  formData.append('folder', `org/${orgSlug}/${folder}`)

  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const uploadData = await uploadResponse.json() as { success: boolean; url?: string; error?: string }

  if (!uploadData.success || !uploadData.url) {
    throw new Error(uploadData.error ?? 'Error al subir el video')
  }

  return uploadData.url
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
        )
          .then((r) => r.json() as Promise<{ success: boolean; introVideoUrl: string | null }>)
          .then((data) => ({ courseId: item.course_id, url: data.success ? data.introVideoUrl : null })),
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
        const publicUrl = await uploadVideoDirect(file, orgSlug, 'lp')

        const saveRes = await fetch(
          `/api/${orgSlug}/business/intro-videos/learning-path/${learningPath.id}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: publicUrl }),
          },
        )
        const saveData = await saveRes.json() as { success: boolean; error?: string }
        if (!saveData.success) throw new Error(saveData.error ?? 'Error al guardar')

        setState((prev) => ({
          ...prev,
          lpVideoUrl: publicUrl,
          success: t('learningPathsPage.introVideos.uploadSuccess'),
        }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('learningPathsPage.introVideos.errorUpload')
        setState((prev) => ({ ...prev, error: msg }))
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
        const publicUrl = await uploadVideoDirect(file, orgSlug, 'courses')

        const saveRes = await fetch(
          `/api/${orgSlug}/business/intro-videos/course/${courseId}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: publicUrl }),
          },
        )
        const saveData = await saveRes.json() as { success: boolean; error?: string }
        if (!saveData.success) throw new Error(saveData.error ?? 'Error al guardar')

        setState((prev) => ({
          ...prev,
          courseVideos: { ...prev.courseVideos, [courseId]: publicUrl },
          success: t('learningPathsPage.introVideos.uploadSuccess'),
        }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('learningPathsPage.introVideos.errorUpload')
        setState((prev) => ({ ...prev, error: msg }))
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
