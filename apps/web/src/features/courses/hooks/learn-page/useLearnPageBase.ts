'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import type { CourseLessonContext } from '../../../../core/types/lia.types'
import { useCurrentOrganizationId } from '../../../../core/stores/organizationStore'
import { useVideoPlayerOptional } from '../../../../app/courses/[slug]/learn/VideoPlayerContext'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useLiaCourse } from '../../context/LiaCourseContext'
import { useCourseTheme } from '../useCourseTheme'

export function useLearnPageBase() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { isOpen: isLiaOpen, openLia, closeLia, liaChat } = useLiaCourse()
  const { user } = useAuth()
  const organizationId = useCurrentOrganizationId()
  const colors = useCourseTheme()
  const { t, i18n, ready } = useTranslation('learn')
  const videoPlayerContext = useVideoPlayerOptional()
  const [mounted, setMounted] = useState(false)
  const selectedLang =
    i18n.language === 'en' ? 'en' : i18n.language === 'pt' ? 'pt' : 'es'

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendLiaMessage = useCallback(
    async (
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext,
      isSystemMessage = false,
    ) => {
      if (!liaChat?.sendMessage) {
        console.warn('LIA Chat no inicializado')
        return
      }

      if (!isLiaOpen) {
        openLia()
      }

      await liaChat.sendMessage(
        message,
        courseContext,
        workshopContext,
        isSystemMessage,
      )
    },
    [isLiaOpen, liaChat, openLia],
  )

  return {
    slug,
    router,
    user,
    organizationId,
    colors,
    t,
    i18n,
    ready,
    selectedLang,
    mounted,
    isLiaOpen,
    openLia,
    closeLia,
    sendLiaMessage,
    videoPlayerContext,
  }
}
