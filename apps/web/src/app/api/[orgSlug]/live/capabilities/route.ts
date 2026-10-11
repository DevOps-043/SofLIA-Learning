import { handleLive, json, liveNavigationContext } from "@/features/live/server";

/** Solo informa navegación. Las operaciones vuelven a verificar sus permisos. */
export async function GET(_request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  return handleLive(async () => {
    const context = await liveNavigationContext((await params).orgSlug);
    return json({ canTeach: context.canTeach });
  });
}
