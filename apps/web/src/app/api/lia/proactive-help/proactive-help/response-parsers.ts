export function extractSuggestions(response: string) {
  const suggestions: string[] = []
  const bulletPattern = /[•\-*]\s*(.+)/g
  const numberedPattern = /\d+\.\s*(.+)/g

  collectMatches(response, bulletPattern, suggestions)
  collectMatches(response, numberedPattern, suggestions)

  return suggestions.slice(0, 5)
}

export function extractNextSteps(response: string) {
  const nextStepsSection = response.match(/pr[oó]ximos?\s+pasos?:(.+?)(?:\n\n|$)/is)
  if (!nextStepsSection) return []

  const steps: string[] = []
  collectMatches(nextStepsSection[1], /[•\-*]\s*(.+)/g, steps)
  return steps
}

function collectMatches(source: string, pattern: RegExp, output: string[]) {
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    output.push(match[1].trim())
  }
}
