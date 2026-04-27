'use client'

import { type ReactNode } from 'react'
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Plus,
  Settings2,
  Sparkles,
  Users,
} from 'lucide-react'

import {
  PageShell,
  ResponsiveDataTable,
  ResponsiveModalBody,
  ResponsiveModalFooter,
  ResponsiveModalPanel,
  ResponsiveModalViewport,
  type ResponsiveDataTableColumn,
} from '@/core/layout'
import { LessonModal } from '@/features/admin/components/LessonModal'
import { BusinessAddUserModal } from '@/features/business-panel/components/BusinessAddUserModal'

import type { ResponsiveSmokeScenarioId } from './constants'
import {
  smokeMetrics,
  smokeModules,
  smokeReportColumns,
  smokeReportRows,
  smokeUserColumns,
  smokeUserRows,
  smokeWorkshopColumns,
  smokeWorkshopRows,
  type SmokeMetric,
  type SmokeModule,
  type SmokeUserRow,
} from './mocks'

interface ResponsiveSmokeScenarioPageProps {
  scenario: ResponsiveSmokeScenarioId
}

const managementTabs = [
  'Modulos',
  'Configuracion',
  'Vista previa',
  'Estadisticas',
] as const

const instructorList = [
  { id: 'inst-1', name: 'Ana Salazar' },
  { id: 'inst-2', name: 'Luis Padilla' },
] as const

export function ResponsiveSmokeScenarioPage({
  scenario,
}: ResponsiveSmokeScenarioPageProps) {
  switch (scenario) {
    case 'admin-dashboard':
      return <AdminDashboardScenario />
    case 'admin-workshops':
      return <AdminWorkshopsScenario />
    case 'course-management':
      return <CourseManagementScenario />
    case 'admin-users-modal':
      return <AdminUsersModalScenario />
    case 'business-dashboard':
      return <BusinessDashboardScenario />
    case 'business-unified-panel':
      return <BusinessUnifiedPanelScenario />
    case 'business-users-modal':
      return <BusinessUsersModalScenario />
    case 'instructor-course-management':
      return <InstructorCourseManagementScenario />
    case 'select-organization':
      return <SelectOrganizationScenario />
    case 'business-public':
      return <BusinessPublicScenario />
  }
}

