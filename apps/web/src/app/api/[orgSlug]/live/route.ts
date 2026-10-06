import { NextRequest } from "next/server";
import { handleLive, json, liveContext } from "@/features/live/server";
import { listLiveCatalog } from "@/features/live/services/catalog.service";
import { scheduleSession } from "@/features/live/services/schedule.service";
type Context = { params: Promise<{ orgSlug: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  return handleLive(async () =>
    json(
      await listLiveCatalog(
        await liveContext((await params).orgSlug),
        request.nextUrl.searchParams,
      ),
    ),
  );
}
export async function POST(request: NextRequest, { params }: Context) {
  return handleLive(async () =>
    json(
      await scheduleSession(
        await liveContext((await params).orgSlug),
        await request.json(),
      ),
      201,
    ),
  );
}
