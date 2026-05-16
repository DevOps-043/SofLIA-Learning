'use client'

import { BuildingOffice2Icon } from '@heroicons/react/24/outline'

export function GeneralBrandingPreview({
  bannerUrl,
  logoUrl,
}: {
  bannerUrl?: string | null
  logoUrl?: string | null
}) {
  if (!bannerUrl && !logoUrl) return null

  return (
    <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-[#0F1419]">
      <p className="mb-3 text-xs font-medium uppercase text-gray-500 dark:text-white/50">Vista previa</p>
      <div
        className="relative h-24 overflow-hidden rounded-lg bg-gray-200 dark:bg-white/10"
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute -bottom-5 left-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-white bg-white dark:border-[#1E2329] dark:bg-[#1E2329]" style={{ borderWidth: '3px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <BuildingOffice2Icon className="h-7 w-7 text-gray-400 dark:text-[#8899A6]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
