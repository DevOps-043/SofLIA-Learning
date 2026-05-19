import { z } from 'zod';

import { STREAMABLE_VIDEO_MIME_TYPES } from '@/lib/media/video-upload-policy';

export const adminTranscodingReprocessSchema = z
  .object({
    bucket: z.string().trim().min(1).max(64).default('course-videos'),
    contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES).default('video/mp4'),
    sourcePath: z.string().trim().min(1).max(600),
  })
  .strict();

export type AdminTranscodingReprocessBody = z.infer<typeof adminTranscodingReprocessSchema>;
