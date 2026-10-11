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
  session_type: z.enum(["meeting", "webinar"]).default("meeting"),
});
export function canTransition(from: string, to: string) {
  return (
    (from === "scheduled" && ["live", "cancelled"].includes(to)) ||
    (from === "live" && to === "ended")
  );
}
