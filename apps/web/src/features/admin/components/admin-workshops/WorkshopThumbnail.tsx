'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { WorkshopThumbnailFallback } from './WorkshopThumbnailFallback'
import { WorkshopThumbnailShine } from './WorkshopThumbnailShine'

interface WorkshopThumbnailProps {
  thumbnailUrl?: string
  title: string
}

export function WorkshopThumbnail({
  thumbnailUrl,
  title,
}: WorkshopThumbnailProps) {
  const { disableHeavy } = useMotionSafe()
  const [imageError, setImageError] = useState(false)

  if (!thumbnailUrl || imageError) {
    return <WorkshopThumbnailFallback />
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={disableHeavy ? false : { scale: 1 }}
        whileHover={disableHeavy ? undefined : { scale: 1.08 }}
        transition={disableHeavy ? undefined : { duration: 0.5, ease: 'easeOut' }}
      >
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.2), transparent 60%)',
        }}
      />
      {!disableHeavy ? <WorkshopThumbnailShine /> : null}
    </div>
  )
}
