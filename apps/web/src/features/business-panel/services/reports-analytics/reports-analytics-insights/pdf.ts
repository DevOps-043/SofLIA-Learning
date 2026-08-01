import type { jsPDF as JsPdfDocument } from "jspdf";

import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsCourseRow,
  ReportsAnalyticsDataset,
  ReportsAnalyticsHierarchyRankingRow,
  ReportsAnalyticsLocale,
  ReportsAnalyticsPriorityUser,
  ReportsAnalyticsPriorityUserRiskCause,
  ReportsAnalyticsSegmentRow,
  ReportsAnalyticsTrendPoint,
} from "../../../types/reports-analytics.types";
import { reconcileReportsAnalyticsInsights } from "./integrity";

type Rgb = readonly [number, number, number];
type CellAlign = "left" | "center" | "right";

type TableColumn = {
  label: string;
  width: number;
  align?: CellAlign;
};

type PdfCopy = {
  title: string;
  kicker: string;
  period: string;
  generated: string;
  confidential: string;
  continuation: string;
  jobTitle: string;
  age: string;
  gender: string;
  role: string;
  executiveSummary: string;
  keyIndicators: string;
  performance: string;
  learningEvolution: string;
  learningStatus: string;
  adoptionAndQuality: string;
  coursePortfolio: string;
  segments: string;
  hierarchy: string;
  riskAndAction: string;
  priorityUsers: string;
  findings: string;
  recommendations: string;
  actionPlan: string;
  dataQuality: string;
  reportScope: string;
  indicatorGuide: string;
  coveragePeriod: string;
  coursesAnalyzed: string;
  peopleAnalyzed: string;
  evidenceAnalyzed: string;
  methodologyPoints: string[];
  demographicProfilesComplete: string;
  profilesRequireInformation: string;
  users: string;
  activeLearners: string;
  progress: string;
  quality: string;
  adoption: string;
  evidence: string;
  sofliaAdoption: string;
  validatedSubmissions: string;
  riskSignals: string;
  withoutRiskSignals: string;
  assessments: string;
  inTopicMessages: string;
  notesWithContent: string;
  inProgress: string;
  notStarted: string;
  completion: string;
  assigned: string;
  assignments: string;
  completed: string;
  overdue: string;
  course: string;
  segment: string;
  rank: string;
  name: string;
  risk: string;
  cause: string;
  lastActivity: string;
  lastActivityShort: string;
  noData: string;
  page: string;
  of: string;
  sourceNote: string;
  high: string;
  medium: string;
  low: string;
  notSpecified: string;
};

const COLORS = {
  navy: [10, 37, 64] as Rgb,
  navySoft: [17, 53, 82] as Rgb,
  accent: [0, 212, 179] as Rgb,
  accentDark: [0, 153, 135] as Rgb,
  ink: [15, 23, 42] as Rgb,
  muted: [100, 116, 139] as Rgb,
  subtle: [148, 163, 184] as Rgb,
  line: [226, 232, 240] as Rgb,
  surface: [248, 250, 252] as Rgb,
  surfaceAccent: [237, 252, 249] as Rgb,
  white: [255, 255, 255] as Rgb,
  success: [16, 185, 129] as Rgb,
  warning: [245, 158, 11] as Rgb,
  danger: [239, 68, 68] as Rgb,
  info: [59, 130, 246] as Rgb,
} as const;

const PAGE = {
  margin: 42,
  top: 54,
  bottom: 48,
  contentWidth: 511,
} as const;

