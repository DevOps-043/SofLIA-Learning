export const DEFAULT_RULE_SELECT = [
  'id',
  'organization_id',
  'learning_path_id',
  'scope_type',
  'node_id',
  'include_descendants',
  'status',
  'created_by',
  'created_at',
  'updated_at',
].join(', ')

export function getNodeDepth(path: string) {
  if (!path || path === 'root') return 0
  return path.split('.').filter(Boolean).length - 1
}

export function isMissingDefaultRulesInfrastructureError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    text.includes('organization_learning_path_default_rules') ||
    text.includes('assignment_source') ||
    text.includes('default_rule_id')
  )
}

export function throwMissingDefaultRulesMigrationError() {
  throw new Error('Ejecuta la migracion de rutas predeterminadas antes de usar esta funcion')
}

export function emptyBulkApplyResult() {
  return {
    rulesApplied: 0,
    targetUsers: 0,
    assigned: 0,
    existing: 0,
    reactivated: 0,
    skippedRevoked: 0,
  }
}
