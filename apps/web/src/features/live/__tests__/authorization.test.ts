// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { updateInstructor } from "../services/instructors.service";
import type { LiveContext } from "../server";
describe("Live mutation authorization", () => {
  const database = { from: vi.fn() };
  const context = {
    db: database,
    userId: "student",
    orgId: "organization",
    isAdmin: false,
    canTeach: false,
  } as unknown as LiveContext;
  it("blocks role escalation before looking up an account", async () => {
    await expect(
      updateInstructor(context, { email: "teacher@example.com" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(database.from).not.toHaveBeenCalled();
  });
});
