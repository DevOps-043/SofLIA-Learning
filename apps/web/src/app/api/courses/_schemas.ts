import { z } from 'zod'

import {
  activitySubmissionRequestSchema,
  activityValidationRequestSchema,
} from '@/features/courses/types/activity-config'
import { dialogueMessageRequestSchema } from '@/features/courses/types/dialogue-runtime'

const MAX_SHORT_TEXT_LENGTH = 200
const MAX_CONTENT_LENGTH = 50_000
const MAX_ATTACHMENT_DATA_LENGTH = 100_000

const optionalShortTextSchema = z
  .string()
  .trim()
  .max(MAX_SHORT_TEXT_LENGTH)
  .optional()
  .nullable()

const contentSchema = z.string().trim().min(1).max(MAX_CONTENT_LENGTH)

const tagSchema = z.string().trim().max(80)

const attachmentDataSchema = z
  .union([
    z.record(z.string(), z.unknown()),
    z.string().max(MAX_ATTACHMENT_DATA_LENGTH),
  ])
  .optional()
  .nullable()

const attachmentFieldsSchema = {
  attachment_url: z.string().trim().max(2048).optional().nullable(),
  attachment_type: z.string().trim().max(80).optional().nullable(),
  attachment_data: attachmentDataSchema,
}

export const introVideoWatchedSchema = z.object({
  watchedCourse: z.boolean().optional(),
  watchedLp: z.boolean().optional(),
  learningPathId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
})

export type IntroVideoWatchedBody = z.infer<typeof introVideoWatchedSchema>

export const lessonFeedbackSchema = z.object({
  feedback_type: z.enum(['like', 'dislike']),
})

export type LessonFeedbackBody = z.infer<typeof lessonFeedbackSchema>

export const noteCreateSchema = z.object({
  note_title: optionalShortTextSchema,
  note_content: contentSchema,
  note_tags: z.array(tagSchema).max(20).optional(),
  source_type: z.enum(['manual', 'chat', 'import']).optional(),
})

export type NoteCreateBody = z.infer<typeof noteCreateSchema>

export const noteUpdateSchema = z.object({
  note_title: optionalShortTextSchema,
  note_content: z.string().trim().max(MAX_CONTENT_LENGTH).optional().nullable(),
  note_tags: z.array(tagSchema).max(20).optional(),
})

export type NoteUpdateBody = z.infer<typeof noteUpdateSchema>

export const questionCreateSchema = z.object({
  content: contentSchema,
  tags: z.array(tagSchema).max(20).optional().default([]),
  ...attachmentFieldsSchema,
})

export type QuestionCreateBody = z.infer<typeof questionCreateSchema>

export const questionUpdateSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH).optional(),
  tags: z.array(tagSchema).max(20).optional(),
  is_pinned: z.boolean().optional(),
  is_resolved: z.boolean().optional(),
})

export type QuestionUpdateBody = z.infer<typeof questionUpdateSchema>

const reactionTypeSchema = z.enum(['like', 'helpful', 'love', 'laugh', 'thanks'])

export const reactionToggleSchema = z.object({
  reaction_type: reactionTypeSchema,
  action: z.string().trim().max(40).optional().default('toggle'),
})

export type ReactionToggleBody = z.infer<typeof reactionToggleSchema>

export const responseCreateSchema = z.object({
  content: contentSchema,
  parent_response_id: z.string().uuid().optional().nullable(),
  ...attachmentFieldsSchema,
})

export type ResponseCreateBody = z.infer<typeof responseCreateSchema>

export const responseUpdateSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH).optional(),
  is_approved_answer: z.boolean().optional(),
})

export type ResponseUpdateBody = z.infer<typeof responseUpdateSchema>

export const courseSkillInputSchema = z.object({
  skill_id: z.string().uuid(),
  is_primary: z.boolean().optional(),
  is_required: z.boolean().optional(),
  proficiency_level: z.string().trim().min(1).max(80).optional(),
  display_order: z.number().int().min(0).max(10_000).optional(),
})

export const courseSkillsSchema = z.object({
  skills: z.array(courseSkillInputSchema).max(100),
})

export type CourseSkillsBody = z.infer<typeof courseSkillsSchema>

const quizAnswerValueSchema = z.union([z.string().max(5000), z.number()])

const quizAnswersSchema = z
  .record(z.string().min(1).max(200), quizAnswerValueSchema)
  .refine((answers) => Object.keys(answers).length <= 300, {
    message: 'MAX_QUIZ_ANSWERS_EXCEEDED',
  })

const quizQuestionSchema = z
  .object({
    correctAnswer: quizAnswerValueSchema.optional(),
    id: z.string().trim().min(1).max(200).optional(),
    options: z.array(z.string().max(2000)).max(100).optional(),
    points: z.number().finite().nonnegative().max(1000).optional(),
    question_id: z.string().trim().min(1).max(200).optional(),
    questionType: z.string().trim().max(80).optional(),
  })
  .passthrough()

const quizQuestionListSchema = z.array(quizQuestionSchema).max(300)

export const quizSubmitSchema = z
  .object({
    activityId: z.string().trim().min(1).max(120).optional().nullable(),
    answers: quizAnswersSchema,
    durationSeconds: z.number().int().nonnegative().optional().nullable(),
    materialId: z.string().trim().min(1).max(120).optional().nullable(),
    organizationId: z.string().uuid().optional().nullable(),
    quizData: z.union([
      quizQuestionListSchema,
      z.object({ questions: quizQuestionListSchema.optional() }).passthrough(),
    ]),
    totalPoints: z.number().finite().nonnegative().max(100_000).optional(),
  })
  .refine((body) => Boolean(body.materialId || body.activityId), {
    message: 'QUIZ_TARGET_REQUIRED',
    path: ['materialId'],
  })

export type QuizSubmitBody = z.infer<typeof quizSubmitSchema>

export const courseActivitySubmissionSchema = activitySubmissionRequestSchema
export type CourseActivitySubmissionBody = z.infer<
  typeof courseActivitySubmissionSchema
>

export const courseActivityValidationSchema = activityValidationRequestSchema
export type CourseActivityValidationBody = z.infer<
  typeof courseActivityValidationSchema
>

export const courseDialogueMessageSchema = dialogueMessageRequestSchema
export type CourseDialogueMessageBody = z.infer<
  typeof courseDialogueMessageSchema
>