const COPY: Record<ReportsAnalyticsLocale, PdfCopy> = {
  es: {
    title: "Reporte ejecutivo de aprendizaje",
    kicker: "INTELIGENCIA ORGANIZACIONAL · SOFLIA",
    period: "Periodo",
    generated: "Actualizado",
    confidential: "Documento ejecutivo · Uso interno",
    continuation: "CONTINUACIÓN",
    jobTitle: "Puesto",
    age: "Edad",
    gender: "Género",
    role: "Rol",
    executiveSummary: "Resumen ejecutivo",
    keyIndicators: "Indicadores clave",
    performance: "Pulso de desempeño",
    learningEvolution: "Evolución del aprendizaje",
    learningStatus: "Estado de las asignaciones",
    adoptionAndQuality: "Adopción y evidencia evaluada",
    coursePortfolio: "Desempeño por curso",
    segments: "Segmentos a observar",
    hierarchy: "Ranking organizacional",
    riskAndAction: "Riesgos y plan de acción",
    priorityUsers: "Colaboradores que requieren atención",
    findings: "Hallazgos de SofLIA",
    recommendations: "Recomendaciones",
    actionPlan: "Plan de acción",
    dataQuality: "Calidad de datos",
    reportScope: "Alcance del informe",
    indicatorGuide: "Cómo leer los indicadores",
    coveragePeriod: "Cobertura",
    coursesAnalyzed: "Cursos analizados",
    peopleAnalyzed: "Personas analizadas",
    evidenceAnalyzed: "Evidencias analizadas",
    methodologyPoints: [
      "Progreso: promedio de avance registrado en las asignaciones incluidas.",
      "Evidencia evaluada: promedio de calificaciones y resultados de entregas registradas.",
      "Adopción: proporción de personas que utilizaron SofLIA durante el periodo.",
      "Riesgo: regla de seguimiento que combina vencimientos, inactividad y bajo avance; no es una sanción.",
    ],
    demographicProfilesComplete: "PERFILES DEMOGRÁFICOS COMPLETOS",
    profilesRequireInformation: "perfiles requieren completar información.",
    users: "Usuarios",
    activeLearners: "Usuarios con actividad",
    progress: "Progreso",
    quality: "Evidencia evaluada",
    adoption: "ADOPCIÓN",
    evidence: "EVIDENCIA",
    sofliaAdoption: "Adopción SofLIA",
    validatedSubmissions: "Entregas validadas",
    riskSignals: "Señales de riesgo",
    withoutRiskSignals: "Sin señales de riesgo",
    assessments: "Evaluaciones",
    inTopicMessages: "Mensajes en tema",
    notesWithContent: "Notas con contenido",
    inProgress: "En progreso",
    notStarted: "No iniciados",
    completion: "Finalización",
    assigned: "Asignados",
    assignments: "Asignaciones",
    completed: "Completados",
    overdue: "Vencidos",
    course: "Curso",
    segment: "Segmento",
    rank: "#",
    name: "Nombre",
    risk: "Riesgo",
    cause: "Causa",
    lastActivity: "Última actividad",
    lastActivityShort: "Últ. actividad",
    noData: "Sin datos suficientes para este periodo.",
    page: "Página",
    of: "de",
    sourceNote:
      "Fuente: actividad registrada en SofLIA. Los porcentajes se calculan sobre el ámbito filtrado.",
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    notSpecified: "No especificado",
  },
  en: {
    title: "Executive learning report",
    kicker: "ORGANIZATIONAL INTELLIGENCE · SOFLIA",
    period: "Period",
    generated: "Updated",
    confidential: "Executive document · Internal use",
    continuation: "CONTINUED",
    jobTitle: "Job title",
    age: "Age",
    gender: "Gender",
    role: "Role",
    executiveSummary: "Executive summary",
    keyIndicators: "Key indicators",
    performance: "Performance pulse",
    learningEvolution: "Learning evolution",
    learningStatus: "Assignment status",
    adoptionAndQuality: "Adoption and evaluated evidence",
    coursePortfolio: "Course performance",
    segments: "Segments to watch",
    hierarchy: "Organizational ranking",
    riskAndAction: "Risks and action plan",
    priorityUsers: "Learners requiring attention",
    findings: "SofLIA findings",
    recommendations: "Recommendations",
    actionPlan: "Action plan",
    dataQuality: "Data quality",
    reportScope: "Report scope",
    indicatorGuide: "How to read the indicators",
    coveragePeriod: "Coverage",
    coursesAnalyzed: "Courses analyzed",
    peopleAnalyzed: "People analyzed",
    evidenceAnalyzed: "Evidence analyzed",
    methodologyPoints: [
      "Progress: average recorded completion across the assignments in scope.",
      "Evaluated evidence: average of recorded assessment scores and submission outcomes.",
      "Adoption: share of people who used SofLIA during the selected period.",
      "Risk: a follow-up rule combining overdue work, inactivity, and low progress; it is not a sanction.",
    ],
    demographicProfilesComplete: "COMPLETE DEMOGRAPHIC PROFILES",
    profilesRequireInformation: "profiles require additional information.",
    users: "Users",
    activeLearners: "Users with activity",
    progress: "Progress",
    quality: "Evaluated evidence",
    adoption: "ADOPTION",
    evidence: "EVIDENCE",
    sofliaAdoption: "SofLIA adoption",
    validatedSubmissions: "Validated submissions",
    riskSignals: "Risk signals",
    withoutRiskSignals: "Without risk signals",
    assessments: "Assessments",
    inTopicMessages: "On-topic messages",
    notesWithContent: "Notes with content",
    inProgress: "In progress",
    notStarted: "Not started",
    completion: "Completion",
    assigned: "Assigned",
    assignments: "Assignments",
    completed: "Completed",
    overdue: "Overdue",
    course: "Course",
    segment: "Segment",
    rank: "#",
    name: "Name",
    risk: "Risk",
    cause: "Cause",
    lastActivity: "Last activity",
    lastActivityShort: "Last active",
    noData: "Not enough data for this period.",
    page: "Page",
    of: "of",
    sourceNote:
      "Source: activity recorded in SofLIA. Percentages use the selected scope.",
    high: "High",
    medium: "Medium",
    low: "Low",
    notSpecified: "Not specified",
  },
  pt: {
    title: "Relatório executivo de aprendizagem",
    kicker: "INTELIGÊNCIA ORGANIZACIONAL · SOFLIA",
    period: "Período",
    generated: "Atualizado",
    confidential: "Documento executivo · Uso interno",
    continuation: "CONTINUAÇÃO",
    jobTitle: "Cargo",
    age: "Idade",
    gender: "Gênero",
    role: "Função",
    executiveSummary: "Resumo executivo",
    keyIndicators: "Indicadores-chave",
    performance: "Pulso de desempenho",
    learningEvolution: "Evolução da aprendizagem",
    learningStatus: "Estado das atribuições",
    adoptionAndQuality: "Adoção e evidências avaliadas",
    coursePortfolio: "Desempenho por curso",
    segments: "Segmentos a observar",
    hierarchy: "Ranking organizacional",
    riskAndAction: "Riscos e plano de ação",
    priorityUsers: "Colaboradores que precisam de atenção",
    findings: "Descobertas da SofLIA",
    recommendations: "Recomendações",
    actionPlan: "Plano de ação",
    dataQuality: "Qualidade dos dados",
    reportScope: "Escopo do relatório",
    indicatorGuide: "Como ler os indicadores",
    coveragePeriod: "Cobertura",
    coursesAnalyzed: "Cursos analisados",
    peopleAnalyzed: "Pessoas analisadas",
    evidenceAnalyzed: "Evidências analisadas",
    methodologyPoints: [
      "Progresso: média de avanço registrada nas atribuições incluídas.",
      "Evidências avaliadas: média de notas e resultados de entregas registradas.",
      "Adoção: proporção de pessoas que utilizaram a SofLIA durante o período.",
      "Risco: regra de acompanhamento que combina vencimentos, inatividade e baixo avanço; não é sanção.",
    ],
    demographicProfilesComplete: "PERFIS DEMOGRÁFICOS COMPLETOS",
    profilesRequireInformation: "perfis precisam completar informações.",
    users: "Usuários",
    activeLearners: "Usuários com atividade",
    progress: "Progresso",
    quality: "Evidências avaliadas",
    adoption: "ADOÇÃO",
    evidence: "EVIDÊNCIA",
    sofliaAdoption: "Adoção SofLIA",
    validatedSubmissions: "Entregas validadas",
    riskSignals: "Sinais de risco",
    withoutRiskSignals: "Sem sinais de risco",
    assessments: "Avaliações",
    inTopicMessages: "Mensagens no tema",
    notesWithContent: "Notas com conteúdo",
    inProgress: "Em andamento",
    notStarted: "Não iniciados",
    completion: "Conclusão",
    assigned: "Atribuídos",
    assignments: "Atribuições",
    completed: "Concluídos",
    overdue: "Vencidos",
    course: "Curso",
    segment: "Segmento",
    rank: "#",
    name: "Nome",
    risk: "Risco",
    cause: "Causa",
    lastActivity: "Última atividade",
    lastActivityShort: "Últ. atividade",
    noData: "Dados insuficientes para este período.",
    page: "Página",
    of: "de",
    sourceNote:
      "Fonte: atividade registrada na SofLIA. As porcentagens usam o escopo selecionado.",
    high: "Alto",
    medium: "Médio",
    low: "Baixo",
    notSpecified: "Não especificado",
  },
};

