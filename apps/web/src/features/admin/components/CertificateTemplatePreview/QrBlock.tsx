import dynamic from 'next/dynamic'
import { getFullUrl } from '@/lib/env'

const QRCode = dynamic(() => import('react-qr-code').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="w-[110px] h-[110px] bg-gray-200 animate-pulse rounded" />,
})

interface CertificateQrBlockProps {
  certificateHash?: string | null
  primaryColor: string
}

export function CertificateQrBlock({ certificateHash, primaryColor }: CertificateQrBlockProps) {
  return (
    <div className="flex-shrink-0 mx-8 flex flex-col items-center justify-center">
      <div className="bg-white p-3 rounded-lg border-2 shadow-lg" style={{ borderColor: primaryColor }}>
        <QRCode
          value={certificateHash ? getFullUrl(`/certificates/verify/${certificateHash}`) : getFullUrl('/certificates/verify/[hash]')}
          size={110}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          fgColor={primaryColor}
          bgColor="#ffffff"
        />
      </div>
    </div>
  )
}
