import { fetchAdminUserStatsRows } from './admin-users.repository.stats-queries'
import { mapAdminUserStatsRows } from './admin-users.repository.stats-map'

export async function getStats() {
  const activeSinceIso = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const rows = await fetchAdminUserStatsRows(activeSinceIso)
  return mapAdminUserStatsRows(rows)
}
