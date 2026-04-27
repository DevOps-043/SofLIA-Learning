'use client'

import Image from 'next/image'
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'

import { AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminDashboardHeroProps {
  greeting: string
  todayLabel: string
  userName: string
}

export function AdminDashboardHero({
  greeting,
  todayLabel,
  userName,
}: AdminDashboardHeroProps) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="relative mb-8 overflow-hidden p-5 sm:p-8">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 mix-blend-multiply opacity-90" style={{ backgroundColor: theme.primary }} />
        <div
          className="absolute inset-0 z-10"
          style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primary}, transparent)` }}
        />
        <Image
          src="/images/dashboard-header.png"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover opacity-70"
          sizes="(max-width: 768px) 100vw, 100vw"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.inverseText }}>
            <SparklesIcon className="h-5 w-5" style={{ color: theme.accent }} />
            <span>Panel de control</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-normal text-white sm:text-4xl" style={{ color: theme.inverseText }}>
            {greeting}, {userName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: theme.inverseText, opacity: 0.78 }}>
            Gestiona la plataforma, empresas, contenido y revisiones desde una vista operativa centralizada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-bg-light) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-bg-light) 16%, transparent)',
              color: theme.inverseText,
            }}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {todayLabel}
          </div>
        </div>
      </div>
    </AdminSurface>
  )
}