class PremiumAnalyticsPdf {
  private readonly pdf: JsPdfDocument;
  private readonly dataset: ReportsAnalyticsDataset;
  private readonly insights: ReportsAnalyticsAiInsights;
  private readonly locale: ReportsAnalyticsLocale;
  private readonly copy: PdfCopy;
  private readonly width: number;
  private readonly height: number;
  private y: number = PAGE.top;

  constructor(
    pdf: JsPdfDocument,
    dataset: ReportsAnalyticsDataset,
    insights: ReportsAnalyticsAiInsights,
    locale: ReportsAnalyticsLocale,
  ) {
    this.pdf = pdf;
    this.dataset = dataset;
    // Recompone los hechos desde el mismo dataset de tablas y graficas, incluso
    // si el generador recibe un analisis antiguo o no reconciliado.
    this.insights = reconcileReportsAnalyticsInsights(dataset, insights, locale);
    this.locale = locale;
    this.copy = COPY[locale] ?? COPY.es;
    this.width = pdf.internal.pageSize.getWidth();
    this.height = pdf.internal.pageSize.getHeight();
  }

  render() {
    this.renderCover();
    this.renderLearningAndAdoption();
    this.renderCoursesAndSegments();
    this.renderRisksAndActions();
    this.addFooters();
  }

  private renderCover() {
    const { pdf, copy, dataset } = this;
    this.drawHero();

    this.y = 206;
    this.sectionTitle(copy.executiveSummary);
    this.callout(
      this.insights.summary,
      COLORS.surfaceAccent,
      COLORS.accentDark,
    );

    this.sectionTitle(copy.keyIndicators, 16);
    const fallbackMetrics = [
      {
        label: copy.progress,
        value: percent(dataset.overview.averageProgress),
        detail: `${dataset.learning.completedCourses}/${dataset.learning.assignedCourses} ${copy.assignments.toLowerCase()} · ${percent(dataset.overview.completionRate)}`,
      },
      {
        label: copy.activeLearners,
        value: String(dataset.overview.activeLearners),
        detail: `${percent(dataset.overview.activeLearnerRate)} - ${dataset.overview.assignedUsersCount} ${copy.assigned.toLowerCase()}`,
      },
      {
        label: copy.sofliaAdoption,
        value: percent(dataset.overview.sofliaAdoptionRate),
        detail: `${dataset.soflia.totalConversations} conv. - ${dataset.soflia.totalMessages} msg.`,
      },
      {
        label: copy.quality,
        value: percent(dataset.quality.overallScore),
        detail: `${dataset.quality.evidenceCount} evidencias`,
      },
      {
        label: copy.validatedSubmissions,
        value: percent(dataset.overview.activityCompletionRate),
        detail: `${dataset.activities.completedActivities}/${dataset.activities.totalActivities}`,
      },
      {
        label: copy.riskSignals,
        value: String(dataset.overview.atRiskUsersCount),
        detail: `${percent(dataset.overview.atRiskRate)} - ${dataset.overview.assignedUsersCount} ${copy.assigned.toLowerCase()}`,
      },
    ];
    this.metricGrid(fallbackMetrics);

    this.sectionTitle(copy.performance, 17);
    this.progressRows([
      { label: copy.progress, value: dataset.overview.averageProgress },
      { label: copy.completion, value: dataset.overview.completionRate },
      { label: copy.sofliaAdoption, value: dataset.overview.sofliaAdoptionRate },
      { label: copy.quality, value: dataset.quality.overallScore },
      { label: copy.withoutRiskSignals, value: dataset.overview.complianceRate },
    ]);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(copy.sourceNote, PAGE.margin, this.height - 63);
  }

  private renderLearningAndAdoption() {
    this.newPage(this.copy.learningEvolution, "02");
    this.lineChart(
      this.dataset.learning.completionsTrend.length
        ? this.dataset.learning.completionsTrend
        : this.dataset.learning.completionsByMonth,
      this.copy.completed,
    );

    this.ensureSpace(186);
    this.sectionTitle(this.copy.learningStatus, 18);
    this.statusDistribution();

    this.ensureSpace(245);
    this.sectionTitle(this.copy.adoptionAndQuality, 18);
    this.twoColumnPanels();
  }

  private renderCoursesAndSegments() {
    this.newPage(this.copy.coursePortfolio, "03");
    this.courseChart(this.dataset.courses.slice(0, 7));

    this.ensureSpace(230);
    this.table(
      [
        { label: this.copy.course, width: 235 },
        { label: this.copy.assigned, width: 62, align: "right" },
        { label: this.copy.completed, width: 70, align: "right" },
        { label: this.copy.progress, width: 70, align: "right" },
        { label: this.copy.overdue, width: 60, align: "right" },
      ],
      this.dataset.courses
        .slice(0, 10)
        .map((course) => [
          course.courseTitle,
          course.assignedUsers,
          course.completedUsers,
          percent(course.averageProgress),
          course.overdueAssignments,
        ]),
    );

    this.ensureSpace(220);
    this.sectionTitle(this.copy.segments, 18);
    const segments = this.getWatchSegments();
    this.table(
      [
        { label: this.copy.segment, width: 225 },
        { label: this.copy.users, width: 55, align: "right" },
        { label: this.copy.progress, width: 74, align: "right" },
        { label: this.copy.completion, width: 74, align: "right" },
        { label: this.copy.evidence, width: 83, align: "right" },
      ],
      segments
        .slice(0, 10)
        .map((segment) => [
          segment.label || this.copy.notSpecified,
          segment.users,
          percent(segment.averageProgress),
          percent(segment.completionRate),
          percent(segment.qualityScore),
        ]),
    );

    const hierarchy = this.getHierarchyRows();
    if (hierarchy.length) {
      this.ensureSpace(190);
      this.sectionTitle(this.copy.hierarchy, 18);
      this.table(
        [
          { label: this.copy.rank, width: 34, align: "center" },
          { label: this.copy.name, width: 245 },
          { label: this.copy.users, width: 58, align: "right" },
          { label: this.copy.progress, width: 78, align: "right" },
          { label: "Score", width: 74, align: "right" },
        ],
        hierarchy
          .slice(0, 8)
          .map((row, index) => [
            index + 1,
            row.name,
            row.users,
            percent(row.averageProgress),
            percent(row.rankScore),
          ]),
      );
    }
  }

