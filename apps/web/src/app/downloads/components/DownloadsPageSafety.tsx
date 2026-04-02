'use client'

import { DOWNLOADS_SAFETY_BADGES } from '../constants'

export function DownloadsPageSafety() {
  const PrimaryIcon = DOWNLOADS_SAFETY_BADGES[0].icon

  return (
    <section className="mt-20 text-center py-12 px-6 rounded-[40px] bg-gradient-to-br from-[#0A2540] to-[#173B63] dark:from-[#1A2332] dark:to-[#0F1419] text-white">
      <div className="w-16 h-16 bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-8">
        <PrimaryIcon className="text-[#00D4B3]" size={32} />
      </div>
      <h2 className="text-3xl font-bold mb-4">Seguro y Verificado</h2>
      <p className="max-w-2xl mx-auto text-white/70 mb-12">
        Todos los releases de SofLIA Hub se compilan y firman automaticamente
        mediante GitHub Actions para garantizar la integridad y seguridad de
        cada instalador.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {DOWNLOADS_SAFETY_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md"
          >
            <badge.icon size={18} className={badge.accentClassName} />
            <span className="text-sm font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
