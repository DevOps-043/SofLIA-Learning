import { z } from 'zod';

const SCORM_BODY_MAX_CHARS = 100_000;
const idField = z.string().min(1).max(200);

const scormRuntimeRecordSchema = z
  .record(z.string(), z.unknown())
  .superRefine((value, ctx) => {
    const serialized = JSON.stringify(value);

    if (serialized.length > SCORM_BODY_MAX_CHARS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `SCORM payload must be ${SCORM_BODY_MAX_CHARS} characters or fewer.`,
      });
    }
  });

export const scormInitializeSchema = scormRuntimeRecordSchema.pipe(
  z.object({
    packageId: idField,
  }).passthrough(),
);

export const scormAttemptSchema = scormRuntimeRecordSchema.pipe(
  z.object({
    attemptId: idField,
  }).passthrough(),
);

export const scormSetValueSchema = scormRuntimeRecordSchema.pipe(
  z.object({
    attemptId: idField,
    key: z.string().min(1).max(500),
    value: z.unknown().refine((value) => value !== undefined, {
      message: 'value is required',
    }),
  }).passthrough(),
);

export const scormPackagePatchSchema = z.object({
  description: z.string().max(2_000).nullable().optional(),
  status: z.string().max(20).optional(),
  title: z.string().min(1).max(200).optional(),
}).passthrough();

export type ScormAttemptBody = z.infer<typeof scormAttemptSchema>;
export type ScormInitializeBody = z.infer<typeof scormInitializeSchema>;
export type ScormPackagePatchBody = z.infer<typeof scormPackagePatchSchema>;
export type ScormSetValueBody = z.infer<typeof scormSetValueSchema>;
