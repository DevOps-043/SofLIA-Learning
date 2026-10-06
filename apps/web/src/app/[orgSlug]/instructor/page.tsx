import { InstructorWorkspace } from "@/features/live/InstructorWorkspace";
export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  return <InstructorWorkspace orgSlug={(await params).orgSlug} />;
}
