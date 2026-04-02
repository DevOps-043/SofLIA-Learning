'use client';

import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';

export function BusinessThemeCustomizerHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}
        />
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          className="p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
        >
          <Palette className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-white">Personalizacion de Tema</h2>
          <p className="text-white/60 text-sm">Personaliza la apariencia de tu plataforma</p>
        </div>
      </div>
    </motion.div>
  );
}
