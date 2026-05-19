import { z } from 'zod'

export const updateReporteSchema = z.object({
  id: z.string().uuid(),
  estado: z
    .enum(['nuevo', 'en_revision', 'en_progreso', 'resuelto', 'cerrado'])
    .optional(),
  admin_asignado: z.union([z.string().uuid(), z.null()]).optional(),
  notas_admin: z.string().max(5_000).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
})

export type UpdateReporteBody = z.infer<typeof updateReporteSchema>
