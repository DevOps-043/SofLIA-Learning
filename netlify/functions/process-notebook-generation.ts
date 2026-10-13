import { callJob } from '../lib/call-job'

// Dispatch only: generation runs beyond the scheduled function's lifetime.
export const handler = async () => callJob({
  pathname: '/.netlify/functions/process-notebook-generation-background',
  secret: process.env.CRON_SECRET,
  timeoutMs: 10_000,
})
