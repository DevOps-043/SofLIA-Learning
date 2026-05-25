'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface TypewriterTextProps {
  text: string
  onComplete?: () => void
  speed?: number
}

export function TypewriterText({ text, onComplete, speed = 30 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((previous) => previous + text[currentIndex])
        setCurrentIndex((previous) => previous + 1)
      }, speed)
      return () => clearTimeout(timeout)
    }
    onComplete?.()
  }, [currentIndex, onComplete, speed, text])

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  )
}
