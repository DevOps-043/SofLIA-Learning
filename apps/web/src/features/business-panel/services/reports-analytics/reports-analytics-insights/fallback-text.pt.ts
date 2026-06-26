export const FALLBACK_TEXT_PT = {
  // Section titles
  learningTitle: 'Aprendizagem e conclusao',
  adoptionTitle: 'Adocao de IA e notas',
  qualityTitle: 'Qualidade operacional e avaliacoes',

  // Metric labels
  metricProgress: 'Progresso e fechamento',
  metricSoflia: 'Adocao SofLIA',
  metricQuality: 'Qualidade operacional',
  metricAtRisk: 'Usuarios em risco',
  metricActiveLearners: 'Aprendizes ativos',
  metricCompliance: 'Conformidade org.',

  // Action plan section titles
  actionPlanTitle: 'Prioridades imediatas',
  actionPlanAtRiskTitle: 'Recuperacao e habitos de estudo',

  // Empty / no data messages
  noHierarchy: 'Nao ha hierarquia suficiente para comparar regioes, zonas ou areas.',
  noRiskCourse: 'Nenhum curso mostra sinais criticos no periodo filtrado.',
  noSegment: 'Nao ha segmentos suficientes para comparar qualidade neste periodo.',
  noAgeBandData: 'Os dados de faixa etaria nao tem informacao suficiente para este periodo.',

  // Recommendations (5)
  recommendSoflia: 'Reforca o uso do SofLIA nos segmentos com menor adocao e cruza com o progresso de curso.',
  recommendHierarchy: 'Use o quadro de honra por regiao, zona e area para identificar e replicar as praticas dos melhores times.',
  recommendQuality: 'Revise atividades com baixa qualidade e alto uso de ajuda para ajustar instrucoes, exemplos e criterios de avaliacao.',
  recommendPlanner: 'Ative lembretes de sessao para colaboradores com baixa aderencia ao planejador de estudos.',
  recommendInactive: 'Entre em contato diretamente com os colaboradores sem atividade recente com uma mensagem personalizada de retorno.',

  // Action plan items
  actionPlanSegment: 'Priorize segmentos com baixa qualidade ou baixo progresso antes de ampliar novas atribuicoes.',
  actionPlanCourse: 'Revise os cursos de maior risco operacional e cruze progresso, vencimentos e pedidos de ajuda.',
  actionPlanData: 'Complete os dados demograficos faltantes para melhorar a precisao estatistica da analise de RH.',
  actionPlanAtRiskUsers: 'Atribua acompanhamento personalizado a cada colaborador identificado com risco alto ou medio.',
  actionPlanPlannerLow: 'Realize sessoes de onboarding do planejador de estudos com os times de menor aderencia.',

  // Summary — richer, no "Leitura automatica" framing
  summary: (quality: number, progress: number, atRisk: number, compliance: number) =>
    `A organizacao registra um progresso medio de ${progress}% com uma taxa de conformidade de ${compliance}%. A qualidade operacional alcanca ${quality}%${atRisk > 0 ? ` e ${atRisk} colaboradores estao em risco e precisam de atencao prioritaria` : ''}.`,

  // Metric detail functions
  metricProgressDetail: (completion: number, days: number) =>
    `Conclusao ${completion}% e mediana de fechamento ${days} dias.`,
  metricSofliaDetail: (conversations: number, messages: number) =>
    `${conversations} conversas e ${messages} mensagens analisadas.`,
  metricQualityDetail: (quiz: number, activity: number, soflia: number) =>
    `Avaliacoes ${quiz}%, atividades ${activity}% e SofLIA ${soflia}%.`,
  metricAtRiskDetail: (count: number, rate: number) =>
    `${count} colaboradores (${rate}%) com vencimentos, inatividade ou progresso critico.`,
  metricActiveLearnerDetail: (count: number, rate: number) =>
    `${count} ativos representam ${rate}% dos colaboradores atribuidos.`,
  metricComplianceDetail: (rate: number) =>
    `${rate}% dos atribuidos sem sinais de risco no periodo analisado.`,

  // Finding point functions
  learningPoint: (completion: number, days: number) =>
    `A conclusao global e ${completion}% e o tempo medio de fechamento e ${days} dias.`,
  riskCourse: (title: string, overdue: number) =>
    `"${title}" concentra risco operacional com ${overdue} vencimentos acumulados.`,
  adoptionPoint: (soflia: number, notes: number) =>
    `A adocao do SofLIA e ${soflia}% e a adocao de notas e ${notes}%.`,
  bestRegion: (name: string, score: number) =>
    `${name} lidera o ranking regional com score ${score}%.`,
  qualityPoint: (quality: number, offTopic: number) =>
    `O score de qualidade e ${quality}% e a taxa de respostas fora do tema e ${offTopic}%.`,
  segmentPoint: (label: string, score: number) =>
    `A faixa "${label}" mostra um score de qualidade de ${score}% e precisa de revisao.`,

  // Risk functions (5)
  riskQuality: (help: number) =>
    `${help}% dos usuarios pedem ajuda em atividades, o que pode indicar instrucoes pouco claras ou criterios de avaliacao mal calibrados.`,
  riskData: (completion: number) =>
    `Apenas ${completion}% dos perfis demograficos estao completos. Dados faltantes reduzem a precisao da analise por segmento.`,
  riskInactive: (count: number) =>
    `${count} colaboradores com cursos atribuidos nao registraram atividade nos ultimos 14 dias e estao em risco de abandono.`,
  riskOverdue: (count: number) =>
    `${count} atribuicoes vencidas acumuladas no periodo, com impacto potencial na conformidade normativa.`,
  riskLowPlanner: (rate: number) =>
    `A aderencia ao planejador de estudos e de ${rate}%, abaixo do limite recomendado de 60%.`,

  // Urgent action text
  urgentAtRiskTitle: 'Colaboradores em risco sem acompanhamento ativo',
  urgentAtRiskDesc: (count: number) =>
    `${count} colaboradores apresentam vencimentos, inatividade prolongada ou progresso critico. Precisam de um plano de recuperacao e contato direto nos proximos dias.`,
  urgentAtRiskTimeline: '1-2 dias',
  urgentOverdueTitle: 'Vencimentos acumulados sem resolucao',
  urgentOverdueDesc: (count: number) =>
    `${count} atribuicoes vencidas detectadas no periodo. Priorize o contato com os responsaveis de area para acordar datas de recuperacao.`,
  urgentOverdueTimeline: '3-5 dias',

  // Segment highlight text
  bestRegionHighlight: (name: string, score: number) =>
    `${name} lidera o ranking regional com ${score}% de score. Documente suas praticas como modelo para o restante da organizacao.`,
  worstRegionHighlight: (name: string, score: number) =>
    `${name} tem o menor score regional (${score}%). Recomenda-se acompanhamento especializado e revisao da carga de trabalho.`,
  bestTeamHighlight: (name: string, score: number) =>
    `O time "${name}" e o melhor posicionado com ${score}% de score e pode servir como referencia de melhores praticas.`,
  worstTeamHighlight: (name: string, score: number) =>
    `O time "${name}" registra o menor score (${score}%) e requer intervencao direta do lider de area.`,

  // Kudos text
  kudoCompletionTitle: 'Taxa de conclusao destacada',
  kudoCompletionDesc: (rate: number) =>
    `Com uma taxa de conclusao de ${rate}%, a organizacao supera o limite saudavel de 70%. E uma conquista que vale reconhecer com os times.`,
  kudoQualityTitle: 'Qualidade operacional solida',
  kudoQualityDesc: (score: number) =>
    `Um score de qualidade de ${score}% reflete comprometimento genuino com o aprendizado e avaliacao rigorosa em toda a organizacao.`,
  kudoAdoptionTitle: 'Alta adocao do SofLIA',
  kudoAdoptionDesc: (rate: number) =>
    `${rate}% de adocao do SofLIA indica que os colaboradores usam ativamente a IA para reforcar e aprofundar seu aprendizado.`,
}
