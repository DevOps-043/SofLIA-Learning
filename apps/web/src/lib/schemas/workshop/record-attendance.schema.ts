import { z } from 'zod'

export const RecordAttendanceSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  attended: z.boolean(),
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable(),
})

export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>
