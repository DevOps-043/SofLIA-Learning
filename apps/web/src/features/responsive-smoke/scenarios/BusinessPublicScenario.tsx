'use client'

import { Sparkles, Users } from 'lucide-react'

import { ActionButton } from '../components/ActionButton'
import { MetricGrid } from '../components/MetricGrid'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeMetrics } from '../mocks'
import { businessPublicBenefits } from './scenario-data'

export function BusinessPublicScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Public"
      description="Landing publica con hero, tarjetas de beneficios y CTA. Se valida que la composicion fluya entre mobile, tablet y desktop sin romper el ritmo visual."
      actions={
        <>
          <ActionButton icon={<Sparkles className="h-4 w-4" />} label="Solicitar demo" emphasis="primary" />
          <ActionButton icon={<Users className="h-4 w-4" />} label="Ver casos de uso" />
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Surface title="Entrenamiento escalable para equipos" subtitle="Hero editorial con copy largo y espacio para CTA secundarios.">
          <div className="space-y-5">
            <p className="max-w-2xl text-base leading-7 text-[#526174] dark:text-white/65">
              Unificamos onboarding, entrenamiento continuo y acompanamiento con LIA para que cada lider comercial encuentre materiales, recomendaciones y seguimiento accionable sin friccion.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {businessPublicBenefits.map((item) => (
                <div key={item} className="rounded-[22px] border border-[#DCE7F3] bg-[#F8FAFC] p-4 text-sm font-medium text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Surface>
        <Surface title="Indicadores clave" subtitle="Resumen compacto que debe caer debajo del hero en tablet.">
          <MetricGrid items={smokeMetrics.slice(0, 2)} />
        </Surface>
      </section>
    </ScenarioCanvas>
  )
}
