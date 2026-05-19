'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Apple, Download, Monitor, Sparkles } from 'lucide-react'
import type { ReleaseData } from '../types'

interface DownloadsPageHeroProps {
  release: ReleaseData | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function DownloadsPageHero({
  release,
  loading,
  error,
  onRetry,
}: DownloadsPageHeroProps) {
  return (
    <section className="text-center mb-20 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-primary/60 dark:text-white/60">
            {loading
              ? 'Cargando ultima version...'
              : error
                ? 'Error al obtener la version'
                : `Version ${release?.version} disponible`}
          </span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold text-primary dark:text-white mb-6 tracking-tight">
          Lleva a <span className="text-accent">SofLIA Hub</span>
          <br />
          a todas partes
        </h1>

        <p className="text-xl text-primary/60 dark:text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
          La aplicacion de escritorio oficial de SofLIA. Accede a tu asistente
          de IA, cursos y herramientas de productividad directamente desde tu
          sistema operativo, sin necesidad de abrir el navegador.
        </p>
      </motion.div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
        >
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <p className="text-sm text-amber-700 dark:text-amber-400 text-left flex-1">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-medium transition-colors shrink-0"
          >
            Reintentar
          </button>
        </motion.div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-64 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 animate-pulse"
            />
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Monitor size={120} />
              </div>

              <div className="relative z-10 flex flex-col h-full text-left">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Monitor className="text-blue-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">
                  Windows
                </h3>
                <p className="text-primary/40 dark:text-white/40 text-sm mb-8 flex-1">
                  Compatible con Windows 10 y 11 (64-bit).
                  {release?.assets.windows?.size ? (
                    <>
                      <br />
                      Tamano: {release.assets.windows.size}
                    </>
                  ) : null}
                </p>

                {release?.assets.windows ? (
                  <a
                    href={release.assets.windows.url}
                    className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-primary hover:bg-primary dark:bg-accent dark:hover:bg-[var(--color-legacy-00b8a3)] text-white transition-all group"
                  >
                    <span className="font-bold">Descargar para Windows</span>
                    <Download
                      size={20}
                      className="group-hover:translate-y-1 transition-transform"
                    />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed"
                  >
                    No disponible en esta version
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Apple size={120} />
              </div>

              <div className="relative z-10 flex flex-col h-full text-left">
                <div className="w-14 h-14 rounded-2xl bg-gray-500/10 flex items-center justify-center mb-6">
                  <Apple className="text-gray-400" size={32} />
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">
                  macOS
                </h3>
                <p className="text-primary/40 dark:text-white/40 text-sm mb-8 flex-1">
                  Compatible con Ventura, Sonoma y Posteriores.
                  {release?.assets.mac?.size ? (
                    <>
                      <br />
                      Tamano: {release.assets.mac.size}
                    </>
                  ) : null}
                </p>

                {release?.assets.mac ? (
                  <a
                    href={release.assets.mac.url}
                    className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-primary hover:bg-primary dark:bg-white dark:hover:bg-gray-100 dark:text-primary text-white transition-all group"
                  >
                    <span className="font-bold">Descargar para macOS</span>
                    <Download
                      size={20}
                      className="group-hover:translate-y-1 transition-transform"
                    />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed"
                  >
                    No disponible en esta version
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}
