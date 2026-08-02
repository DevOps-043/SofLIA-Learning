export function getPlatformBanBlockReason(params: {
  actorId: string
  targetId: string
  targetIsPlatformAdmin: boolean
  banned: boolean
  activePlatformAdminCount?: number
}): string | null {
  if (!params.banned) return null

  if (params.actorId === params.targetId) {
    return 'No puedes banear tu propia cuenta mediante SofLIA.'
  }

  if (
    params.targetIsPlatformAdmin &&
    (params.activePlatformAdminCount ?? 0) <= 1
  ) {
    return 'No se puede banear al último superadministrador activo de la plataforma.'
  }

  return null
}
