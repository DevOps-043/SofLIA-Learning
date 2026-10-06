import { LiveCatalogPage } from "@/features/live/LiveCatalog";
export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  return <LiveCatalogPage orgSlug={(await params).orgSlug} />;
}
