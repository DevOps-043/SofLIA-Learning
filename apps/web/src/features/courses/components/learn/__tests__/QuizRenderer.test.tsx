// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QuizRenderer } from '../QuizRenderer'

vi.mock('../../../../../core/stores/organizationStore', () => ({
  useCurrentOrganizationId: () => null,
}))

afterEach(() => {
  cleanup()
})

describe('QuizRenderer', () => {
  const quizData = [
    {
      id: 'question-1',
      question: 'Que sigla corresponde a Risk Management Framework?',
      options: ['RMF', 'RMA'],
      correctAnswer: 0,
      points: 1,
    },
  ]

  it('hydrates a previously saved failed attempt', () => {
    render(
      <QuizRenderer
        quizData={quizData}
        quizStatusItem={{
          completedAt: '2026-04-11T10:00:00.000Z',
          id: 'activity-1',
          isCompleted: true,
          isPassed: false,
          latestSubmission: {
            completedAt: '2026-04-11T10:00:00.000Z',
            score: 0,
            submissionId: 'submission-1',
            userAnswers: {
              'question-1': 1,
            },
          },
          percentage: 0,
          title: 'Quiz final',
          type: 'activity',
        }}
        totalPoints={1}
      />,
    )

    expect(screen.queryByText(/enviar respuestas/i)).not.toBeInTheDocument()
    expect(screen.getByText(/no aprobado/i)).toBeInTheDocument()
    expect(screen.getByText(/0 de 1 correctas/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('shows a feedback reopen button for a hydrated failed attempt', () => {
    const onRequestQuizFeedback = vi.fn()

    render(
      <QuizRenderer
        quizData={quizData}
        onRequestQuizFeedback={onRequestQuizFeedback}
        quizStatusItem={{
          completedAt: '2026-04-11T10:00:00.000Z',
          id: 'activity-1',
          isCompleted: true,
          isPassed: false,
          latestSubmission: {
            completedAt: '2026-04-11T10:00:00.000Z',
            score: 0,
            submissionId: 'submission-1',
            userAnswers: {
              'question-1': 1,
            },
          },
          percentage: 0,
          title: 'Quiz final',
          type: 'activity',
        }}
        totalPoints={1}
      />,
    )

    const feedbackButtons = screen.getAllByRole('button', {
      name: /retroaliment|feedback/i,
    })
    fireEvent.click(feedbackButtons[0])

    expect(onRequestQuizFeedback).toHaveBeenCalledTimes(1)
  })

  it('requests read-only SofLIA feedback when the submitted quiz has errors', () => {
    const onRequestQuizFeedback = vi.fn()

    render(
      <QuizRenderer
        quizData={quizData}
        onRequestQuizFeedback={onRequestQuizFeedback}
        totalPoints={1}
      />,
    )

    fireEvent.click(screen.getAllByLabelText(/RMA/i)[0])
    fireEvent.click(screen.getByRole('button', { name: /enviar respuestas/i }))

    expect(onRequestQuizFeedback).toHaveBeenCalledTimes(1)
    expect(onRequestQuizFeedback.mock.calls[0]?.[0]).toContain(
      'Risk Management Framework',
    )
  })
})
