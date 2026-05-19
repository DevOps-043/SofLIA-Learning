import { z } from 'zod';

export const questionnaireAnswerSchema = z.object({
  valor: z.unknown(),
});

export type QuestionnaireAnswerBody = z.infer<typeof questionnaireAnswerSchema>;
