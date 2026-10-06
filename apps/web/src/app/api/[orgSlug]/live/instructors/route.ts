import { NextRequest } from "next/server";
import { handleLive, json, liveContext } from "@/features/live/server";
import { updateInstructor } from "@/features/live/services/instructors.service";
type Context = { params: Promise<{ orgSlug: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  return handleLive(async () =>
    json(
      await updateInstructor(
        await liveContext((await params).orgSlug),
        await request.json(),
      ),
    ),
  );
}