function ScenarioCanvas({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <main
      data-testid="responsive-smoke-root"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,212,179,0.12),_transparent_38%),linear-gradient(180deg,_#F8FAFC_0%,_#EEF4FB_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(0,212,179,0.12),_transparent_35%),linear-gradient(180deg,_#050B14_0%,_#0B1220_100%)]"
    >
      <PageShell size="wide" spacing="relaxed">
        <section className="rounded-[32px] border border-[#DCE7F3] bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-[#09111F]/85">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <span className="inline-flex w-fit items-center rounded-full bg-[#0A2540]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0A2540] dark:bg-white/10 dark:text-white/70">
                {eyebrow}
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-[#0A2540] sm:text-4xl dark:text-white">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526174] sm:text-base dark:text-white/65">
                  {description}
                </p>
              </div>
            </div>

            {actions ? (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
                {actions}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 space-y-6">{children}</div>
      </PageShell>
    </main>
  )
}

function Surface({
  title,
  subtitle,
  children,
  testId,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  testId?: string
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-[28px] border border-[#DCE7F3] bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#0C1628]"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#637489] dark:text-white/60">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function ActionButton({
  icon,
  label,
  emphasis = 'secondary',
}: {
  icon: ReactNode
  label: string
  emphasis?: 'primary' | 'secondary'
}) {
  const className =
    emphasis === 'primary'
      ? 'bg-[#0A2540] text-white shadow-[0_12px_32px_rgba(10,37,64,0.24)]'
      : 'border border-[#DCE7F3] bg-[#F8FAFC] text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white'

  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${className}`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

function MetricGrid({ items }: { items: SmokeMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((metric) => (
        <article
          key={metric.id}
          className="rounded-[24px] border border-[#DCE7F3] bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#637489] dark:text-white/55">
            {metric.label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-[#0A2540] dark:text-white">
            {metric.value}
          </p>
          <p className="mt-2 text-sm text-[#526174] dark:text-white/60">
            {metric.detail}
          </p>
        </article>
      ))}
    </div>
  )
}

function ManagementTabStrip() {
  return (
    <div
      data-testid="responsive-smoke-tabs"
      className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1"
    >
      {managementTabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          className={`min-w-[148px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            index === 0
              ? 'bg-[#0A2540] text-white'
              : 'border border-[#DCE7F3] bg-white text-[#526174] dark:border-white/10 dark:bg-white/5 dark:text-white/70'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function ModulesGrid({
  modules,
  accent = 'admin',
}: {
  modules: SmokeModule[]
  accent?: 'admin' | 'instructor'
}) {
  const actionTone =
    accent === 'admin'
      ? 'bg-[#0A2540] text-white'
      : 'bg-[#00D4B3] text-[#06231E]'

  return (
    <div className="space-y-4" data-testid="responsive-smoke-module-list">
      {modules.map((module) => (
        <article
          key={module.id}
          className="rounded-[26px] border border-[#DCE7F3] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#00D4B3]/12 px-3 py-1 text-xs font-semibold text-[#0A7F6D]">
                  {module.status}
                </span>
                <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-medium text-[#526174] dark:bg-white/10 dark:text-white/60">
                  {module.duration}
                </span>
                <span className="inline-flex rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-medium text-[#526174] dark:bg-white/10 dark:text-white/60">
                  {module.lessons} lecciones
                </span>
              </div>
              <h3 className="max-w-3xl text-xl font-semibold leading-tight text-[#0A2540] dark:text-white">
                {module.title}
              </h3>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${actionTone}`}
              >
                Agregar leccion
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[#DCE7F3] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Editar modulo
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function AdminDashboardScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Admin Dashboard"
      description="Shell administrativo con metricas, acciones que envuelven correctamente y una tabla que cambia entre desktop y mobile sin provocar overflow horizontal."
      actions={
        <>
          <ActionButton
            icon={<Sparkles className="h-4 w-4" />}
            label="Recalcular reportes"
          />
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            label="Crear taller"
            emphasis="primary"
          />
        </>
      }
    >
      <MetricGrid items={smokeMetrics} />

      <Surface
        title="Talleres recientes"
        subtitle="Validacion de tabla responsive con celdas de texto largo."
        testId="responsive-smoke-table-surface"
      >
        <ResponsiveDataTable
          data={smokeWorkshopRows}
          columns={smokeWorkshopColumns}
          keyExtractor={(item) => item.id}
          tableMinWidthClassName="min-w-[780px]"
          tableWrapperClassName="rounded-2xl border border-[#E3ECF5]"
        />
      </Surface>
    </ScenarioCanvas>
  )
}

function AdminWorkshopsScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Admin Workshops"
      description="Listado de talleres con filtros, tarjetas densas y tabla de control para validar wrapping, truncado y cambios de layout por breakpoint."
      actions={
        <>
          <ActionButton
            icon={<Settings2 className="h-4 w-4" />}
            label="Filtrar estados"
          />
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            label="Nuevo taller"
            emphasis="primary"
          />
        </>
      }
    >
      <Surface
        title="Embudo de publicacion"
        subtitle="Tarjetas con contenido variable que no deben romper el grid."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {smokeWorkshopRows.map((workshop) => (
            <article
              key={workshop.id}
              className="rounded-[24px] border border-[#DCE7F3] bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#00D4B3]/12 px-3 py-1 text-xs font-semibold text-[#0A7F6D]">
                  {workshop.status}
                </span>
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[#526174] dark:bg-[#09111F] dark:text-white/60">
                  {workshop.learners} alumnos
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight text-[#0A2540] dark:text-white">
                {workshop.title}
              </h3>
              <p className="mt-3 text-sm text-[#637489] dark:text-white/60">
                Responsable: {workshop.owner}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white"
                >
                  Gestionar curso
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-[#DCE7F3] bg-white px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  Ver detalles
                </button>
              </div>
            </article>
          ))}
        </div>
      </Surface>

      <Surface title="Control rapido" subtitle="Fallback tabular para tablet y desktop.">
        <ResponsiveDataTable
          data={smokeWorkshopRows}
          columns={smokeWorkshopColumns}
          keyExtractor={(item) => item.id}
          tableMinWidthClassName="min-w-[780px]"
        />
      </Surface>
    </ScenarioCanvas>
  )
}

function CourseManagementScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Course Management"
        description="Cabecera, tabs horizontales y cards de modulos con texto extenso. Sobre el layout se monta una leccion modal real para validar max-height, scroll interno y footer accesible en viewport chico."
        actions={
          <>
            <ActionButton
              icon={<Clock3 className="h-4 w-4" />}
              label="Recalcular tiempos"
            />
            <ActionButton
              icon={<Plus className="h-4 w-4" />}
              label="Agregar modulo"
              emphasis="primary"
            />
          </>
        }
      >
        <Surface
          title="Gestion de contenido"
          subtitle="Los tabs deben poder scrollear horizontalmente sin cortar el contenido."
        >
          <ManagementTabStrip />
        </Surface>

        <Surface
          title="Modulos del curso"
          subtitle="Cards con badges, botones y textos largos que deben mantenerse dentro del viewport."
        >
          <ModulesGrid modules={smokeModules} />
        </Surface>
      </ScenarioCanvas>

      <LessonModal
        lesson={null}
        moduleId="module-responsive-smoke"
        onClose={() => undefined}
        onSave={async () => undefined}
        instructors={[...instructorList]}
      />
    </>
  )
}

function AdminUsersModalScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Admin Users"
        description="Tabla administrativa con modal de alta usando el wrapper responsive compartido. En mobile el panel debe ocupar el alto util y apilar acciones sin desbordar."
        actions={
          <ActionButton
            icon={<Users className="h-4 w-4" />}
            label="Agregar usuario"
            emphasis="primary"
          />
        }
      >
        <Surface
          title="Miembros"
          subtitle="Vista base que debe permanecer util debajo del modal."
        >
          <ResponsiveDataTable
            data={smokeUserRows}
            columns={smokeUserColumns}
            keyExtractor={(item) => item.id}
            tableMinWidthClassName="min-w-[720px]"
          />
        </Surface>
      </ScenarioCanvas>

      <ResponsiveModalViewport>
        <ResponsiveModalPanel
          size="lg"
          data-testid="admin-users-modal-panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[#E9ECEF] px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">
                  Crear usuario administrativo
                </h2>
                <p className="mt-1 text-sm text-[#637489] dark:text-white/60">
                  Formulario denso con grid adaptativo y footer sticky.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#0A2540] dark:bg-white/10 dark:text-white/70">
                Draft
              </span>
            </div>
          </div>

          <ResponsiveModalBody className="px-4 py-5 sm:px-6">
            <form className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[
                'Nombre',
                'Apellido',
                'Correo electronico',
                'Usuario',
                'Cargo',
                'Area',
              ].map((field) => (
                <label key={field} className="space-y-2 text-sm font-medium text-[#0A2540] dark:text-white">
                  <span>{field}</span>
                  <input
                    className="w-full rounded-2xl border border-[#DCE7F3] bg-[#F8FAFC] px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                    placeholder={`Ingresar ${field.toLowerCase()}`}
                  />
                </label>
              ))}
            </form>
          </ResponsiveModalBody>

          <ResponsiveModalFooter>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-[#DCE7F3] px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white"
              >
                Guardar usuario
              </button>
            </div>
          </ResponsiveModalFooter>
        </ResponsiveModalPanel>
      </ResponsiveModalViewport>
    </>
  )
}

function BusinessDashboardScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Dashboard"
      description="Dashboard de negocio con metricas, paneles laterales y tabla de seguimiento. Se valida que tarjetas, listas y tabla convivan sin generar overflow en laptop o tablet."
      actions={
        <>
          <ActionButton
            icon={<BarChart3 className="h-4 w-4" />}
            label="Exportar metricas"
          />
          <ActionButton
            icon={<Sparkles className="h-4 w-4" />}
            label="Actualizar panel"
            emphasis="primary"
          />
        </>
      }
    >
      <MetricGrid items={smokeMetrics} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Surface
          title="Resumen ejecutivo"
          subtitle="La tabla cambia a cards en mobile y conserva contexto."
          testId="business-dashboard-report-surface"
        >
          <ResponsiveDataTable
            data={smokeReportRows}
            columns={smokeReportColumns}
            keyExtractor={(item) => item.id}
            tableMinWidthClassName="min-w-[760px]"
          />
        </Surface>

        <Surface
          title="Acciones prioritarias"
          subtitle="Stack lateral que debe caer debajo en viewports estrechos."
        >
          <div className="space-y-3">
            {[
              'Actualizar cohortes inactivas',
              'Revisar elementos marcados por soporte',
              'Invitar nuevos lideres comerciales',
            ].map((task) => (
              <div
                key={task}
                className="rounded-[22px] border border-[#DCE7F3] bg-[#F8FAFC] p-4 text-sm text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {task}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </ScenarioCanvas>
  )
}

function BusinessUnifiedPanelScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Unified Panel"
      description="Caso aislado de tabla responsive con metadata mobile. Se valida desktop table, card mode en mobile y ausencia de overflow lateral."
      actions={
        <ActionButton
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Vista consolidada"
        />
      }
    >
      <Surface
        title="Vista operativa por area"
        subtitle="Las etiquetas mobile se leen sin depender del header render context."
        testId="business-unified-surface"
      >
        <ResponsiveDataTable
          data={smokeReportRows}
          columns={smokeReportColumns}
          keyExtractor={(item) => item.id}
          tableMinWidthClassName="min-w-[760px]"
        />
      </Surface>
    </ScenarioCanvas>
  )
}

function BusinessUsersModalScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Business Users"
        description="Tabla real de analitica de usuarios con cards mobile y modal real de alta de usuario montado sobre la vista."
        actions={
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            label="Invitar usuario"
            emphasis="primary"
          />
        }
      >
        <Surface
          title="Adopcion por usuario"
          subtitle="La tabla se convierte en lista de cards debajo de md."
        >
          <ResponsiveDataTable
            data={smokeUserRows}
            columns={smokeUserColumns}
            keyExtractor={(item) => item.id}
            tableMinWidthClassName="min-w-[720px]"
          />
        </Surface>
      </ScenarioCanvas>

      <BusinessAddUserModal
        isOpen
        onClose={() => undefined}
        onSave={async () => undefined}
      />
    </>
  )
}

function InstructorCourseManagementScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Instructor Course Management"
      description="Vista para instructor con tabs desplazables, CTA full width en mobile y cards de modulo que apilan acciones correctamente."
      actions={
        <ActionButton
          icon={<Plus className="h-4 w-4" />}
          label="Agregar modulo"
          emphasis="primary"
        />
      }
    >
      <Surface
        title="Navegacion del curso"
        subtitle="El tabstrip debe mantenerse usable sin recortes."
      >
        <ManagementTabStrip />
      </Surface>

      <Surface
        title="Contenido asignado"
        subtitle="Simula el tab de modulos del instructor."
      >
        <ModulesGrid modules={smokeModules} accent="instructor" />
      </Surface>
    </ScenarioCanvas>
  )
}

function SelectOrganizationScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Select Organization"
      description="Selección de organización con tarjetas de alto contenido, badges de rol y CTA integrados. El grid debe degradar a una columna sin cortar textos largos."
    >
      <section className="grid gap-5 lg:grid-cols-2">
        {[
          {
            id: 'org-1',
            name: 'SofLIA Learning Enterprise Norteamerica',
            role: 'Administrador',
            slug: 'soflia-enterprise-north-america',
          },
          {
            id: 'org-2',
            name: 'Pulse Hub Commercial Enablement Studio',
            role: 'Miembro',
            slug: 'pulse-hub-commercial-enablement',
          },
        ].map((org) => (
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

function BusinessPublicScenario() {
  return (
    <ScenarioCanvas
      eyebrow="Responsive Smoke"
      title="Business Public"
      description="Landing publica con hero, tarjetas de beneficios y CTA. Se valida que la composicion fluya entre mobile, tablet y desktop sin romper el ritmo visual."
      actions={
        <>
          <ActionButton
            icon={<Sparkles className="h-4 w-4" />}
            label="Solicitar demo"
            emphasis="primary"
          />
          <ActionButton
            icon={<Users className="h-4 w-4" />}
            label="Ver casos de uso"
          />
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Surface
          title="Entrenamiento escalable para equipos"
          subtitle="Hero editorial con copy largo y espacio para CTA secundarios."
        >
          <div className="space-y-5">
            <p className="max-w-2xl text-base leading-7 text-[#526174] dark:text-white/65">
              Unificamos onboarding, entrenamiento continuo y acompanamiento con
              LIA para que cada lider comercial encuentre materiales,
              recomendaciones y seguimiento accionable sin friccion.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Rutas de aprendizaje por rol',
                'Analitica accionable en tiempo real',
                'Asistente LIA contextual por curso',
                'Automatizacion de seguimiento operativo',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-[#DCE7F3] bg-[#F8FAFC] p-4 text-sm font-medium text-[#0A2540] dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Surface>

        <Surface
          title="Indicadores clave"
          subtitle="Resumen compacto que debe caer debajo del hero en tablet."
        >
          <MetricGrid items={smokeMetrics.slice(0, 2)} />
        </Surface>
      </section>
    </ScenarioCanvas>
  )
}
