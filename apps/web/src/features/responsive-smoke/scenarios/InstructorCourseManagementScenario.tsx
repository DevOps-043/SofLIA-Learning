'use client'

import { Plus } from 'lucide-react'

import { ActionButton } from '../components/ActionButton'
import { ManagementTabStrip } from '../components/ManagementTabStrip'
import { ModulesGrid } from '../components/ModulesGrid'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeModules } from '../mocks'

export function InstructorCourseManagementScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Instructor Course Management"
      description="Vista para instructor con tabs desplazables, CTA full width en mobile y cards de modulo que apilan acciones correctamente."
      actions={<ActionButton icon={<Plus className="h-4 w-4" />} label="Agregar modulo" emphasis="primary" />}
    >
      <Surface title="Navegacion del curso" subtitle="El tabstrip debe mantenerse usable sin recortes.">
        <ManagementTabStrip />
      </Surface>
      <Surface title="Contenido asignado" subtitle="Simula el tab de modulos del instructor.">
        <ModulesGrid modules={smokeModules} accent="instructor" />
      </Surface>
    </ScenarioCanvas>
  )
}
