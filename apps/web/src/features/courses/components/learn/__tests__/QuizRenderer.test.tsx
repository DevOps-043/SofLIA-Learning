// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QuizRenderer } from '../QuizRenderer'

vi.mock('../../../../../core/stores/organizationStore', () => ({
  useCurrentOrganizationId: () => null,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, number | string>) => {
      const labels: Record<string, string> = {
        'activities.quiz.answered': `${values?.answered}/${values?.total} respondidas`,
        'activities.quiz.bestScore': `Mejor puntaje guardado: ${values?.percentage}%`,
        'activities.quiz.correct': 'Correcto',
        'activities.quiz.correctCount': `${values?.score} de ${values?.total} correctas`,
        'activities.quiz.empty': 'Este quiz no tiene preguntas disponibles.',
        'activities.quiz.errors.process': 'Error al procesar el quiz',
        'activities.quiz.errors.save': 'Error al guardar las respuestas',
        'activities.quiz.errors.unanswered': `Por favor responde todas las preguntas (${values?.count} sin responder).`,
        'activities.quiz.goToQuestion': `Ir a la pregunta ${values?.number}`,
        'activities.quiz.incorrect': 'Incorrecto',
        'activities.quiz.instructions': `Responde ${values?.count} preguntas para completar este quiz.`,
        'activities.quiz.next': 'Siguiente',
        'activities.quiz.points': `${values?.count} puntos`,
        'activities.quiz.pointsEarned': `${values?.earned} de ${values?.total} puntos`,
        'activities.quiz.previous': 'Anterior',
        'activities.quiz.questionProgress': `Pregunta ${values?.current} / ${values?.total}`,
        'activities.quiz.requiredCorrect': `${values?.count} de ${values?.total} para aprobar`,
        'activities.quiz.requiredScore': `${values?.percentage}% | Requerido: ${values?.threshold}%`,
        'activities.quiz.resultFailed': 'No aprobado',
        'activities.quiz.resultPassed': 'Aprobado',
        'activities.quiz.retry': 'Reintentar',
        'activities.quiz.saving': 'Guardando...',
        'activities.quiz.submit': 'Enviar respuestas',
        'activities.quiz.threshold': `Umbral: ${values?.value}%`,
        'activities.quiz.title': 'Quiz',
        'activities.quizFeedback.open': 'Ver retroalimentacion',
      }

      return labels[key] ?? key
    },
  }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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
    {
      id: 'question-2',
      question: 'Que practica reduce el riesgo operativo?',
      options: ['Documentar controles', 'Omitir validaciones'],
      correctAnswer: 0,
      points: 1,
    },
  ]

  it('renders the first question with paginated progress', () => {
    render(<QuizRenderer quizData={quizData} totalPoints={2} />)

    expect(screen.getByText(/pregunta 1 \/ 2/i)).toBeInTheDocument()
    expect(screen.getByText(/risk management framework/i)).toBeInTheDocument()
    expect(screen.queryByText(/riesgo operativo/i)).not.toBeInTheDocument()
    expect(screen.getByText('0/2 respondidas')).toBeInTheDocument()
  })

  it('moves between questions with next and previous navigation', () => {
    render(<QuizRenderer quizData={quizData} totalPoints={2} />)

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/pregunta 2 \/ 2/i)).toBeInTheDocument()
    expect(screen.getByText(/riesgo operativo/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }))
    expect(screen.getByText(/pregunta 1 \/ 2/i)).toBeInTheDocument()
  })

  it('keeps submit disabled until every question is answered', () => {
    render(<QuizRenderer quizData={quizData} totalPoints={2} />)

    fireEvent.click(screen.getByRole('radio', { name: /RMF/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(
      screen.getByRole('button', { name: /enviar respuestas/i }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: /Documentar controles/i }))

    expect(
      screen.getByRole('button', { name: /enviar respuestas/i }),
    ).not.toBeDisabled()
  })

  it('submits once every question is answered and shows a passed summary', () => {
    render(<QuizRenderer quizData={quizData} totalPoints={2} />)

    fireEvent.click(screen.getByRole('radio', { name: /RMF/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Documentar controles/i }))
    fireEvent.click(screen.getByRole('button', { name: /enviar respuestas/i }))

    expect(screen.getByText(/aprobado/i)).toBeInTheDocument()
    expect(screen.getByText(/2 de 2 correctas/i)).toBeInTheDocument()
  })

  it('hydrates a previously saved failed attempt', () => {
    render(
      <QuizRenderer
        quizData={[quizData[0]]}
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

  it('hydrates a previously saved passed attempt', () => {
    render(
      <QuizRenderer
        quizData={[quizData[0]]}
        quizStatusItem={{
          completedAt: '2026-04-11T10:00:00.000Z',
          id: 'activity-1',
          isCompleted: true,
          isPassed: true,
          latestSubmission: {
            completedAt: '2026-04-11T10:00:00.000Z',
            score: 1,
            submissionId: 'submission-1',
            userAnswers: {
              'question-1': 0,
            },
          },
          percentage: 100,
          title: 'Quiz final',
          type: 'activity',
        }}
        totalPoints={1}
      />,
    )

    expect(screen.getByText(/aprobado/i)).toBeInTheDocument()
    expect(screen.getByText(/1 de 1 correctas/i)).toBeInTheDocument()
  })

  it('shows a feedback reopen button for a hydrated failed attempt', () => {
    const onRequestQuizFeedback = vi.fn()

    render(
      <QuizRenderer
        quizData={[quizData[0]]}
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

    fireEvent.click(
      screen.getByRole('button', { name: /retroaliment|feedback/i }),
    )

    expect(onRequestQuizFeedback).toHaveBeenCalledTimes(1)
  })

  it('requests read-only SofLIA feedback when the submitted quiz has errors', () => {
    const onRequestQuizFeedback = vi.fn()

    render(
      <QuizRenderer
        quizData={[quizData[0]]}
        onRequestQuizFeedback={onRequestQuizFeedback}
        totalPoints={1}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /RMA/i }))
    fireEvent.click(screen.getByRole('button', { name: /enviar respuestas/i }))

    expect(onRequestQuizFeedback).toHaveBeenCalledTimes(1)
    expect(onRequestQuizFeedback.mock.calls[0]?.[0]).toContain(
      'Risk Management Framework',
    )
  })

  it('does not mark the correct option when a user submits a wrong answer', () => {
    render(<QuizRenderer quizData={[quizData[0]]} totalPoints={1} />)

    fireEvent.click(screen.getByRole('radio', { name: /RMA/i }))
    fireEvent.click(screen.getByRole('button', { name: /enviar respuestas/i }))

    expect(screen.getByLabelText(/incorrecto/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^correcto$/i)).not.toBeInTheDocument()
  })

  it('runs the mobile Kahoot mode workflow and counts timer correctly', async () => {
    const originalWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    window.dispatchEvent(new Event('resize'))

    vi.useFakeTimers()

    render(<QuizRenderer quizData={quizData} totalPoints={2} />)

    expect(screen.getByText(/Cuestionario Listo/i)).toBeInTheDocument()
    const startButton = screen.getByRole('button', { name: /Comenzar Cuestionario/i })
    expect(startButton).toBeInTheDocument()

    fireEvent.click(startButton)

    expect(screen.getByText(/Prepárate/i)).toBeInTheDocument()
    
    await vi.advanceTimersByTimeAsync(1000) // to 2
    await vi.advanceTimersByTimeAsync(1000) // to 1
    await vi.advanceTimersByTimeAsync(1000) // to 0
    await vi.advanceTimersByTimeAsync(800)  // finish countdown

    expect(screen.queryByText(/Prepárate/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Que sigla corresponde a Risk Management Framework/i)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5000)
    expect(screen.getByText('00:05')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /RMF/i }))

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }))
    expect(screen.getByText(/Que practica reduce el riesgo operativo/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /Documentar controles/i }))

    fireEvent.click(screen.getByRole('button', { name: /Enviar respuestas/i }))

    expect(screen.getByText(/Aprobado/i)).toBeInTheDocument()

    vi.useRealTimers()
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalWidth })
  })
})
