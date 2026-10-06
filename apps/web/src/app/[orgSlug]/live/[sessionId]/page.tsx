import { LiveRoom } from "@/features/live/LiveRoom";
export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string; sessionId: string }>;
}) {
  return <LiveRoom {...await params} />;
}
