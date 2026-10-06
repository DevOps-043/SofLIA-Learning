import { z } from "zod";
export const scheduleSchema = z.object({
  request_id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  starts_at: z
    .string()
    .datetime({ offset: true })
    .refine((v) => Date.parse(v) > Date.now(), "La fecha debe ser futura"),
  duration_minutes: z.number().int().min(15).max(480),
});
export const activitySchema = z
  .object({
    kind: z.enum(["quiz", "reading"]),
    title: z.string().trim().min(1).max(180),
    content: z.string().trim().min(1).max(8000),
    options: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
    correct_option: z.number().int().min(0).max(5).optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.kind === "quiz" &&
      (v.options.length < 2 ||
        v.correct_option === undefined ||
        v.correct_option >= v.options.length)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "El quiz requiere opciones y una respuesta correcta válida",
      });
    }
  });
export function canTransition(from: string, to: string) {
  return (
    (from === "scheduled" && ["live", "cancelled"].includes(to)) ||
    (from === "live" && to === "ended")
  );
}
