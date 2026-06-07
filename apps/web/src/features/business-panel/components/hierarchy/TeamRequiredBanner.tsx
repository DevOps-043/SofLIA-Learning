'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Users, X } from 'lucide-react'

interface TeamRequiredBannerProps {
    orgSlug?: string
}

/**
 * Banner that shows when require_team_assignment is enabled
 * and the current user has no team assigned.
 */
export function TeamRequiredBanner({ orgSlug }: TeamRequiredBannerProps) {
    const [showBanner, setShowBanner] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkTeam = async () => {
            try {
                const apiBase = orgSlug
                    ? `/api/${encodeURIComponent(orgSlug)}/business/hierarchy`
                    : '/api/business/hierarchy'
                const res = await fetch(`${apiBase}/check-team`, {
                    credentials: 'include'
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.required && !data.hasTeam) {
                        setShowBanner(true)
                    }
                }
            } catch {
                // Silent fail - don't block the user
            } finally {
                setLoading(false)
            }
        }

        checkTeam()
    }, [orgSlug])

    if (loading || !showBanner || dismissed) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="mb-6"
            >
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-amber-900/20 backdrop-blur-xl p-5">
                    {/* Decorative background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-300/10 dark:bg-amber-400/5 blur-3xl" />
                        <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-orange-300/10 dark:bg-orange-400/5 blur-3xl" />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 dark:shadow-amber-400/15">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Equipo no asignado
                            </h3>
                            <p className="text-sm text-amber-800/80 dark:text-amber-300/70 mt-1 leading-relaxed">
                                Tu organización requiere que estés asignado a un equipo para acceder a todas las funciones.
                                Contacta a tu administrador para que te asigne a un equipo.
                            </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={() => setDismissed(true)}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-700/30 transition-colors"
                            aria-label="Cerrar aviso"
                        >
                            <X className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        </button>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
