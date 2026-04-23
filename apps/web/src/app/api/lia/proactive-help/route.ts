import { handleProactiveHelpRequest } from './proactive-help'

export async function POST(request: Request) {
  return handleProactiveHelpRequest(request)
}
