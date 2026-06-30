import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function BusinessPanelLearningPathsPage({ params }: Props) {
  const { orgSlug } = await params
  redirect(`/${orgSlug}/business-panel/courses?tab=paths`)
}
