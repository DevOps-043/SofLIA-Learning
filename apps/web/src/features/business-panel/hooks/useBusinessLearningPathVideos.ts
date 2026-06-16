'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createClient } from '@/lib/supabase/client'
import {
  INTRO_VIDEO_MAX_SIZE_BYTES,
  isStreamableVideoMimeType,
} from '@/lib/media/video-upload-policy'
import type { BusinessLearningPath } from '../services/businessLearningPaths.service'

const INTRO_VIDEOS_BUCKET = 'intro-videos'

const MAX_VIDEO_SIZE_BYTES = INTRO_VIDEO_MAX_SIZE_BYTES

interface UploadVideoDirectMessages {
  fileTooLarge: string
  invalidType: string
  uploadFailed: string
}

interface SignedUploadUrlResponse {
  success: boolean
  signedUrl?: string
  token?: string
  path?: string
  publicUrl?: string
  error?: string
}

/**
 * Sube el video con una signed upload URL: el archivo va DIRECTO del browser al
 * bucket de Supabase, sin atravesar la función serverless.
 *
 * Por qué NO se usa el proxy `/api/upload`: en Netlify las funciones tienen un
 * límite de payload (~6 MB) y un timeout corto, así que reenviar un video de
 * hasta 500 MB por ahí siempre termina en 504 (y el cliente recibía HTML en vez
 * de JSON -> "Unexpected token '<'"). La función solo emite metadatos y firma la
 * URL; el archivo nunca pasa por ella.
 */
async function uploadVideoDirect(
  file: File,
  orgSlug: string,
  folder: string,
  messages: UploadVideoDirectMessages,
): Promise<string> {
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(messages.fileTooLarge)
  }
  if (!isStreamableVideoMimeType(file.type)) {
    throw new Error(messages.invalidType)
  }

  // 1) Pedir la signed upload URL (solo metadatos viajan a la función).
  const urlResponse = await fetch(
    `/api/${orgSlug}/business/intro-videos/upload-url`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        folder,
      }),
    },
  )

  // `catch(() => null)`: si el proxy devolviera HTML (timeout/error de
  // plataforma), no reventamos con "Unexpected token '<'"; damos un mensaje útil.
  const urlData = (await urlResponse.json().catch(() => null)) as SignedUploadUrlResponse | null

  if (!urlResponse.ok || !urlData?.success || !urlData.token || !urlData.path || !urlData.publicUrl) {
    throw new Error(urlData?.error ?? messages.uploadFailed)
  }

  // 2) Subir el archivo DIRECTO a Supabase Storage con el token firmado.
  const supabase = createClient()
  const { error: uploadError } = await supabase.storage
    .from(INTRO_VIDEOS_BUCKET)
    .uploadToSignedUrl(urlData.path, urlData.token, file, { contentType: file.type })

  if (uploadError) {
    throw new Error(uploadError.message || messages.uploadFailed)
  }

  return urlData.publicUrl
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

  const getUploadMessages = useCallback((): UploadVideoDirectMessages => ({
    fileTooLarge: t('learningPathsPage.introVideos.errorFileTooLarge'),
    invalidType: t('learningPathsPage.introVideos.errorInvalidFileType'),
    uploadFailed: t('learningPathsPage.introVideos.errorUpload'),
  }), [t])

  const handleUploadLpVideo = useCallback(
    async (file: File) => {
      if (!learningPath) return
      const key = `lp:${learningPath.id}`
      setUploading(key, true)
      setState((prev) => ({ ...prev, error: null, success: null }))
      try {
        const publicUrl = await uploadVideoDirect(file, orgSlug, 'lp', getUploadMessages())

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
    [getUploadMessages, learningPath, orgSlug, setUploading, t],
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
        const publicUrl = await uploadVideoDirect(file, orgSlug, 'courses', getUploadMessages())

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
    [getUploadMessages, orgSlug, setUploading, t],
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
