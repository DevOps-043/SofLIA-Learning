import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CourseLearnPageShell } from '../CourseLearnPageShell'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'diana' }, loading: false }) }))
vi.mock('@/features/courses/hooks/useCourseAccess', () => ({ useCourseAccess: () => ({ hasAccess: null, isLoading: true, error: null }) }))
vi.mock('../course-learn-shell/useLegacyProgressResolution', () => ({ useLegacyProgressResolution: () => ({}) }))
vi.mock('../course-learn-shell/useCourseLearnShellState', () => ({ useCourseLearnShellState: () => ({}) }))
vi.mock('../course-learn-shell/CourseLearnLoadingState', () => ({ CourseLearnLoadingState: () => <div>Esperando organización</div> }))
vi.mock('../course-learn-shell/CourseLearnWorkspace', () => ({ CourseLearnWorkspace: () => <div>Curso anterior</div> }))

it('waits for the route organization instead of rendering content left over from another org', () => {
  render(<CourseLearnPageShell logic={{
    slug: 'Challenger-sale', orgSlug: 'pulsehub', organizationId: null,
    ready: true, loading: false, course: { id: 'previous-course' },
  } as never} />)
  expect(screen.getByText('Esperando organización')).toBeInTheDocument()
  expect(screen.queryByText('Curso anterior')).not.toBeInTheDocument()
})
