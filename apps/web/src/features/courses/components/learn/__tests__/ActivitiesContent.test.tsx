// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
  useActivitiesData: () => ({
    activities: [
      {
        activity_id: 'activity-1',
        activity_title: 'Actividad final',
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
  }),
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
