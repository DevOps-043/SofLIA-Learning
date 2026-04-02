'use client'

import { ShieldCheck } from 'lucide-react'
import { DOWNLOADS_REQUIREMENTS } from '../constants'

export function DownloadsPageRequirements() {
  return (
    <section className="bg-white dark:bg-white/5 rounded-[40px] border border-black/5 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-black/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
        <ShieldCheck size={200} />
      </div>

      <div className="relative z-10 mb-12">
        <h2 className="text-3xl font-bold dark:text-white mb-4">
          Requisitos del Sistema
        </h2>
        <p className="text-[#0A2540]/60 dark:text-white/60">
          Asegurate de que tu equipo cumple con lo necesario para la mejor
          experiencia.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                Plataforma
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                O.S.
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                RAM
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40">
                Espacio
              </th>
            </tr>
          </thead>
          <tbody>
            {DOWNLOADS_REQUIREMENTS.map((requirement) => (
              <tr
                key={requirement.os}
                className="border-b border-black/5 dark:border-white/5 last:border-0 group"
              >
                <td className="py-6 pr-8">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${requirement.color} flex items-center justify-center`}
                    >
                      <requirement.icon size={20} />
                    </div>
                    <span className="font-bold dark:text-white">
                      {requirement.os}
                    </span>
                  </div>
                </td>
                <td className="py-6 pr-8 text-[#0A2540]/60 dark:text-white/60">
                  {requirement.min}
                </td>
                <td className="py-6 pr-8 text-[#0A2540]/60 dark:text-white/60">
                  {requirement.ram}
                </td>
                <td className="py-6 text-[#0A2540]/60 dark:text-white/60">
                  {requirement.disk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
