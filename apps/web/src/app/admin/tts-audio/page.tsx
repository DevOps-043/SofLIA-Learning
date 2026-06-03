import dynamic from 'next/dynamic';

import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner';

const AdminTTSAudioPage = dynamic(
  () =>
    import('@/features/admin/components/AdminTTSAudioPage').then((mod) => ({
      default: mod.AdminTTSAudioPage,
    })),
  {
    loading: () => <AdminLoadingSpinner />,
  },
);

export default function TTSAudioPage() {
  return <AdminTTSAudioPage />;
}
