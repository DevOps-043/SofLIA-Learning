import { z } from 'zod';

const positiveIdSchema = z.coerce.number().int().positive();
const optionalPositiveIdSchema = z
  .union([z.coerce.number().int().min(0), z.null()])
  .optional();

export const statisticsProfileSchema = z.object({
  cargo_titulo: z.string().trim().min(1).max(200),
  rol_id: positiveIdSchema,
  nivel_id: positiveIdSchema,
  area_id: positiveIdSchema,
  relacion_id: positiveIdSchema,
  tamano_id: optionalPositiveIdSchema,
  sector_id: optionalPositiveIdSchema,
  pais: z.string().trim().max(120).optional().nullable(),
  dificultad_id: z.coerce.number().int().min(1).max(5),
  uso_ia_respuesta: z.string().trim().min(1).max(2_000),
});

export type StatisticsProfileBody = z.infer<typeof statisticsProfileSchema>;
