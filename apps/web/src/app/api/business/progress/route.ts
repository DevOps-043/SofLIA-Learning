import { handleBusinessProgressRequest } from './business-progress'

export async function GET() {
  return handleBusinessProgressRequest()
}
