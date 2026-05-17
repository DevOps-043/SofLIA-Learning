'use client'

import { Building2, CheckCircle2 } from 'lucide-react'

import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { organizations } from './scenario-data'

export function SelectOrganizationScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Select Organization"
      description="SelecciÃ³n de organizaciÃ³n con tarjetas de alto contenido, badges de rol y CTA integrados. El grid debe degradar a una columna sin cortar textos largos."
    >
      <section className="grid gap-5 lg:grid-cols-2">
        {organizations.map((org) => (
          <button
            key={org.id}
            type="button"
            className="flex min-h-[200px] w-full flex-col justify-between rounded-[28px] border border-[#DCE7F3] bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#0C1628]"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#EEF4FB] text-[#0A2540] dark:bg-white/10 dark:text-white">
                  <Building2 className="h-7 w-7" />
                </div>
                <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#0A2540] dark:bg-white/10 dark:text-white/70">
                  {org.role}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-tight text-[#0A2540] dark:text-white">
                  {org.name}
                </h2>
                <p className="mt-2 break-all text-sm text-[#637489] dark:text-white/60">
                  /{org.slug}
                </p>
              </div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0A2540] dark:text-white">
              Continuar
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </button>
        ))}
      </section>
    </ScenarioCanvas>
  )
}
