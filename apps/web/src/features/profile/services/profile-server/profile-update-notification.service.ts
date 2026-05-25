export async function notifyProfileUpdatedBestEffort(
  userId: string,
  changes: string[],
) {
  try {
    const { AutoNotificationsService } = await import(
      '../../../notifications/services/auto-notifications.service'
    )
    await AutoNotificationsService.notifyProfileUpdated(userId, changes, {
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Best effort: profile persistence already completed.
  }
}
