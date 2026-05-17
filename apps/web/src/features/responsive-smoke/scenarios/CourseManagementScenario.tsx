'use client'

import { Clock3, Plus } from 'lucide-react'

import { LessonModal } from '@/features/admin/components/LessonModal'

import { ActionButton } from '../components/ActionButton'
import { ManagementTabStrip } from '../components/ManagementTabStrip'
import { ModulesGrid } from '../components/ModulesGrid'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeModules } from '../mocks'
import { instructorList } from './scenario-data'

export function CourseManagementScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Course Management"
        description="Cabecera, tabs horizontales y cards de modulos con texto extenso. Sobre el layout se monta una leccion modal real para validar max-height, scroll interno y footer accesible en viewport chico."
        actions={
          <>
            <ActionButton icon={<Clock3 className="h-4 w-4" />} label="Recalcular tiempos" />
            <ActionButton icon={<Plus className="h-4 w-4" />} label="Agregar modulo" emphasis="primary" />
          </>
        }
      >
        <Surface title="Gestion de contenido" subtitle="Los tabs deben poder scrollear horizontalmente sin cortar el contenido.">
          <ManagementTabStrip />
        </Surface>
        <Surface title="Modulos del curso" subtitle="Cards con badges, botones y textos largos que deben mantenerse dentro del viewport.">
          <ModulesGrid modules={smokeModules} />
        </Surface>
      </ScenarioCanvas>
      <LessonModal lesson={null} moduleId="module-responsive-smoke" onClose={() => undefined} onSave={async () => undefined} instructors={[...instructorList]} />
    </>
  )
}
