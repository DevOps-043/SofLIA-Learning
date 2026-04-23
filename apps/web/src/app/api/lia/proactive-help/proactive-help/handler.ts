import { NextResponse } from 'next/server'
import { generateMockProactiveResponse } from './fallback-responses'
import { generateOpenAIProactiveResponse } from './openai-response'
import { buildProactivePrompt } from './prompt-builder'
import { readProactiveHelpRequest } from './request-validation'
import { analyzeProactiveSession } from './session-context'
import type { ProactiveHelpResponse } from './types'

export async function handleProactiveHelpRequest(request: Request) {
  try {
    const body = await readProactiveHelpRequest(request)
    if (body instanceof NextResponse) return body

    const sessionContext = analyzeProactiveSession(body)
    const prompt = buildProactivePrompt(
      body.analysis,
      sessionContext,
      body.workshopId,
      body.activityId,
    )
    const aiResponse =
      (await generateOpenAIProactiveResponse(body, prompt)) ||
      generateMockProactiveResponse(body.analysis, sessionContext)

    return NextResponse.json<ProactiveHelpResponse>({
      success: true,
      response: aiResponse.response,
      suggestions: aiResponse.suggestions,
      resources: aiResponse.resources?.length ? aiResponse.resources : undefined,
      nextSteps: aiResponse.nextSteps?.length ? aiResponse.nextSteps : undefined,
    })
  } catch (error) {
    console.error('❌ Error en /api/lia/proactive-help:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
