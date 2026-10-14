// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
import { LiveError } from "../errors";
vi.mock("../server", () => ({
  LiveError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  checked: (result: { data: unknown; error?: unknown }) => {
    if (result.error) throw result.error;
    return result.data;
  },
  liveActorContext: vi.fn(),
  liveSession: vi.fn(),
}));
import { recordingOperation } from "../recordings/service.server";
import { liveActorContext, liveSession, type LiveContext } from "../server";
const user = "00000000-0000-4000-8000-000000000011",
  org = "00000000-0000-4000-8000-000000000001",
  session = "00000000-0000-4000-8000-000000000031",
  runId = "00000000-0000-4000-8000-000000000041",
  fileId = "00000000-0000-4000-8000-000000000051";
let published = true,
  enabled = true,
  blocked = false;
const signer = vi.fn();
const db = {
  from: (table: string) => {
    const row = () =>
      table === "organizations"
        ? { is_active: true }
        : table === "live_studio_state"
          ? {
              state: {
                moderation: {
                  restrictions: blocked ? { [user]: "blocked" } : {},
                },
              },
            }
          : table === "live_recording_policies"
            ? { replay_enabled: enabled }
            : table === "live_recording_runs"
              ? { id: runId, session_id: session, status: "ready", published }
              : null;
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({ data: row() }),
      single: async () => ({ data: row() }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(
          resolve({
            data:
              table === "live_recording_files"
                ? [
                    {
                      id: fileId,
                      status: "stored",
                      object_key: "privado/video.mp4",
                      duration_seconds: 60,
                    },
                  ]
                : [],
          }),
        ),
    };
    return builder;
  },
  storage: { from: () => ({ createSignedUrls: signer }) },
};
const ctx = { userId: user, orgId: org, db } as unknown as LiveContext;
beforeEach(() => {
  vi.resetAllMocks();
  published = true;
  enabled = true;
  blocked = false;
  vi.mocked(liveSession).mockResolvedValue({
    canManage: false,
    session: { id: session, status: "ended" } as never,
  });
  vi.mocked(liveActorContext).mockResolvedValue(ctx);
  signer.mockResolvedValue({
    data: [
      {
        path: "privado/video.mp4",
        signedUrl:
          "https://project.supabase.co/storage/v1/object/sign/live-recordings/privado/video.mp4?token=prueba",
      },
    ],
  });
});
describe("Acceso a repeticiones", () => {
  it("concede edición publicada con identidad y expiración acotada", async () => {
    const result = await recordingOperation(ctx, session, {
      type: "play",
      run_id: runId,
    });
    expect(result.playback).toMatchObject({
      session_id: session,
      user_id: user,
      run_id: runId,
    });
    expect(
      Date.parse(result.playback!.expires_at) - Date.now(),
    ).toBeLessThanOrEqual(120000);
    expect(signer).toHaveBeenCalledWith(["privado/video.mp4"], 120);
  });
  it.each(["privado", "deshabilitado", "moderado"])(
    "deniega %s antes de firmar",
    async (state) => {
      if (state === "privado") published = false;
      if (state === "deshabilitado") enabled = false;
      if (state === "moderado") blocked = true;
      await expect(
        recordingOperation(ctx, session, { type: "play", run_id: runId }),
      ).rejects.toMatchObject({ status: 403 });
      expect(signer).not.toHaveBeenCalled();
    },
  );
  it("no entrega una concesión si se retira publicación mientras Storage firma", async () => {
    signer.mockImplementation(async () => {
      published = false;
      return {
        data: [
          {
            path: "privado/video.mp4",
            signedUrl:
              "https://project.supabase.co/storage/v1/object/sign/live-recordings/privado/video.mp4",
          },
        ],
      };
    });
    await expect(
      recordingOperation(ctx, session, { type: "play", run_id: runId }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("deniega si se retira la membresía durante la concesión", async () => {
    vi.mocked(liveActorContext).mockRejectedValue(
      new LiveError(403, "Membresía retirada."),
    );
    await expect(
      recordingOperation(ctx, session, { type: "play", run_id: runId }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("comprueba path de los resultados de firma y no usa una URL ajena por índice", async () => {
    signer.mockResolvedValue({
      data: [
        {
          path: "otra/edicion.mp4",
          signedUrl: "https://project.supabase.co/ajeno",
        },
      ],
    });
    await expect(
      recordingOperation(ctx, session, { type: "play", run_id: runId }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