  private renderRisksAndActions() {
    this.newPage(this.copy.riskAndAction, "04");

    if (this.insights.urgentActions?.length) {
      this.sectionTitle("Prioridades inmediatas", 18);
      this.urgentActions();
    }

    this.ensureSpace(190);
    this.sectionTitle(this.copy.priorityUsers, 18);
    this.priorityUsersTable(this.dataset.priorityUsers.slice(0, 10));

    this.ensureSpace(180);
    this.sectionTitle(this.copy.findings, 18);
    if (this.insights.findings.length) {
      this.insights.findings.forEach((section) => {
        this.ensureSpace(60);
        this.subheading(section.title);
        this.bullets(section.points);
      });
    } else {
      this.emptyState();
    }

    this.ensureSpace(180);
    this.sectionTitle(this.copy.recommendations, 18);
    this.bullets(this.insights.recommendations);

    if (this.insights.actionPlan?.length) {
      this.ensureSpace(180);
      this.sectionTitle(this.copy.actionPlan, 18);
      this.insights.actionPlan.forEach((section) => {
        this.ensureSpace(60);
        this.subheading(section.title);
        this.bullets(section.points);
      });
    }

    this.ensureSpace(150);
    this.sectionTitle(this.copy.dataQuality, 18);
    this.dataQualityPanel();
    this.reportScopeAndMethodology();
  }

