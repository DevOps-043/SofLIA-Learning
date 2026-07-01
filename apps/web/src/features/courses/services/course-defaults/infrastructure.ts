export const COURSE_DEFAULT_RULE_SELECT = [
  'id',
  'organization_id',
  'course_id',
  'scope_type',
  'node_id',
  'include_descendants',
  'status',
  'created_by',
  'created_at',
  'updated_at',
].join(', ')

export function isMissingCourseDefaultRulesInfrastructureError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    text.includes('organization_course_default_rules') ||
    text.includes('assignment_source') ||
    text.includes('default_rule_id')
  )
}

export function throwMissingCourseDefaultRulesMigrationError(): never {
  throw new Error('Ejecuta la migracion de cursos predeterminados antes de usar esta funcion')
}

export function emptyCourseAssignResult(targetUsers = 0) {
  return {
    targetUsers,
    assigned: 0,
    existing: 0,
  }
}
