import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

const AdminTranscodingPage = dynamic(
  () =>
    import('@/features/admin/components/AdminTranscodingPage').then((mod) => ({
      default: mod.AdminTranscodingPage,
    })),
  {
    loading: () => <AdminLoadingSpinner />,
  },
)

export default function TranscodingPage() {
  return <AdminTranscodingPage />
}
