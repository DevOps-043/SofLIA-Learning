'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

// âš¡ OPTIMIZACIÓN: Lazy load de AuthTabs (contiene RegisterForm pesado)
const AuthTabs = dynamic(
  () => import('../../features/auth/components/AuthTabs').then(mod => ({ default: mod.AuthTabs })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A2540]/30 dark:border-[#00D4B3]/30 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full animate-spin"></div>
      </div>
    )
  }
);

function AuthPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isLogin = !tabParam || tabParam === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center p-0 relative overflow-hidden bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      {/* Fondo animado con formas geométricas */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculos animados de fondo */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#0A2540]/5 dark:bg-[#0A2540]/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00D4B3]/3 dark:bg-[#00D4B3]/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Patrón de grid sutil */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[linear-gradient(#0A2540_1px,transparent_1px),linear-gradient(90deg,#0A2540_1px,transparent_1px)] bg-[length:50px_50px]"
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Formulario — primero en DOM → arriba en móvil, derecha en desktop */}
          <div className="w-full max-w-md mx-auto lg:max-w-lg lg:order-2">
            <Suspense fallback={
              <div className="w-full h-40 sm:h-56 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#0A2540]/30 dark:border-[#00D4B3]/30 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full animate-spin"></div>
              </div>
            }>
              <AuthTabs />
            </Suspense>
          </div>

          {/* Logo — segundo en DOM → abajo en móvil, izquierda en desktop */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center justify-center lg:block lg:order-1"
          >
            <div className="relative w-full max-w-[200px] sm:max-w-[240px] lg:max-w-md mx-auto lg:mx-0">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: [0, -20, 0],
                }}
                transition={{
                  scale: { delay: 0.2, duration: 0.5 },
                  opacity: { delay: 0.2, duration: 0.5 },
                  y: {
                    delay: 0.7,
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
                className="relative w-full aspect-square"
              >
                <Image
                  src="/logo.png"
                  alt="SOFLIA Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
        <div className="w-8 h-8 border-4 border-[#0A2540]/30 dark:border-[#00D4B3]/30 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full animate-spin"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
