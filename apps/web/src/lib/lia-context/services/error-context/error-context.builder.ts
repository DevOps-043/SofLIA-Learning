import type { RecentError, SimilarBug } from './error-context.types'

interface ErrorContextBuilderInput {
  currentPage?: string
  getOpenBugsForPage: (currentPage: string) => Promise<SimilarBug[]>
  getSimilarBugs: (currentPage: string, limit?: number) => Promise<SimilarBug[]>
  getUserRecentBugs: (userId: string, limit?: number) => Promise<SimilarBug[]>
  recentErrors?: RecentError[]
  userId?: string
}

function appendRecentErrors(sections: string[], recentErrors?: RecentError[]) {
  if (!recentErrors || recentErrors.length === 0) return

  sections.push('### Errores de consola recientes:')
  recentErrors.slice(0, 5).forEach((error, index) => {
    sections.push(`${index + 1}. **${error.type || 'Error'}:** ${error.message}`)
    if ('url' in error && error.url) {
      sections.push(`   - Pagina: ${error.url}`)
    }
    if (error.stack) {
      sections.push(`   - Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`)
    }
  })
  sections.push('')
}

function appendSimilarBugs(sections: string[], bugs: SimilarBug[]) {
  if (bugs.length === 0) return

  sections.push('### Bugs reportados en esta pagina:')
  bugs.forEach((bug, index) => {
    const estado = bug.estado || 'pendiente'
    const description = bug.descripcion.substring(0, 150) + (bug.descripcion.length > 150 ? '...' : '')
    sections.push(`${index + 1}. **${bug.titulo}** [${estado}]`)
    sections.push(`   - Categoria: ${bug.categoria}`)
    if (bug.prioridad) sections.push(`   - Prioridad: ${bug.prioridad}`)
    sections.push(`   - ${description}`)
  })
  sections.push('')
}

function appendOpenBugs(sections: string[], bugs: SimilarBug[]) {
  if (bugs.length === 0) return

  sections.push('### Bugs abiertos en esta pagina (sin resolver):')
  bugs.slice(0, 3).forEach((bug, index) => {
    sections.push(`${index + 1}. **${bug.titulo}** - ${bug.categoria}`)
    if (bug.notas_admin) {
      sections.push(`   - Nota del admin: ${bug.notas_admin.substring(0, 100)}`)
    }
  })
  sections.push('')
}

function appendUserBugs(sections: string[], bugs: SimilarBug[]) {
  if (bugs.length === 0) return

  sections.push('### Reportes recientes de este usuario:')
  bugs.forEach((bug, index) => {
    const estado = bug.estado || 'pendiente'
    sections.push(`${index + 1}. **${bug.titulo}** [${estado}] - ${bug.categoria}`)
  })
  sections.push('')
}

export async function buildErrorContext(input: ErrorContextBuilderInput): Promise<string> {
  const sections: string[] = []
  appendRecentErrors(sections, input.recentErrors)

  if (input.currentPage) {
    const [similarBugs, openBugs] = await Promise.all([
      input.getSimilarBugs(input.currentPage, 3),
      input.getOpenBugsForPage(input.currentPage),
    ])
    appendSimilarBugs(sections, similarBugs)
    appendOpenBugs(sections, openBugs)
  }

  if (input.userId) {
    appendUserBugs(sections, await input.getUserRecentBugs(input.userId, 2))
  }

  return sections.length === 0
    ? ''
    : `## CONTEXTO DE ERRORES Y BUGS\n\n${sections.join('\n')}`
}
