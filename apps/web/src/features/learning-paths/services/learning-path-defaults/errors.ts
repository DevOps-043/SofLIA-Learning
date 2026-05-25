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
