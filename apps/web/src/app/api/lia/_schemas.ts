import { z } from 'zod';

import { lessonSuggestionsRequestSchema } from './lesson-suggestions/lesson-suggestions.types';

const LIA_CONTENT_MAX_LENGTH = 50_000;
const LIA_SHORT_TEXT_MAX_LENGTH = 500;
const LIA_ID_MAX_LENGTH = 120;

const looseIdSchema = z.string().min(1).max(LIA_ID_MAX_LENGTH);
// El cliente de SofLIA en cursos arma `context` con valores de perfil/organizacion
// que pueden llegar como `null` (usuario sin puesto, organizationId sin resolver,
// columnas nullable de BD). Aceptamos `null` en el borde y lo colapsamos a
// `undefined` para que el tipo de salida siga siendo `string | undefined` y los
// consumidores aguas abajo (resolveActiveOrganizationContext, etc.) no cambien.
const nullToUndefined = <T>(value: T | null | undefined): T | undefined =>
  value ?? undefined;
const optionalIdSchema = looseIdSchema.nullish().transform(nullToUndefined);
const optionalTextSchema = (maxLength = LIA_SHORT_TEXT_MAX_LENGTH) =>
  z.string().max(maxLength).nullish().transform(nullToUndefined);

const liaImageAttachmentSchema = z
  .object({
    kind: z.literal('image'),
    fileName: z.string().min(1).max(300),
    mimeType: z.string().min(1).max(100),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
    dataUrl: z.string().min(1).max(1_000_000),
    width: z.number().int().min(1).max(20_000).optional().nullable(),
    height: z.number().int().min(1).max(20_000).optional().nullable(),
  })
  .passthrough();

const currentLessonContextSchema = z
  .object({
    contextType: z.enum(['course', 'workshop']).optional(),
    courseId: optionalTextSchema(),
    courseSlug: optionalTextSchema(200),
    courseTitle: optionalTextSchema(300),
    courseDescription: optionalTextSchema(4_000),
    userRole: optionalTextSchema(200),
    moduleId: optionalTextSchema(),
    moduleTitle: optionalTextSchema(300),
    lessonId: optionalTextSchema(),
    lessonTitle: optionalTextSchema(300),
    transcript: z.string().max(LIA_CONTENT_MAX_LENGTH).optional().nullable(),
    summary: z.string().max(10_000).optional().nullable(),
    description: z.string().max(10_000).optional().nullable(),
    durationSeconds: z.number().min(0).max(1_000_000).optional(),
    totalDurationMinutes: z.number().min(0).max(100_000).optional(),
    currentPage: optionalTextSchema(2_000),
    currentTab: optionalTextSchema(120),
    learningProgress: z
      .object({
        currentLessonNumber: z.number().int().min(0).max(10_000),
        totalLessons: z.number().int().min(0).max(10_000),
        progressPercentage: z.number().min(0).max(100),
        currentTab: z.string().min(1).max(120),
        timeInCurrentLesson: z.string().min(1).max(120),
      })
      .optional(),
    activities: z.record(z.unknown()).optional(),
    materials: z.record(z.unknown()).optional(),
    quiz: z.record(z.unknown()).optional(),
    userBehaviorContext: optionalTextSchema(10_000),
    difficultyDetected: z.record(z.unknown()).optional(),
  })
  .passthrough();

const platformContextSchema = z
  .object({
    userName: optionalTextSchema(300),
    userRole: optionalTextSchema(200),
    userJobTitle: optionalTextSchema(200),
    userJobDescription: optionalTextSchema(4_000),
    userId: optionalIdSchema,
    currentPage: optionalTextSchema(2_000),
    currentTab: optionalTextSchema(120),
    pageType: optionalTextSchema(120),
    organizationId: optionalIdSchema,
    organizationName: optionalTextSchema(300),
    organizationSlug: optionalTextSchema(200),
    organizationIndustry: optionalTextSchema(200),
    organizationSize: optionalTextSchema(120),
    organizationType: optionalTextSchema(120),
    organizationMission: optionalTextSchema(4_000),
    organizationCountry: optionalTextSchema(120),
    noCoursesAssigned: z.boolean().optional(),
    totalCourses: z.number().int().min(0).max(1_000_000).optional(),
    totalUsers: z.number().int().min(0).max(1_000_000).optional(),
    totalOrganizations: z.number().int().min(0).max(1_000_000).optional(),
    userCourses: z.array(z.record(z.unknown())).max(500).optional(),
    recentActivity: z.array(z.record(z.unknown())).max(500).optional(),
    platformStats: z.record(z.unknown()).optional(),
    coursesWithContent: z.array(z.record(z.unknown())).max(500).optional(),
    userLessonProgress: z.array(z.record(z.unknown())).max(1_000).optional(),
    currentLessonContext: currentLessonContextSchema.optional(),
    currentActivityContext: z
      .object({
        title: z.string().min(1).max(300),
        type: z.string().min(1).max(120),
        description: z.string().min(1).max(4_000),
        prompts: z.array(z.string().min(1).max(4_000)).max(20).optional(),
      })
      .passthrough()
      .optional(),
    userCheck: z
      .object({
        area: optionalTextSchema(200),
        companySize: optionalTextSchema(120),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const liaChatSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string().min(1).max(LIA_CONTENT_MAX_LENGTH),
            attachments: z.array(liaImageAttachmentSchema).max(3).optional(),
          })
          .passthrough(),
      )
      .min(1)
      .max(200),
    context: platformContextSchema.optional(),
    stream: z.boolean().optional(),
    enrichedMetadata: z.record(z.unknown()).optional(),
    isBugReport: z.boolean().optional(),
    conversationId: looseIdSchema.optional(),
  })
  .passthrough();

