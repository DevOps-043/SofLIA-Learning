import { NextRequest } from "next/server";
import { liveContext, handleLive, json,LiveError } from "@/features/live/server";
import { recordingOperationSchema } from "@/features/live/recordings/contract";
import { recordingOperation } from "@/features/live/recordings/service.server";
import { readWorkspaceBody } from "@/features/live/hub-auth.server";
async function context(request:NextRequest,orgSlug:string){
 const actor=await liveContext(orgSlug),expected=request.headers.get("x-soflia-actor");
 if(expected&&expected!==actor.userId)throw new LiveError(403,"La cuenta cambió durante la operación.");
 return actor;
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; sessionId: string }> },
) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    return json(
      await recordingOperation(await context(request,orgSlug), sessionId, {
        type: "snapshot",
      }),
    );
  });
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; sessionId: string }> },
) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const input = recordingOperationSchema.parse(
      await readWorkspaceBody(request),
    );
    return json(
      await recordingOperation(await context(request,orgSlug), sessionId, input),
    );
  });
}
