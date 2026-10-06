import { describe, expect, it } from "vitest";
import { activitySchema, canTransition, scheduleSchema } from "../schemas";
describe("Live course domain contracts", () => {
  it("rejects malformed quizzes and out-of-range answer keys", () => {
    expect(
      activitySchema.safeParse({
        kind: "quiz",
        title: "Q",
        content: "?",
        options: ["A"],
        correct_option: 0,
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({
        kind: "quiz",
        title: "Q",
        content: "?",
        options: ["A", "B"],
        correct_option: 2,
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({
        kind: "quiz",
        title: "Q",
        content: "?",
        options: ["A", "B"],
        correct_option: 1,
      }).success,
    ).toBe(true);
  });
  it("prevents reopening or cancelling an ended live session", () => {
    expect(canTransition("ended", "live")).toBe(false);
    expect(canTransition("live", "cancelled")).toBe(false);
    expect(canTransition("scheduled", "live")).toBe(true);
    expect(canTransition("live", "ended")).toBe(true);
  });
  it("requires future dates, bounded duration, course and idempotency key", () => {
    const input = {
      request_id: "00000000-0000-4000-8000-000000000001",
      course_id: "00000000-0000-4000-8000-000000000002",
      title: "Live",
      starts_at: new Date(Date.now() + 60000).toISOString(),
      duration_minutes: 60,
    };
    expect(scheduleSchema.safeParse(input).success).toBe(true);
    expect(
      scheduleSchema.safeParse({ ...input, starts_at: "2020-01-01T00:00:00Z" })
        .success,
    ).toBe(false);
    expect(
      scheduleSchema.safeParse({ ...input, duration_minutes: 481 }).success,
    ).toBe(false);
    expect(
      scheduleSchema.safeParse({ ...input, request_id: undefined }).success,
    ).toBe(false);
  });
});
