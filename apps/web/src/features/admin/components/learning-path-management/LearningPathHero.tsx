import Link from 'next/link'
import type {
  LearningPath,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUserAssignmentSummary,
  LpTranslator,
} from './types'

interface LearningPathHeroProps {
  activeOrganizationAssignments: LearningPathOrganizationAssignmentSummary[]
  activeUserAssignments: LearningPathUserAssignmentSummary[]
  learningPath: LearningPath
  lp: LpTranslator
}

export function LearningPathHero({
  activeOrganizationAssignments,
  activeUserAssignments,
  learningPath,
  lp,
}: LearningPathHeroProps) {
  return (
    <header className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <Link href="/admin/learning-paths" className="inline-flex text-sm font-medium text-[var(--color-accent)]">
            {lp('backToList', 'Volver a rutas de aprendizaje')}
          </Link>
          <div className="space-y-2">
            <h1 className="break-words text-3xl font-bold sm:text-4xl">{learningPath.title}</h1>
            <p className="max-w-3xl break-words text-sm text-white/70">
              {learningPath.description || lp('noDescriptionYet', 'Sin descripcion todavia.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            <span>{lp('workshopsCount', '{{count}} talleres', { count: learningPath.item_count })}</span>
            <span>{lp('slugValue', 'Slug: {{slug}}', { slug: learningPath.slug || lp('autoSlug', 'auto') })}</span>
            <span>{learningPath.is_active ? lp('active', 'Activo') : lp('inactive', 'Inactivo')}</span>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-[30rem]">
          <HeroStat label={lp('statsWorkshops', 'Talleres')} value={learningPath.item_count} />
          <HeroStat label={lp('statsOrganizations', 'Empresas')} value={activeOrganizationAssignments.length} />
          <HeroStat label={lp('statsUsers', 'Usuarios')} value={activeUserAssignments.length} />
        </div>
      </div>
    </header>
  )
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}
