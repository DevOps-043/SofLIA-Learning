// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { updateInstructor } from "../services/instructors.service";
import { uploadMaterial } from "../services/materials.service";
import { saveTranscript } from "../services/transcript.service";
import type { LiveContext } from "../server";
import type { LiveSession } from "../types";
describe("Live mutation authorization", () => {
  const database = { from: vi.fn() };
  const context = {
    db: database,
    userId: "student",
    orgId: "organization",
    isAdmin: false,
    canTeach: false,
  } as unknown as LiveContext;
  const session = {
    id: "session",
    instructor_id: "teacher",
    status: "live",
  } as LiveSession;
  it("blocks role escalation before looking up an account", async () => {
    await expect(
      updateInstructor(context, { email: "teacher@example.com" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(database.from).not.toHaveBeenCalled();
  });
  it("rejects material uploads from learners before reading the file", async () => {
    await expect(
      uploadMaterial(context, session, false, new FormData()),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("rejects forged transcripts from another participant even with a management flag", async () => {
    await expect(
      saveTranscript(context, session, true, {}),
    ).rejects.toMatchObject({ status: 403 });
  });
});
