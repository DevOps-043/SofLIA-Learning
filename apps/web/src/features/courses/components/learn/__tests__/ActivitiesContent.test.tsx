// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'

import { ActivitiesContent } from '../ActivitiesContent'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../../context/LiaCourseContext', () => ({
  useLiaCourse: () => ({
    setActivity: vi.fn(),
    openLia: vi.fn(),
    isOpen: false,
    liaChat: null,
    isLiaChatLoading: false,
    courseContext: null,
    isInteractionBlocked: false,
    closeLia: vi.fn(),
  }),
}))

vi.mock('../quiz-feedback', () => ({
  QuizFeedbackInline: () => null,
  QuizFeedbackPanel: () => null,
  useQuizFeedback: () => ({
    close: vi.fn(),
    content: null,
    error: null,
    isLoading: false,
    isOpen: false,
    requestFeedback: vi.fn(),
  }),
}))

vi.mock('../activities/useActivitiesData', () => ({
  useActivitiesData: ({ lessonId }: { lessonId: string }) => {
    const [initialLessonId] = useState(lessonId)
    return ({
    activities: [
      {
        activity_id: 'activity-1',
        activity_title: `Actividad ${initialLessonId}`,
        activity_type: 'reflection',
        is_required: true,
      },
    ],
    collapsedActivities: new Set<string>(),
    collapsedMaterials: new Set<string>(),
    feedbackLoading: false,
    handleLessonFeedback: vi.fn(),
    lessonFeedback: null,
    loading: false,
    materials: [],
    quizStatus: null,
    refreshLessonContent: vi.fn(),
    toggleActivityCollapse: vi.fn(),
    toggleMaterialCollapse: vi.fn(),
    })
  },
}))

vi.mock('../activities/ActivityCard', () => ({
  ActivityCard: ({ activity }: { activity: { activity_title: string } }) => (
    <div>{activity.activity_title}</div>
  ),
}))

vi.mock('../activities/MaterialCard', () => ({
  MaterialCard: () => <div>Material</div>,
}))

afterEach(() => {
  cleanup()
})

describe('ActivitiesContent', () => {
  it('resets lesson-specific child state when navigating between lessons', () => {
    const props = { selectedLang: 'es' as const, slug: 'course-slug', lesson: { lesson_id: 'first', lesson_title: 'First' } }
    const { rerender } = render(<ActivitiesContent {...props} />)
    expect(screen.getByText('Actividad first')).toBeTruthy()
    rerender(<ActivitiesContent {...props} lesson={{ lesson_id: 'second', lesson_title: 'Second' }} />)
    expect(screen.queryByText('Actividad first')).toBeNull()
    expect(screen.getByText('Actividad second')).toBeTruthy()
  })

  it('renders final course button on last lesson activities', () => {
    const onCompleteCourse = vi.fn()

    render(
      <ActivitiesContent
        hasNextLesson={false}
        lesson={{
          lesson_id: 'lesson-1',
          lesson_title: 'Ultima leccion',
        }}
        onCompleteCourse={onCompleteCourse}
        selectedLang="es"
        slug="course-slug"
      />,
    )

    const button = screen.getByRole('button', { name: /navigation.finishCourse/i })
    fireEvent.click(button)

    expect(button).toBeTruthy()
    expect(onCompleteCourse).toHaveBeenCalledTimes(1)
  })
})
