import type { CourseLessonContext } from '../../../../core/types/lia.types'
import { z } from 'zod'
import type { PageContext } from '../system-prompt.service'
import { MAX_MESSAGE_LENGTH } from './request-normalization.constants'

const conversationHistoryEntrySchema = z.object({
  role: z.string().trim().min(1),
  content: z.string(),
})

const requestUserInfoSchema = z.object({
  display_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  type_rol: z.string().optional(),
  job_title: z.string().optional(),
  job_description: z.string().optional(),
})

export const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  context: z.string().trim().min(1).optional(),
  conversationHistory: z.array(conversationHistoryEntrySchema).optional(),
  userName: z.string().optional(),
  userInfo: requestUserInfoSchema.optional(),
  courseContext: z
    .unknown()
    .optional()
    .transform((value) => value as CourseLessonContext | undefined),
  workshopContext: z
    .unknown()
    .optional()
    .transform((value) => value as CourseLessonContext | undefined),
  pageContext: z
    .unknown()
    .optional()
    .transform((value) => value as PageContext | undefined),
  isSystemMessage: z.boolean().optional(),
  conversationId: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).optional(),
  isPromptMode: z.boolean().optional(),
})
