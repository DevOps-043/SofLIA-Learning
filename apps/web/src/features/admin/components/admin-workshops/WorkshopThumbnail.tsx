'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { BookOpenIcon } from '@heroicons/react/24/outline'

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
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#00D4B3]/30 to-[#0A2540] dark:from-[#0A2540] dark:via-[#00D4B3]/20 dark:to-[#0A2540]"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, #00D4B3 1px, transparent 0)',
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
          <div className="p-6 bg-white/10 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
            <BookOpenIcon className="h-24 w-24 text-[#00D4B3] dark:text-[#00D4B3]/60" />
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      {!disableHeavy && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
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
