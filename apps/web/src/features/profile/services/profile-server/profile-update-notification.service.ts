export async function notifyProfileUpdatedBestEffort(
  userId: string,
  changes: string[],
  organizationId?: string | null,
) {
  try {
    const { AutoNotificationsService } = await import(
      '../../../notifications/services/auto-notifications.service'
    )
    await AutoNotificationsService.notifyProfileUpdated(
      userId,
      changes,
      {
        organization_id: organizationId || undefined,
        timestamp: new Date().toISOString(),
      },
      organizationId,
    )
  } catch {
    // Best effort: profile persistence already completed.
  }
}
