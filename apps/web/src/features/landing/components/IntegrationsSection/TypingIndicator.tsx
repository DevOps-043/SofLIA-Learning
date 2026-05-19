import Image from 'next/image'
import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-3 items-center">
      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-accent/50 flex-shrink-0">
        <Image src="/lia-avatar.webp" alt="SofLIA" fill className="object-cover object-top" />
      </div>
      <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.span
              key={delay}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay }}
              className="w-2 h-2 bg-white/60 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
