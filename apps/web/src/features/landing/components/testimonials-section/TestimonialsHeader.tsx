'use client'

import { motion } from 'framer-motion'

export function TestimonialsHeader() {
  return (
    <motion.div
      className="text-center mb-24"
      initial={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, amount: 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <motion.h2
        className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 text-primary dark:text-white"
        initial={{ opacity: 0, scale: 0.5 }}
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, scale: 1 }}
      >
        Explora la Plataforma
      </motion.h2>
      <motion.p
        className="text-xl lg:text-2xl max-w-3xl mx-auto text-gray-500 dark:text-white/80 leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        Descubre todas las herramientas y recursos que tenemos para ti
      </motion.p>
    </motion.div>
  )
}
