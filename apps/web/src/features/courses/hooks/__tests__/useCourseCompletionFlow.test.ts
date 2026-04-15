// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCourseCompletionFlow } from '../useCourseCompletionFlow'
import { CourseCertificateService } from '../../services/course-certificate.service'
import { CourseRatingService } from '../../services/course-rating.service'

vi.mock('../../services/course-certificate.service', () => ({
  CourseCertificateService: {
    generateCertificate: vi.fn(),
    getCertificateRoute: vi.fn((certificateId?: string | null) =>
      certificateId ? `/certificates/${certificateId}` : '/certificates',
    ),
  },
}))

vi.mock('../../services/course-rating.service', () => ({
  CourseRatingService: {
    checkUserRating: vi.fn(),
    submitRating: vi.fn(),
  },
}))

describe('useCourseCompletionFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens rating modal when user has not rated course yet', async () => {
    vi.mocked(CourseRatingService.checkUserRating).mockResolvedValue({
      success: true,
      hasRating: false,
      rating: null,
    })

    const onCertificateReady = vi.fn()

    const { result } = renderHook(() =>
      useCourseCompletionFlow({
        courseId: 'course-1',
        courseSlug: 'course-slug',
        onCertificateReady,
      }),
    )

    act(() => {
      result.current.openCourseCompletedModal()
    })

    await act(async () => {
      await result.current.handleCourseCompletedClose()
    })

    expect(CourseRatingService.checkUserRating).toHaveBeenCalledWith(
      'course-slug',
    )
    expect(result.current.isCourseCompletedModalOpen).toBe(false)
    expect(result.current.isRatingModalOpen).toBe(true)
    expect(onCertificateReady).not.toHaveBeenCalled()
  })

  it('generates certificate immediately when user already rated', async () => {
    vi.mocked(CourseRatingService.checkUserRating).mockResolvedValue({
      success: true,
      hasRating: true,
      rating: {
        review_id: 'review-1',
        rating: 5,
        review_content: 'Excelente',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    vi.mocked(CourseCertificateService.generateCertificate).mockResolvedValue({
      success: true,
      message: 'ok',
      certificate_id: 'cert-1',
      certificate_url: 'https://example.com/cert-1.pdf',
    })

    const onCertificateReady = vi.fn()

    const { result } = renderHook(() =>
      useCourseCompletionFlow({
        courseId: 'course-1',
        courseSlug: 'course-slug',
        onCertificateReady,
      }),
    )

    await act(async () => {
      await result.current.handleCourseCompletedClose()
    })

    expect(CourseCertificateService.generateCertificate).toHaveBeenCalledWith(
      'course-1',
    )
    expect(onCertificateReady).toHaveBeenCalledWith('/certificates/cert-1')
    expect(result.current.hasUserRated).toBe(true)
  })

  it('does not reopen the rating modal when certificate generation fails after existing rating', async () => {
    vi.mocked(CourseRatingService.checkUserRating).mockResolvedValue({
      success: true,
      hasRating: true,
      rating: {
        review_id: 'review-1',
        rating: 5,
        review_content: 'Excelente',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    vi.mocked(CourseCertificateService.generateCertificate).mockRejectedValue(
      new Error('No se pudo generar el certificado'),
    )

    const onCertificateReady = vi.fn()

    const { result } = renderHook(() =>
      useCourseCompletionFlow({
        courseId: 'course-1',
        courseSlug: 'course-slug',
        onCertificateReady,
      }),
    )

    await act(async () => {
      await result.current.handleCourseCompletedClose()
    })

    expect(result.current.hasUserRated).toBe(true)
    expect(result.current.isRatingModalOpen).toBe(false)
    expect(onCertificateReady).not.toHaveBeenCalled()
  })

  it('submits rating before generating certificate', async () => {
    vi.mocked(CourseRatingService.submitRating).mockResolvedValue({
      success: true,
      message: 'ok',
      rating: {
        review_id: 'review-1',
        rating: 4,
        review_content: 'Muy bien',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    vi.mocked(CourseCertificateService.generateCertificate).mockResolvedValue({
      success: true,
      message: 'ok',
      certificate_id: 'cert-2',
      certificate_url: 'https://example.com/cert-2.pdf',
    })

    const onCertificateReady = vi.fn()

    const { result } = renderHook(() =>
      useCourseCompletionFlow({
        courseId: 'course-1',
        courseSlug: 'course-slug',
        onCertificateReady,
      }),
    )

    await act(async () => {
      await result.current.handleRatingSubmit({
        rating: 4,
        reviewTitle: 'Gran curso',
        reviewContent: 'Muy bien',
      })
    })

    expect(CourseRatingService.submitRating).toHaveBeenCalledWith(
      'course-slug',
      {
        rating: 4,
        reviewTitle: 'Gran curso',
        reviewContent: 'Muy bien',
      },
    )
    expect(CourseCertificateService.generateCertificate).toHaveBeenCalledWith(
      'course-1',
    )
    expect(onCertificateReady).toHaveBeenCalledWith('/certificates/cert-2')
  })
})
