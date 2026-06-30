import { BusinessPanelContentPage } from './BusinessPanelContentPage'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function BusinessPanelCoursesPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const initialTab = tab === 'paths' ? 'paths' : 'courses'
  return <BusinessPanelContentPage initialTab={initialTab} />
}