export type LiaChatBody = z.infer<typeof liaChatSchema>;

export const onboardingChatSchema = z.object({
  question: z.string().min(1).max(LIA_CONTENT_MAX_LENGTH),
  context: z.object({
    isOnboarding: z.boolean(),
    currentStep: z.number().int().min(0).max(1_000),
    totalSteps: z.number().int().min(1).max(1_000),
    conversationHistory: z
      .array(
        z.object({
          role: z.string().min(1).max(40),
          content: z.string().min(1).max(LIA_CONTENT_MAX_LENGTH),
        }),
      )
      .max(100),
  }),
  userName: optionalTextSchema(300),
  pageContext: z.record(z.unknown()).optional(),
});

export type OnboardingChatBody = z.infer<typeof onboardingChatSchema>;

export const endConversationSchema = z.object({
  conversationId: looseIdSchema,
  completed: z.boolean().optional().default(true),
});

export type EndConversationBody = z.infer<typeof endConversationSchema>;

export const completeActivitySchema = z.object({
  completionId: looseIdSchema.optional(),
  conversationId: looseIdSchema.optional().nullable(),
  activityType: z.string().min(1).max(200).optional(),
  generatedOutput: z.unknown().optional(),
  requireUserMessage: z.boolean().optional().default(false),
  timeSpentSeconds: z.number().int().min(0).max(31_536_000).optional(),
});

export type CompleteActivityBody = z.infer<typeof completeActivitySchema>;

export const startActivitySchema = z.object({
  conversationId: looseIdSchema.optional().nullable(),
  activityId: looseIdSchema.optional().nullable(),
  activityType: z.string().min(1).max(200),
  totalSteps: z.number().int().min(1).max(1_000).optional().default(1),
});

export type StartActivityBody = z.infer<typeof startActivitySchema>;

export const updateActivitySchema = z.object({
  completionId: looseIdSchema,
  currentStep: z.number().int().min(0).max(1_000).optional(),
  completedSteps: z.number().int().min(0).max(1_000).optional(),
  status: z.string().min(1).max(80).optional(),
  generatedOutput: z.unknown().optional(),
});

export type UpdateActivityBody = z.infer<typeof updateActivitySchema>;

export const conversationsPatchSchema = z.object({
  conversationId: looseIdSchema,
  title: z.string().min(1).max(255),
});

export type ConversationsPatchBody = z.infer<typeof conversationsPatchSchema>;

export const conversationTitlePatchSchema = z.object({
  conversation_title: z.string().max(255).nullable(),
});

export type ConversationTitlePatchBody = z.infer<
  typeof conversationTitlePatchSchema
>;

export const personalizationUpdateSchema = z.object({
  base_style: z
    .enum(['professional', 'casual', 'technical', 'friendly', 'formal'])
    .optional(),
  is_friendly: z.boolean().optional(),
  is_enthusiastic: z.boolean().optional(),
  custom_instructions: z.string().max(2_000).nullable().optional(),
  nickname: z.string().max(50).nullable().optional(),
  voice_enabled: z.boolean().optional(),
  dictation_enabled: z.boolean().optional(),
});

export type PersonalizationUpdateBody = z.infer<
  typeof personalizationUpdateSchema
>;

export { lessonSuggestionsRequestSchema };
export type { LessonSuggestionsRequest } from './lesson-suggestions/lesson-suggestions.types';
