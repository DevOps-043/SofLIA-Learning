import { z } from 'zod'

import {
  COURSE_VIDEO_MAX_SIZE_BYTES,
  STREAMABLE_VIDEO_MIME_TYPES,
} from '@/lib/media/video-upload-policy'

export const transcodeVideoSchema = z.object({
  contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES),
  publicUrl: z.string().url().max(2_000),
  size: z
    .number()
    .int()
    .positive()
    .max(COURSE_VIDEO_MAX_SIZE_BYTES)
    .optional(),
  sourcePath: z.string().min(1).max(600),
})

export type TranscodeVideoBody = z.infer<typeof transcodeVideoSchema>
