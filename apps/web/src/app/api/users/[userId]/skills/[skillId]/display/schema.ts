import { z } from 'zod';

export const updateSkillDisplaySchema = z.object({
  is_displayed: z.boolean(),
});

export type UpdateSkillDisplayBody = z.infer<typeof updateSkillDisplaySchema>;
