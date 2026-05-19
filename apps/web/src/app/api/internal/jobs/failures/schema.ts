import { z } from 'zod';

export const queueFailurePayloadSchema = z
  .record(z.unknown())
  .nullable();

export type QueueFailurePayload = z.infer<typeof queueFailurePayloadSchema>;
