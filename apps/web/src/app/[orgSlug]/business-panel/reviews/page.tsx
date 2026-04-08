
'use client'

import { BusinessPendingCoursesPage } from '@/features/business-panel/components/reviews/BusinessPendingCoursesPage'
import { useParams } from 'next/navigation'

export default function BusinessReviewsPage() {
    const params = useParams()
    const orgSlug = params?.orgSlug as string
    const basePath = `/${orgSlug}/business-panel/reviews`

    return <BusinessPendingCoursesPage basePath={basePath} />
}
