'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

interface CertificateDocumentViewportProps {
  model: CertificateDocumentModel
}

export function CertificateDocumentViewport({
  model,
}: CertificateDocumentViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const updateScale = () => {
      const nextScale = Math.min(1, (container.clientWidth - 4) / CERTIFICATE_RENDER_WIDTH_PX)
      setScale(nextScale > 0 ? nextScale : 1)
    }

    updateScale()

    const resizeObserver = new ResizeObserver(() => {
      updateScale()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="flex w-full justify-center overflow-hidden">
      <div
        style={{
          width: `${CERTIFICATE_RENDER_WIDTH_PX * scale}px`,
          height: `${CERTIFICATE_RENDER_HEIGHT_PX * scale}px`,
        }}
      >
        <div
          style={{
            width: `${CERTIFICATE_RENDER_WIDTH_PX}px`,
            height: `${CERTIFICATE_RENDER_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CertificateDocument model={model} />
        </div>
      </div>
    </div>
  )
}
