export interface PaginationAuditViolation {
  column: number
  line: number
  reason: string
  snippet: string
}

const SELECT_CALL_PATTERN = /\.select\s*\(/g
const SELECT_CALL_DETECT_PATTERN = /\.select\s*\(/
const PAGINATION_CHAIN_PATTERN = /\.(range|limit)\s*\(/
const SINGULAR_CHAIN_PATTERN = /\.(single|maybeSingle)\s*(?:<[^>]+>)?\s*\(/
const MUTATION_CHAIN_PATTERN = /\.(insert|update|upsert|delete)\s*\(/

export function auditSupabasePaginationSource(
  source: string,
): PaginationAuditViolation[] {
  const violations: PaginationAuditViolation[] = []
  let match: RegExpExecArray | null

  while ((match = SELECT_CALL_PATTERN.exec(source)) !== null) {
    const statementStart = findChainStart(source, match.index)
    const statementEnd = findStatementEnd(source, match.index)
    const statement = source.slice(statementStart, statementEnd)

    if (!isSupabaseSelectChain(statement)) continue
    if (isAcceptedUnpaginatedSelect(statement)) continue

    const position = getLineColumn(source, match.index)
    violations.push({
      ...position,
      reason: 'Supabase array select in app/api must use .range() or .limit().',
      snippet: compactSnippet(statement),
    })
  }

  return violations
}

function isSupabaseSelectChain(statement: string): boolean {
  return /\.from\s*\(/.test(statement) && SELECT_CALL_DETECT_PATTERN.test(statement)
}

function isAcceptedUnpaginatedSelect(statement: string): boolean {
  return (
    PAGINATION_CHAIN_PATTERN.test(statement) ||
    SINGULAR_CHAIN_PATTERN.test(statement) ||
    MUTATION_CHAIN_PATTERN.test(statement) ||
    /head\s*:\s*true/.test(statement)
  )
}

function findChainStart(source: string, index: number): number {
  const fromIndex = source.lastIndexOf('.from', index)
  const previousSemicolon = source.lastIndexOf(';', index)
  const previousBlankLine = source.lastIndexOf('\n\n', index)
  const boundary = Math.max(previousSemicolon, previousBlankLine)
  const startIndex = fromIndex > boundary ? fromIndex : index
  const previousLine = source.lastIndexOf('\n', startIndex)
  return previousLine === -1 ? 0 : previousLine + 1
}

function findStatementEnd(source: string, index: number): number {
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (let i = index; i < source.length; i += 1) {
    const char = source[i]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === ';') {
      return i + 1
    }

    if (char === '\n' && source[i + 1] === '\n') {
      return i
    }
  }

  return source.length
}

function getLineColumn(
  source: string,
  index: number,
): Pick<PaginationAuditViolation, 'column' | 'line'> {
  const before = source.slice(0, index)
  const lines = before.split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

function compactSnippet(statement: string): string {
  return statement
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 220)
}