  private drawHero() {
    const { pdf, copy, dataset } = this;
    pdf.setFillColor(...COLORS.navy);
    pdf.roundedRect(
      PAGE.margin,
      PAGE.margin,
      PAGE.contentWidth,
      136,
      18,
      18,
      "F",
    );

    pdf.setDrawColor(...COLORS.accent);
    pdf.setLineWidth(1.2);
    pdf.line(PAGE.margin + 28, 70, PAGE.margin + 54, 70);
    pdf.setTextColor(...COLORS.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text(copy.kicker, PAGE.margin + 64, 73);

    // Times is the PDF-safe display equivalent of Newsreader; Helvetica mirrors Inter Tight/IBM Plex Sans.
    pdf.setFont("times", "normal");
    pdf.setFontSize(28);
    pdf.setTextColor(...COLORS.white);
    pdf.text(copy.title, PAGE.margin + 28, 111);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(211, 224, 234);
    pdf.text(
      `${copy.period}: ${formatDate(dataset.period.from, this.locale)} — ${formatDate(dataset.period.to, this.locale)}`,
      PAGE.margin + 28,
      140,
    );
    pdf.text(
      `${copy.generated}: ${formatDateTime(this.insights.generatedAt, this.locale)}`,
      PAGE.margin + 28,
      156,
    );

    pdf.setFillColor(...COLORS.accent);
    pdf.circle(this.width - PAGE.margin - 28, 66, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(211, 224, 234);
    pdf.text(
      copy.confidential.toUpperCase(),
      this.width - PAGE.margin - 42,
      158,
      { align: "right" },
    );
  }

  private newPage(title: string, index: string) {
    const { pdf } = this;
    pdf.addPage();
    this.y = PAGE.top;
    pdf.setTextColor(...COLORS.accentDark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(`${index} · SOFLIA`, PAGE.margin, this.y);
    pdf.setFont("times", "normal");
    pdf.setFontSize(25);
    pdf.setTextColor(...COLORS.navy);
    pdf.text(title, PAGE.margin, this.y + 30);
    pdf.setDrawColor(...COLORS.line);
    pdf.setLineWidth(0.7);
    pdf.line(PAGE.margin, this.y + 48, this.width - PAGE.margin, this.y + 48);
    this.y += 72;
  }

  private sectionTitle(title: string, gap = 13) {
    this.ensureSpace(42);
    this.pdf.setFont("times", "normal");
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...COLORS.navy);
    this.pdf.text(title, PAGE.margin, this.y);
    this.pdf.setDrawColor(...COLORS.accent);
    this.pdf.setLineWidth(1.5);
    this.pdf.line(PAGE.margin, this.y + 8, PAGE.margin + 32, this.y + 8);
    this.y += gap + 15;
  }

  private subheading(title: string) {
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...COLORS.ink);
    const lines = this.pdf.splitTextToSize(
      title,
      PAGE.contentWidth - 20,
    ) as string[];
    this.pdf.text(lines, PAGE.margin, this.y);
    this.y += lines.length * 12 + 5;
  }

  private callout(text: string, fill: Rgb, accent: Rgb) {
    const { pdf } = this;
    const lines = pdf.splitTextToSize(
      text || this.copy.noData,
      PAGE.contentWidth - 44,
    ) as string[];
    const height = Math.max(62, lines.length * 12 + 28);
    this.ensureSpace(height);
    pdf.setFillColor(...fill);
    pdf.roundedRect(
      PAGE.margin,
      this.y,
      PAGE.contentWidth,
      height,
      12,
      12,
      "F",
    );
    pdf.setFillColor(...accent);
    pdf.roundedRect(PAGE.margin, this.y, 4, height, 2, 2, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.ink);
    pdf.text(lines, PAGE.margin + 24, this.y + 23);
    this.y += height + 18;
  }

  private metricGrid(
    metrics: Array<{ label: string; value: string | number; detail?: string }>,
  ) {
    const { pdf } = this;
    const gap = 10;
    const columns = 3;
    const width = (PAGE.contentWidth - gap * (columns - 1)) / columns;
    const height = 62;
    metrics.forEach((metric, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = PAGE.margin + column * (width + gap);
      const y = this.y + row * (height + gap);
      pdf.setFillColor(...COLORS.surface);
      pdf.setDrawColor(...COLORS.line);
      pdf.setLineWidth(0.7);
      pdf.roundedRect(x, y, width, height, 10, 10, "FD");
      pdf.setFillColor(...COLORS.accent);
      pdf.circle(x + 16, y + 16, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.8);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(cleanText(metric.label).toUpperCase(), x + 26, y + 18);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...COLORS.navy);
      pdf.text(cleanText(metric.value), x + 16, y + 40);
      if (metric.detail) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.7);
        pdf.setTextColor(...COLORS.muted);
        pdf.text(truncate(cleanText(metric.detail), 40), x + 16, y + 53);
      }
    });
    this.y += Math.ceil(metrics.length / columns) * (height + gap) + 2;
  }

  private progressRows(items: Array<{ label: string; value: number }>) {
    const { pdf } = this;
    items.forEach((item) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...COLORS.ink);
      pdf.text(item.label, PAGE.margin, this.y);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text(percent(item.value), PAGE.margin + PAGE.contentWidth, this.y, {
        align: "right",
      });
      this.drawBar(PAGE.margin, this.y + 8, PAGE.contentWidth, 6, item.value);
      this.y += 25;
    });
  }

  private lineChart(points: ReportsAnalyticsTrendPoint[], label: string) {
    const { pdf } = this;
    const x = PAGE.margin;
    const y = this.y;
    const width = PAGE.contentWidth;
    const height = 196;
    pdf.setFillColor(...COLORS.surface);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(x, y, width, height, 14, 14, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.ink);
    pdf.text(label, x + 20, y + 24);

    if (!points.length) {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...COLORS.muted);
      pdf.text(this.copy.noData, x + width / 2, y + height / 2, {
        align: "center",
      });
      this.y += height + 20;
      return;
    }

    const chart = {
      x: x + 38,
      y: y + 44,
      width: width - 64,
      height: height - 78,
    };
    const values = points.map((point) => point.value);
    const max = Math.max(1, ...values);
    pdf.setDrawColor(...COLORS.line);
    pdf.setLineWidth(0.5);
    for (let step = 0; step <= 4; step += 1) {
      const gridY = chart.y + (chart.height / 4) * step;
      pdf.line(chart.x, gridY, chart.x + chart.width, gridY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...COLORS.subtle);
      pdf.text(
        formatNumber(max - (max / 4) * step, max < 4 ? 1 : 0),
        chart.x - 8,
        gridY + 2,
        { align: "right" },
      );
    }

    const divisor = Math.max(1, points.length - 1);
    const coords = points.map((point, index) => ({
      x: chart.x + (chart.width / divisor) * index,
      y: chart.y + chart.height - (point.value / max) * chart.height,
    }));
    pdf.setDrawColor(...COLORS.accentDark);
    pdf.setLineWidth(2);
    coords.forEach((point, index) => {
      if (index)
        pdf.line(coords[index - 1].x, coords[index - 1].y, point.x, point.y);
      pdf.setFillColor(...COLORS.accent);
      pdf.circle(point.x, point.y, 3, "F");
    });
    const every = Math.max(1, Math.ceil(points.length / 6));
    points.forEach((point, index) => {
      if (index % every !== 0 && index !== points.length - 1) return;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(
        truncate(point.label, 14),
        coords[index].x,
        chart.y + chart.height + 15,
        { align: "center" },
      );
    });
    this.y += height + 20;
  }

  private statusDistribution() {
    const { pdf, dataset } = this;
    const items = [
      {
        label: this.copy.completed,
        value: dataset.learning.completedCourses,
        color: COLORS.success,
      },
      {
        label: this.copy.inProgress,
        value: dataset.learning.inProgressCourses,
        color: COLORS.info,
      },
      {
        label: this.copy.notStarted,
        value: dataset.learning.notStartedCourses,
        color: COLORS.subtle,
      },
      {
        label: this.copy.overdue,
        value: dataset.learning.overdueAssignments,
        color: COLORS.warning,
      },
    ];
    const total = Math.max(
      1,
      items.slice(0, 3).reduce((sum, item) => sum + item.value, 0),
    );
    const x = PAGE.margin;
    const y = this.y;
    pdf.setFillColor(...COLORS.surface);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(x, y, PAGE.contentWidth, 132, 14, 14, "FD");
    let cursor = x + 20;
    const barWidth = PAGE.contentWidth - 40;
    items.slice(0, 3).forEach((item) => {
      const width = (item.value / total) * barWidth;
      if (width > 0) {
        pdf.setFillColor(...item.color);
        pdf.rect(cursor, y + 25, width, 14, "F");
        cursor += width;
      }
    });
    items.forEach((item, index) => {
      const columnWidth = (PAGE.contentWidth - 40) / 4;
      const itemX = x + 20 + index * columnWidth;
      pdf.setFillColor(...item.color);
      pdf.circle(itemX + 3, y + 67, 3, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(item.label.toUpperCase(), itemX + 12, y + 70);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...COLORS.navy);
      pdf.text(String(item.value), itemX, y + 98);
    });
    this.y += 150;
  }

  private twoColumnPanels() {
    const gap = 12;
    const width = (PAGE.contentWidth - gap) / 2;
    const height = 188;
    const leftX = PAGE.margin;
    const rightX = PAGE.margin + width + gap;
    this.panel(leftX, this.y, width, height, this.copy.adoption, [
      { label: "SofLIA", value: this.dataset.overview.sofliaAdoptionRate },
      { label: "Notas", value: this.dataset.overview.notesAdoptionRate },
      {
        label: this.copy.validatedSubmissions,
        value: this.dataset.overview.activityCompletionRate,
      },
    ]);
    this.panel(rightX, this.y, width, height, this.copy.evidence, [
      { label: this.copy.assessments, value: this.dataset.quality.quizScore },
      { label: this.copy.validatedSubmissions, value: this.dataset.quality.activityScore },
      { label: this.copy.inTopicMessages, value: this.dataset.quality.sofliaScore },
      { label: this.copy.notesWithContent, value: this.dataset.quality.notesScore },
    ]);
    this.y += height + 20;
  }

  private panel(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    rows: Array<{ label: string; value: number }>,
  ) {
    const { pdf } = this;
    pdf.setFillColor(...COLORS.surface);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(x, y, width, height, 14, 14, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.accentDark);
    pdf.text(title, x + 18, y + 23);
    rows.forEach((row, index) => {
      const rowY = y + 52 + index * 32;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.ink);
      pdf.text(row.label, x + 18, rowY);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text(percent(row.value), x + width - 18, rowY, { align: "right" });
      this.drawBar(x + 18, rowY + 8, width - 36, 5, row.value);
    });
  }

  private courseChart(courses: ReportsAnalyticsCourseRow[]) {
    const { pdf } = this;
    const height = Math.max(120, courses.length * 31 + 34);
    pdf.setFillColor(...COLORS.surface);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(
      PAGE.margin,
      this.y,
      PAGE.contentWidth,
      height,
      14,
      14,
      "FD",
    );
    if (!courses.length) {
      this.emptyState(this.y + 55);
      this.y += height + 18;
      return;
    }
    courses.forEach((course, index) => {
      const rowY = this.y + 25 + index * 31;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.6);
      pdf.setTextColor(...COLORS.ink);
      pdf.text(truncate(course.courseTitle, 48), PAGE.margin + 18, rowY);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text(
        percent(course.averageProgress),
        PAGE.margin + PAGE.contentWidth - 18,
        rowY,
        { align: "right" },
      );
      this.drawBar(
        PAGE.margin + 18,
        rowY + 8,
        PAGE.contentWidth - 36,
        5,
        course.averageProgress,
      );
    });
    this.y += height + 18;
  }

  private table(columns: TableColumn[], rows: Array<Array<string | number>>) {
    if (!rows.length) {
      this.emptyState();
      return;
    }
    const rowPadding = 7;
    const headerHeight = 26;
    const drawHeader = () => {
      this.ensureSpace(headerHeight + 28);
      let x = PAGE.margin;
      this.pdf.setFillColor(...COLORS.navy);
      this.pdf.roundedRect(
        PAGE.margin,
        this.y,
        PAGE.contentWidth,
        headerHeight,
        7,
        7,
        "F",
      );
      columns.forEach((column) => {
        this.pdf.setFont("helvetica", "bold");
        this.pdf.setFontSize(6.6);
        this.pdf.setTextColor(...COLORS.white);
        this.pdf.text(
          column.label.toUpperCase(),
          alignX(x, column.width, column.align),
          this.y + 17,
          { align: column.align ?? "left" },
        );
        x += column.width;
      });
      this.y += headerHeight;
    };
    drawHeader();
    rows.forEach((row, rowIndex) => {
      const wrapped = row.map((value, index) => {
        const column = columns[index];
        return this.pdf.splitTextToSize(
          cleanText(value),
          column.width - 12,
        ) as string[];
      });
      const lines = Math.max(1, ...wrapped.map((cell) => cell.length));
      const height = Math.max(27, lines * 8 + rowPadding * 2);
      if (this.y + height > this.height - PAGE.bottom) {
        this.newPage(this.copy.title, this.copy.continuation);
        drawHeader();
      }
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(...COLORS.surface);
        this.pdf.rect(PAGE.margin, this.y, PAGE.contentWidth, height, "F");
      }
      let x = PAGE.margin;
      wrapped.forEach((cell, index) => {
        const column = columns[index];
        this.pdf.setFont("helvetica", index === 0 ? "bold" : "normal");
        this.pdf.setFontSize(7);
        this.pdf.setTextColor(...COLORS.ink);
        const textX = alignX(x + 6, column.width - 12, column.align);
        cell.forEach((line, lineIndex) => {
          this.pdf.text(
            line,
            textX,
            this.y + rowPadding + 7 + lineIndex * 8,
            { align: column.align ?? "left" },
          );
        });
        x += column.width;
      });
      this.y += height;
      this.pdf.setDrawColor(...COLORS.line);
      this.pdf.setLineWidth(0.4);
      this.pdf.line(
        PAGE.margin,
        this.y,
        PAGE.margin + PAGE.contentWidth,
        this.y,
      );
    });
    this.y += 18;
  }

  private urgentActions() {
    const actions = this.insights.urgentActions ?? [];
    actions.forEach((action) => {
      const lines = this.pdf.splitTextToSize(
        action.description,
        PAGE.contentWidth - 180,
      ) as string[];
      const height = Math.max(74, lines.length * 9 + 54);
      this.ensureSpace(height + 9);
      const color = action.priority === "high" ? COLORS.danger : COLORS.warning;
      this.pdf.setFillColor(...COLORS.surface);
      this.pdf.setDrawColor(...COLORS.line);
      this.pdf.roundedRect(
        PAGE.margin,
        this.y,
        PAGE.contentWidth,
        height,
        11,
        11,
        "FD",
      );
      this.pdf.setFillColor(...color);
      this.pdf.roundedRect(PAGE.margin, this.y, 4, height, 2, 2, "F");
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...color);
      this.pdf.text(
        `${this.riskLabel(action.priority)} · ${action.timeline}`.toUpperCase(),
        PAGE.margin + 20,
        this.y + 18,
      );
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(...COLORS.ink);
      this.pdf.text(truncate(action.title, 60), PAGE.margin + 20, this.y + 36);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7.5);
      this.pdf.setTextColor(...COLORS.muted);
      this.pdf.text(lines, PAGE.margin + 20, this.y + 51);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(...COLORS.navy);
      this.pdf.text(
        String(action.affectedUsers),
        PAGE.margin + PAGE.contentWidth - 24,
        this.y + 34,
        { align: "right" },
      );
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(6);
      this.pdf.setTextColor(...COLORS.muted);
      this.pdf.text(
        this.copy.users.toUpperCase(),
        PAGE.margin + PAGE.contentWidth - 24,
        this.y + 41,
        { align: "right" },
      );
      this.y += height + 9;
    });
    this.y += 9;
  }

  private priorityUsersTable(users: ReportsAnalyticsPriorityUser[]) {
    this.table(
      [
        { label: this.copy.name, width: 178 },
        { label: this.copy.risk, width: 50, align: "center" },
        { label: this.copy.cause, width: 118 },
        { label: this.copy.progress, width: 62, align: "right" },
        { label: this.copy.overdue, width: 45, align: "right" },
        { label: this.copy.lastActivityShort, width: 58, align: "right" },
      ],
      users.map((user) => [
        user.displayName || user.email,
        this.riskLabel(user.riskLevel),
        this.riskCauseLabel(user.riskCause),
        percent(user.averageProgress),
        user.overdueAssignments,
        user.lastActivityAt
          ? formatShortDate(user.lastActivityAt, this.locale)
          : "—",
      ]),
    );
  }

  private bullets(items: string[]) {
    if (!items.length) {
      this.emptyState();
      return;
    }
    items.forEach((item) => {
      const lines = this.pdf.splitTextToSize(
        item,
        PAGE.contentWidth - 30,
      ) as string[];
      const height = lines.length * 10 + 12;
      this.ensureSpace(height);
      this.pdf.setFillColor(...COLORS.accent);
      this.pdf.circle(PAGE.margin + 4, this.y - 2, 2.2, "F");
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(8.2);
      this.pdf.setTextColor(...COLORS.ink);
      this.pdf.text(lines, PAGE.margin + 16, this.y);
      this.y += height;
    });
    this.y += 6;
  }

  private dataQualityPanel() {
    const { pdf, dataset } = this;
    const completion = dataset.dataQuality.demographicsCompletionRate;
    pdf.setFillColor(...COLORS.surface);
    pdf.setDrawColor(...COLORS.line);
    pdf.roundedRect(PAGE.margin, this.y, PAGE.contentWidth, 100, 12, 12, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(...COLORS.navy);
    pdf.text(percent(completion), PAGE.margin + 20, this.y + 36);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.3);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(
      this.copy.demographicProfilesComplete,
      PAGE.margin + 20,
      this.y + 53,
    );
    this.drawBar(PAGE.margin + 20, this.y + 66, 190, 7, completion);

    const missing = dataset.dataQuality.missingFields
      .slice(0, 4)
      .map((item) => `${this.missingFieldLabel(item.label)}: ${item.value}`)
      .join(" · ");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.ink);
    const lines = pdf.splitTextToSize(
      missing || this.copy.noData,
      260,
    ) as string[];
    pdf.text(lines, PAGE.margin + 235, this.y + 33);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFontSize(7);
    pdf.text(
      `${dataset.dataQuality.usersMissingDemographics} ${this.copy.profilesRequireInformation}`,
      PAGE.margin + 235,
      this.y + 72,
    );
    this.y += 118;
  }

  private reportScopeAndMethodology() {
    const { pdf, dataset, copy } = this;
    this.ensureSpace(270);
    this.sectionTitle(copy.reportScope, 18);

    const cards = [
      {
        label: copy.coveragePeriod,
        value: `${formatDate(dataset.period.from, this.locale)} — ${formatDate(dataset.period.to, this.locale)}`,
      },
      {
        label: copy.peopleAnalyzed,
        value: formatNumber(dataset.overview.totalUsers),
      },
      {
        label: copy.coursesAnalyzed,
        value: formatNumber(dataset.courses.length),
      },
      {
        label: copy.evidenceAnalyzed,
        value: formatNumber(dataset.quality.evidenceCount),
      },
    ];
    const gap = 10;
    const cardWidth = (PAGE.contentWidth - gap) / 2;
    const cardHeight = 46;
    const startY = this.y;

    cards.forEach((card, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = PAGE.margin + column * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);
      pdf.setFillColor(...COLORS.surface);
      pdf.setDrawColor(...COLORS.line);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 9, 9, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.3);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(card.label.toUpperCase(), x + 14, y + 16);
      pdf.setFontSize(10.5);
      pdf.setTextColor(...COLORS.navy);
      pdf.text(truncate(card.value, 46), x + 14, y + 34);
    });

    this.y = startY + cardHeight * 2 + gap + 22;
    this.sectionTitle(copy.indicatorGuide, 18);
    this.bullets(copy.methodologyPoints);
  }

  private drawBar(
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
  ) {
    this.pdf.setFillColor(...COLORS.line);
    this.pdf.roundedRect(x, y, width, height, height / 2, height / 2, "F");
    const filled = Math.max(
      0,
      Math.min(width, (normalizePercent(value) / 100) * width),
    );
    if (filled > 0) {
      this.pdf.setFillColor(...COLORS.accent);
      this.pdf.roundedRect(
        x,
        y,
        Math.max(height, filled),
        height,
        height / 2,
        height / 2,
        "F",
      );
    }
  }

  private ensureSpace(required: number) {
    if (this.y + required <= this.height - PAGE.bottom) return;
    this.newPage(this.copy.title, this.copy.continuation);
  }

  private emptyState(y = this.y) {
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...COLORS.muted);
    this.pdf.text(this.copy.noData, PAGE.margin, y);
    this.y = y + 28;
  }

  private getWatchSegments(): ReportsAnalyticsSegmentRow[] {
    return [
      ...this.dataset.segments.jobTitles.map((row) => ({
        ...row,
        label: this.prefixedSegmentLabel(
          this.copy.jobTitle,
          this.segmentValueLabel("jobTitle", row.label),
        ),
      })),
      ...this.dataset.segments.ageBands.map((row) => ({
        ...row,
        label: this.prefixedSegmentLabel(
          this.copy.age,
          this.segmentValueLabel("age", row.label),
        ),
      })),
      ...this.dataset.segments.gender.map((row) => ({
        ...row,
        label: this.prefixedSegmentLabel(
          this.copy.gender,
          this.segmentValueLabel("gender", row.label),
        ),
      })),
      ...this.dataset.segments.roles.map((row) => ({
        ...row,
        label: this.prefixedSegmentLabel(
          this.copy.role,
          this.segmentValueLabel("role", row.label),
        ),
      })),
    ].sort(
      (left, right) =>
        left.qualityScore - right.qualityScore ||
        left.averageProgress - right.averageProgress,
    );
  }

  private prefixedSegmentLabel(prefix: string, label: string): string {
    const normalized = cleanText(label);
    const lowerLabel = normalized.toLocaleLowerCase();
    const lowerPrefix = prefix.toLocaleLowerCase();

    if (
      lowerLabel === lowerPrefix ||
      lowerLabel.startsWith(`${lowerPrefix} ·`) ||
      lowerLabel.startsWith(`${lowerPrefix}:`)
    ) {
      return normalized;
    }

    return `${prefix} · ${normalized}`;
  }

  private segmentValueLabel(
    kind: "jobTitle" | "age" | "gender" | "role",
    value: string,
  ): string {
    const normalized = cleanText(value);
    const key = normalized.toLocaleLowerCase().replaceAll(" ", "_");
    if (!key || key === "unspecified" || key === "not_specified") {
      return this.copy.notSpecified;
    }

    if (kind === "age") {
      const range = key.match(/^(\d{2})_(\d{2})$/);
      if (range) return `${range[1]}–${range[2]}`;
      const ageLabels: Record<ReportsAnalyticsLocale, Record<string, string>> = {
        es: { under_25: "Menos de 25", "55_plus": "55 o más" },
        en: { under_25: "Under 25", "55_plus": "55 or older" },
        pt: { under_25: "Menos de 25", "55_plus": "55 ou mais" },
      };
      return ageLabels[this.locale][key] ?? normalized;
    }

    const labels: Record<
      Exclude<typeof kind, "age">,
      Record<ReportsAnalyticsLocale, Record<string, string>>
    > = {
      jobTitle: { es: {}, en: {}, pt: {} },
      gender: {
        es: { female: "Mujer", male: "Hombre", non_binary: "No binario" },
        en: { female: "Female", male: "Male", non_binary: "Non-binary" },
        pt: { female: "Feminino", male: "Masculino", non_binary: "Não binário" },
      },
      role: {
        es: { owner: "Propietario", member: "Miembro", admin: "Administrador", instructor: "Instructor" },
        en: { owner: "Owner", member: "Member", admin: "Administrator", instructor: "Instructor" },
        pt: { owner: "Proprietário", member: "Membro", admin: "Administrador", instructor: "Instrutor" },
      },
    };

    return labels[kind][this.locale][key] ?? normalized;
  }

  private getHierarchyRows(): ReportsAnalyticsHierarchyRankingRow[] {
    return [
      ...this.dataset.rankings.regions,
      ...this.dataset.rankings.zones,
      ...this.dataset.rankings.teams,
    ].sort((left, right) => right.rankScore - left.rankScore);
  }

  private riskLabel(level: "high" | "medium" | "low") {
    return level === "high"
      ? this.copy.high
      : level === "medium"
        ? this.copy.medium
        : this.copy.low;
  }

  private riskCauseLabel(cause: ReportsAnalyticsPriorityUserRiskCause) {
    const labels: Record<
      ReportsAnalyticsLocale,
      Record<ReportsAnalyticsPriorityUserRiskCause, string>
    > = {
      es: {
        overdue: "Tiene vencimientos",
        not_started: "No ha iniciado",
        inactive: "Sin actividad reciente",
        low_progress: "Bajo avance",
      },
      en: {
        overdue: "Has overdue work",
        not_started: "Not started",
        inactive: "No recent activity",
        low_progress: "Low progress",
      },
      pt: {
        overdue: "Tem pendências vencidas",
        not_started: "Não iniciou",
        inactive: "Sem atividade recente",
        low_progress: "Baixo progresso",
      },
    };

    return labels[this.locale][cause];
  }

  private missingFieldLabel(field: string): string {
    const labels: Record<ReportsAnalyticsLocale, Record<string, string>> = {
      es: {
        date_of_birth: "Fecha de nacimiento",
        gender: "Género",
        job_title: "Puesto",
      },
      en: {
        date_of_birth: "Date of birth",
        gender: "Gender",
        job_title: "Job title",
      },
      pt: {
        date_of_birth: "Data de nascimento",
        gender: "Gênero",
        job_title: "Cargo",
      },
    };

    return labels[this.locale][field] ?? humanize(field);
  }

  private addFooters() {
    const total = this.pdf.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      this.pdf.setPage(page);
      this.pdf.setDrawColor(...COLORS.line);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(
        PAGE.margin,
        this.height - 34,
        this.width - PAGE.margin,
        this.height - 34,
      );
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setFontSize(6.5);
      this.pdf.setTextColor(...COLORS.navy);
      this.pdf.text("SOFLIA", PAGE.margin, this.height - 20);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(...COLORS.muted);
      this.pdf.text(this.copy.confidential, PAGE.margin + 34, this.height - 20);
      this.pdf.text(
        `${this.copy.page} ${page} ${this.copy.of} ${total}`,
        this.width - PAGE.margin,
        this.height - 20,
        { align: "right" },
      );
    }
  }
}

