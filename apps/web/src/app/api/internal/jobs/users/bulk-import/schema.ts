import { z } from 'zod';

export const queueEnvelopeSchema = z.object({
  dedupKey: z.string().min(1),
  enqueuedAt: z.string().min(1),
  jobId: z.string().min(1),
  jobName: z.literal('users.bulk-import'),
  payload: z.object({
    createdBy: z.string().min(1),
    filePath: z.string().min(1),
    organizationId: z.string().min(1),
  }),
});

export type QueueEnvelopeBody = z.infer<typeof queueEnvelopeSchema>;
