import { handleBusinessUserDashboardRequest } from './dashboard-data'

export async function GET() {
  return handleBusinessUserDashboardRequest()
}
