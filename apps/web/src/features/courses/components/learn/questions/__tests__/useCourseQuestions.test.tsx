// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '../../../../../../lib/supabase/client';
import { fetchCourseQuestions, fetchQuestionById, toggleQuestionReaction } from '../api';
import { useCourseQuestions } from '../useCourseQuestions';

vi.mock('../../../../../../lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('../api', () => ({
  fetchCourseQuestions: vi.fn(),
  fetchQuestionById: vi.fn(),
  toggleQuestionReaction: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedFetchCourseQuestions = vi.mocked(fetchCourseQuestions);

describe('useCourseQuestions realtime subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchCourseQuestions.mockResolvedValue([
      {
        id: 'question-1',
        course_id: 'course-1',
        lesson_id: 'lesson-1',
        content: 'Pregunta',
        created_at: '2026-01-01T00:00:00.000Z',
        response_count: 0,
        reaction_count: 0,
      } as any,
    ]);
    vi.mocked(fetchQuestionById).mockResolvedValue(null);
    vi.mocked(toggleQuestionReaction).mockResolvedValue({
      new_count: 0,
      user_reaction: null,
    } as any);
  });

  it('subscribes only to current lesson questions, not global response or reaction tables', async () => {
    const channelNames: string[] = [];
    const removeChannel = vi.fn();

    mockedCreateClient.mockReturnValue({
      channel: vi.fn((name: string) => {
        channelNames.push(name);
        const channel = {
          on: vi.fn(() => channel),
          subscribe: vi.fn(() => channel),
        };

        return channel;
      }),
      removeChannel,
    } as any);

    const { result, unmount } = renderHook(() =>
      useCourseQuestions({ lessonId: 'lesson-1', slug: 'curso-demo' })
    );

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(1);
    });

    await waitFor(() => {
      expect(channelNames).toContain('course-questions-lesson-1');
    });

    expect(mockedFetchCourseQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ lessonId: 'lesson-1', slug: 'curso-demo' }),
    );
    expect(channelNames).not.toContain('course-responses-lesson-1');
    expect(channelNames).not.toContain('course-reactions-lesson-1');

    unmount();

    expect(removeChannel).toHaveBeenCalledTimes(1);
  });
});