export async function generateReportsAnalyticsInsightsPdf({
  dataset,
  insights,
  locale,
}: {
  dataset: ReportsAnalyticsDataset;
  insights: ReportsAnalyticsAiInsights;
  locale: ReportsAnalyticsLocale;
}): Promise<Uint8Array> {
  const JsPDF = (await import("jspdf")).default;
  const pdf = new JsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });
  new PremiumAnalyticsPdf(pdf, dataset, insights, locale).render();
  return new Uint8Array(pdf.output("arraybuffer"));
}

function percent(value: number) {
  return `${formatNumber(normalizePercent(value), 1)}%`;
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatNumber(value: number, decimals = 0) {
  return Number(value.toFixed(decimals)).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, length: number) {
  const text = cleanText(value);
  return text.length > length
    ? `${text.slice(0, Math.max(1, length - 1)).trim()}...`
    : text;
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatDate(value: string, locale: ReportsAnalyticsLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(toReportDate(value));
}

function formatShortDate(value: string, locale: ReportsAnalyticsLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: "America/Mexico_City",
  }).format(toReportDate(value));
}

function formatDateTime(value: string, locale: ReportsAnalyticsLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(toReportDate(value));
}

function toReportDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00-06:00`)
    : new Date(value);
}

function alignX(x: number, width: number, align: CellAlign = "left") {
  if (align === "center") return x + width / 2;
  if (align === "right") return x + width;
  return x;
}
