import { getScheduledJobSecret } from '../../apps/web/src/lib/jobs/scheduled-job-config'
import { callJob } from '../lib/call-job'

export const handler = async () => callJob({
  pathname: '/api/internal/jobs/system-status-check',
  secret: getScheduledJobSecret(),
})
