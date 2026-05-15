'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { useMotionSafe } from '../../../../lib/utils/motion'

interface WorkshopThumbnailProps {
  thumbnailUrl?: string
  title: string
}

export function WorkshopThumbnail({
  thumbnailUrl,
  title,
}: WorkshopThumbnailProps) {
  const { disableHeavy } = useMotionSafe()
  const theme = useAdminPanelTheme()
  const [imageError, setImageError] = useState(false)

  if (!thumbnailUrl || imageError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: theme.heroBackground }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.accentColor} 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <motion.div
          animate={disableHeavy ? {} : {
            scale: [1, 1.15, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10"
        >
          <div
            className="rounded-2xl border p-6 backdrop-blur-sm"
            style={{
              backgroundColor: theme.inverseSurface,
              borderColor: theme.inverseBorderColor,
            }}
          >
            <BookOpen
              className="h-24 w-24"
              style={{ color: theme.accentColor }}
            />
          </div>
        </motion.div>
      </motion.div>
    )
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
      {!disableHeavy && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}
