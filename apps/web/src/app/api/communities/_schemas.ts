import { z } from 'zod';

const boundedJsonRecord = z.record(z.unknown()).refine(
  (value) => JSON.stringify(value).length <= 100_000,
  'Payload demasiado grande',
);

const attachmentDataSchema = z
  .union([boundedJsonRecord, z.string().max(100_000), z.null()])
  .optional();

const optionalNullableString = (max: number) =>
  z.string().max(max).optional().nullable();

export const communityReactionTypeSchema = z.enum([
  'like',
  'love',
  'laugh',
  'wow',
  'sad',
  'angry',
]);

export const createCommunityPostSchema = z
  .object({
    title: optionalNullableString(300),
    content: z.string().min(1).max(20_000),
    attachment_url: optionalNullableString(2_000),
    attachment_type: optionalNullableString(40),
    attachment_data: attachmentDataSchema,
  })
  .passthrough();

export type CreateCommunityPostBody = z.infer<typeof createCommunityPostSchema>;

export const updateCommunityPostSchema = z
  .object({
    title: optionalNullableString(300),
    content: z.string().min(1).max(20_000).optional(),
    attachment_url: optionalNullableString(2_000),
    attachment_type: optionalNullableString(40),
    attachment_data: attachmentDataSchema,
  })
  .passthrough();

export type UpdateCommunityPostBody = z.infer<typeof updateCommunityPostSchema>;

export const createCommunityCommentSchema = z.object({
  content: z.string().min(1).max(1_000),
  parent_comment_id: z
    .preprocess(
      (value) => (value === '' ? null : value),
      z.string().uuid().optional().nullable(),
    )
    .optional(),
});

export type CreateCommunityCommentBody = z.infer<
  typeof createCommunityCommentSchema
>;

export const pollVoteSchema = z.object({
  option: z.string().min(1).max(500),
  action: z.enum(['vote', 'remove']),
});

export type PollVoteBody = z.infer<typeof pollVoteSchema>;

export const hideCommunityPostSchema = z.object({
  hideFromFeed: z.boolean().optional().default(false),
});

export type HideCommunityPostBody = z.infer<typeof hideCommunityPostSchema>;

export const communityPostReactionSchema = z.object({
  reaction_type: communityReactionTypeSchema,
  action: z.string().max(40).optional().nullable(),
});

export type CommunityPostReactionBody = z.infer<
  typeof communityPostReactionSchema
>;

export const batchCommunityPostReactionsSchema = z.object({
  postIds: z.array(z.string().uuid()).min(1).max(500),
});

export type BatchCommunityPostReactionsBody = z.infer<
  typeof batchCommunityPostReactionsSchema
>;

export const reportCommunityPostSchema = z.object({
  reason_category: z.enum([
    'spam',
    'inappropriate',
    'harassment',
    'misinformation',
    'violence',
    'other',
  ]),
  reason_details: optionalNullableString(2_000),
});

export type ReportCommunityPostBody = z.infer<
  typeof reportCommunityPostSchema
>;

export const resolveCommunityReportSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'ignored']),
  resolution_action: z
    .enum(['delete_post', 'hide_post', 'ignore_report', 'warn_user'])
    .optional()
    .nullable(),
  resolution_notes: optionalNullableString(2_000),
});

export type ResolveCommunityReportBody = z.infer<
  typeof resolveCommunityReportSchema
>;
