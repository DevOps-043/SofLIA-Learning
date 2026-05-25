import { describe, expect, it } from 'vitest'

import {
  completeActivitySchema,
  endConversationSchema,
  liaChatSchema,
  onboardingChatSchema,
  personalizationUpdateSchema,
  startActivitySchema,
} from '../_schemas'

describe('lia api schemas', () => {
  it('accepts a valid SofLIA chat payload with permissive context', () => {
    const result = liaChatSchema.safeParse({
      conversationId: 'conversation-123',
      messages: [{ role: 'user', content: 'Ayudame con esta leccion' }],
      context: {
        userId: 'user-123',
        currentPage: '/courses/ia-basica/learn',
        currentLessonContext: {
          courseSlug: 'ia-basica',
          lessonTitle: 'Introduccion',
        },
        customClientField: { source: 'course-panel' },
      },
      stream: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects oversized chat message content', () => {
    const result = liaChatSchema.safeParse({
      messages: [{ role: 'user', content: 'a'.repeat(50_001) }],
    })

    expect(result.success).toBe(false)
  })

  it('keeps defaults for activity and conversation lifecycle payloads', () => {
    const startResult = startActivitySchema.safeParse({
      activityType: 'reflection',
    })
    const endResult = endConversationSchema.safeParse({
      conversationId: 'conversation-123',
    })

    expect(startResult.success && startResult.data.totalSteps).toBe(1)
    expect(endResult.success && endResult.data.completed).toBe(true)
  })

  it('accepts complete activity updates without generated output', () => {
    const result = completeActivitySchema.safeParse({
      completionId: 'completion-123',
      timeSpentSeconds: 120,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid onboarding chat context', () => {
    const result = onboardingChatSchema.safeParse({
      question: 'Que puedo hacer aqui?',
      context: {
        isOnboarding: true,
        currentStep: 1,
        totalSteps: 0,
        conversationHistory: [],
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects personalization text beyond service limits', () => {
    const result = personalizationUpdateSchema.safeParse({
      custom_instructions: 'a'.repeat(2_001),
    })

    expect(result.success).toBe(false)
  })
})
