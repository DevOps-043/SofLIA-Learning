import { LiveSessionDetails } from "@/features/live/LiveSessionDetails";
export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string; sessionId: string }>;
}) {
  return <LiveSessionDetails {...await params} />;
}
