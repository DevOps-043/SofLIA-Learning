import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CoursePreviewTab } from '../CoursePreviewTab'

vi.mock('../CourseManagementContext', () => ({
  useCourseManagementContext: () => ({
    state: {
      previewLoading: false,
      workshopPreview: {
        title: 'AI Productivity Workshop',
        description: 'Learn practical AI workflows for daily work.',
        category: 'ia',
        level: 'beginner',
        duration_total_minutes: 45,
        price: 0,
        thumbnail_url: '',
        slug: 'ai-productivity-workshop',
        instructor_id: 'instructor-1',
        instructor_name: 'Ada Lovelace',
      },
    },
  }),
}))

vi.mock('../../../../../lib/utils/motion', () => ({
  useMotionSafe: () => ({ disableHeavy: true }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CoursePreviewTab', () => {
  it('renders a workshop preview without runtime icon reference errors', () => {
    render(<CoursePreviewTab />)

    expect(screen.getByRole('heading', { name: 'AI Productivity Workshop' })).toBeTruthy()
    expect(screen.getAllByText('Learn practical AI workflows for daily work.')).toHaveLength(2)
    expect(screen.getByText('45 min')).toBeTruthy()
  })
})
