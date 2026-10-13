import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionsSection } from '../../QuestionsSection'
import { fetchCourseQuestions } from '../api'
import type { CourseQuestion } from '../types'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => { throw new Error('No realtime in this test') } }))
vi.mock('../api', () => ({ fetchCourseQuestions: vi.fn(), fetchQuestionById: vi.fn(), toggleQuestionReaction: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('../../CreateQuestionForm', () => ({ CreateQuestionForm: () => null }))
vi.mock('../../QuestionThread', () => ({ QuestionThread: () => null }))

const fetchMock = vi.mocked(fetchCourseQuestions)
function question(id: string): CourseQuestion {
  return { id, course_id: 'course', lesson_id: 'lesson', content: id, created_at: '2026-10-01', response_count: 0, reaction_count: 0 } as CourseQuestion
}
function deferred() {
  let resolve!: (items: CourseQuestion[]) => void
  const promise = new Promise<CourseQuestion[]>(done => { resolve = done })
  return { promise, resolve }
}
beforeEach(() => { vi.clearAllMocks() })
afterEach(cleanup)

describe('question search', () => {
  it('keeps the same focused search input and previous questions while searching and clearing an empty result', async () => {
    const pending = deferred()
    const cleared = deferred()
    fetchMock.mockResolvedValueOnce([question('Anterior')]).mockReturnValueOnce(pending.promise).mockReturnValueOnce(cleared.promise)
    render(<QuestionsSection lessonId="lesson" slug="course" />)
    await screen.findByText('Anterior')
    const input = screen.getByRole('searchbox')
    input.focus()
    fireEvent.change(input, { target: { value: 'missing' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(input).toHaveFocus()
    expect(screen.getByRole('searchbox')).toBe(input)
    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'questions.title' })).toBeInTheDocument()
    await act(async () => pending.resolve([]))
    await screen.findByText('Sin coincidencias')
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    expect(screen.getByRole('searchbox')).toBe(input)
    expect(input).toHaveFocus()
    await act(async () => cleared.resolve([question('Restaurada')]))
    await screen.findByText('Restaurada')
  })

  it('ignores a slower previous search and clears records when changing lessons', async () => {
    const older = deferred()
    const latest = deferred()
    const nextLesson = deferred()
    fetchMock.mockResolvedValueOnce([question('Anterior')]).mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise).mockReturnValueOnce(nextLesson.promise)
    const { rerender } = render(<QuestionsSection lessonId="lesson" slug="course" />)
    await screen.findByText('Anterior')
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'older' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'latest' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await act(async () => latest.resolve([question('Actual')]))
    await screen.findByText('Actual')
    await act(async () => older.resolve([question('Obsoleta')]))
    expect(screen.queryByText('Obsoleta')).not.toBeInTheDocument()
    rerender(<QuestionsSection lessonId="other-lesson" slug="course" />)
    expect(screen.queryByText('Actual')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBe(input)
    await act(async () => nextLesson.resolve([question('Otra lección')]))
    await screen.findByText('Otra lección')
  })
})
