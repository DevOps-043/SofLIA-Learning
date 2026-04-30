import { redirect } from 'next/navigation'

interface BusinessPanelAnalyticsPageProps {
  params: {
    orgSlug: string
  }
}

export default function BusinessPanelAnalyticsPage({
  params,
}: BusinessPanelAnalyticsPageProps) {
  redirect(`/${params.orgSlug}/business-panel/reports`)
}
