'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { getInitialExpandedModuleIds } from '../../services/course-detail-display.service'
import { CourseDetailService } from '../../services/course-detail.service'
import type { CourseDetailResponse } from '../../types/course-detail.types'

type UseCourseDetailDataParams = {
  language: string
  setExpandedModules: Dispatch<SetStateAction<Set<string>>>
  slug: string
}

export function useCourseDetailData({
  language,
  setExpandedModules,
  slug,
}: UseCourseDetailDataParams) {
  const [detail, setDetail] = useState<CourseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCourseDetail() {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)

        const nextDetail = await CourseDetailService.getCourseDetail(slug, language)
        setDetail(nextDetail)
        setExpandedModules(new Set(getInitialExpandedModuleIds(nextDetail.modules)))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    void loadCourseDetail()
  }, [language, setExpandedModules, slug])

  return { detail, error, loading, setDetail }
}
