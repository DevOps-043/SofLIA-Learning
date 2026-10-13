/** Shared by scheduled functions and their authenticated HTTP endpoints. */
export function getScheduledJobSecret(): string | undefined {
  // Queue deployments retain their dedicated credential. Sites that only
  // configure the scheduler can use the existing cron credential.
  return process.env.QUEUE_INTERNAL_SECRET || process.env.CRON_SECRET
}
