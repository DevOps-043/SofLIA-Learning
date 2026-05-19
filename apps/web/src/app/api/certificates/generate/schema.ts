import { z } from 'zod';

const optionalIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .optional()
  .nullable();

export const generateCertificateSchema = z.object({
  course_id: z.string().trim().min(1).max(200),
  enrollment_id: optionalIdSchema,
  organization_id: optionalIdSchema,
});

export type GenerateCertificateBody = z.infer<typeof generateCertificateSchema>;
