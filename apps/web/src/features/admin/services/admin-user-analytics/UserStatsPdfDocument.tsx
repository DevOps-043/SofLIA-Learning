import type { ReactNode } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import type { UserStatsPdfCopy, UserStatsGlossaryKey } from './user-stats-pdf-copy'

export interface UserStatsPdfDocumentProps {
  response: BusinessUserAnalyticsResponse
  copy: UserStatsPdfCopy
  userLabel: string
  organizationLabel?: string | null
  generatedAtValue: string
  periodValue: string
  insights?: BusinessUserAnalyticsInsights | null
}

const COLORS = {
  primary: '#0A2540',
  accent: '#00D4B3',
  text: '#111827',
  muted: '#525E70',
  line: '#DCE2EB',
  surface: '#F7F9FC',
  white: '#FFFFFF',
}

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 32, fontFamily: 'Helvetica', color: COLORS.text },
  header: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 18 },
  headerEyebrow: { color: COLORS.accent, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  headerSubtitle: { color: COLORS.white, fontSize: 11, marginTop: 6 },
  headerMeta: { color: '#AFC0D4', fontSize: 8.5, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.text, marginTop: 14, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  card: { width: '33.33%', paddingHorizontal: 5, marginBottom: 10 },
  cardInner: { backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line, padding: 10, height: 78 },
  cardLabel: { fontSize: 8.5, color: COLORS.muted, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.text, marginTop: 3 },
  cardHelp: { fontSize: 7, color: COLORS.muted, marginTop: 3, lineHeight: 1.25 },
  barRow: { marginBottom: 8 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barLabel: { fontSize: 9, color: COLORS.text },
  barValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.text },
  barTrack: { height: 7, borderRadius: 4, backgroundColor: COLORS.line },
  barFill: { height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  table: { borderRadius: 8, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden', marginTop: 4 },
  tableHead: { flexDirection: 'row', backgroundColor: COLORS.primary },
  tableHeadCell: { color: COLORS.white, fontSize: 8, fontFamily: 'Helvetica-Bold', padding: 6 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.line },
  tableCell: { fontSize: 8, color: COLORS.text, padding: 6 },
  paragraph: { fontSize: 9.5, color: COLORS.muted, lineHeight: 1.4, marginBottom: 4 },
  insightItem: { fontSize: 9, color: COLORS.text, lineHeight: 1.35, marginBottom: 3 },
  insightGroupTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginTop: 8, marginBottom: 3 },
  glossaryRow: { flexDirection: 'row', marginBottom: 4 },
  glossaryTerm: { width: '30%', fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.text },
  glossaryDef: { width: '70%', fontSize: 8, color: COLORS.muted, lineHeight: 1.3 },
})

function round(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 10) / 10
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, round(value)))
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

/**
 * Sección indivisible: agrupa el título con su contenido y, gracias a
 * `wrap={false}`, evita que una sección corta (métricas/barras) se parta a la
 * mitad en el salto de página. Si no cabe en el espacio restante, React-PDF la
 * mueve completa a la página siguiente. Pensado para bloques que caben holgados
 * en una página (no usar para tablas largas que sí deben poder paginarse).
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View wrap={false}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  )
}

interface CardData {
  label: string
  value: string
  help?: string
}

function MetricGrid({ items }: { items: CardData[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View key={index} style={styles.card} wrap={false}>
          <View style={styles.cardInner}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
            {item.help ? <Text style={styles.cardHelp}>{item.help}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = clampPct(value)
  return (
    <View style={styles.barRow}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  )
}

const COURSE_COLS = ['45%', '14%', '14%', '14%', '13%']

export function UserStatsPdfDocument({
  response,
  copy,
  userLabel,
  organizationLabel,
  generatedAtValue,
  periodValue,
  insights,
}: UserStatsPdfDocumentProps) {
  const { overview, aiAdoption, quality, notes, activities, quizzes, learning } = response

  const subtitle = organizationLabel
    ? `${userLabel}   ·   ${copy.organization}: ${organizationLabel}`
    : userLabel

  const courseRows = [...learning.courses]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 12)

  const glossaryKeys: UserStatsGlossaryKey[] = [
    'averageProgress', 'aiAdoption', 'quality', 'lessonsCompleted', 'completionRate',
    'activities', 'activitiesPassRate', 'quizzesTaken', 'quizzesPassed', 'quizzesAverage',
    'quizzesTotalAttempts', 'notes', 'notesAdoption', 'currentStreak', 'certificates',
  ]

  const showInsights = insights && !insights.unavailable

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>{copy.reportSubtitle}</Text>
          <Text style={styles.headerTitle}>{copy.title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
          <Text style={styles.headerMeta}>
            {copy.generatedAt}: {generatedAtValue}    ·    {copy.period}: {periodValue}
          </Text>
        </View>

        {/* Resumen general */}
        <Section title={copy.sections.overview}>
          <MetricGrid
            items={[
              { label: copy.metrics.averageProgress, value: `${round(overview.averageProgress)}%`, help: copy.values.coursesAssigned(overview.completedCourses, overview.totalAssigned) },
              { label: copy.metrics.aiAdoption, value: `${round(aiAdoption.adoptionScore)}%`, help: copy.values.conversations(aiAdoption.totalConversations, aiAdoption.totalMessages) },
              { label: copy.metrics.quality, value: `${round(quality.overallScore)}%`, help: copy.glossary.quality },
              { label: copy.metrics.lessonsCompleted, value: String(overview.lessonsCompleted), help: `${copy.metrics.timeSpent}: ${copy.values.minutes(Math.round(overview.timeSpentMinutes))}` },
              { label: copy.metrics.certificates, value: String(overview.certificates), help: copy.glossary.certificates },
              { label: copy.metrics.currentStreak, value: copy.values.days(overview.currentStreak), help: copy.glossary.currentStreak },
            ]}
          />
        </Section>

        {/* Indicadores de progreso */}
        <Section title={copy.sections.progress}>
          <Bar label={copy.metrics.averageProgress} value={overview.averageProgress} />
          <Bar label={copy.metrics.completionRate} value={overview.completionRate} />
          <Bar label={copy.metrics.aiAdoption} value={aiAdoption.adoptionScore} />
          <Bar label={copy.metrics.quality} value={quality.overallScore} />
        </Section>

        {/* Quizzes y exámenes */}
        <Section title={copy.sections.quizzes}>
          <MetricGrid
            items={[
              { label: copy.metrics.quizzesTaken, value: copy.values.outOf(quizzes.quizzesTaken, quizzes.lessonsWithQuiz), help: copy.glossary.quizzesTaken },
              { label: copy.metrics.quizzesPassed, value: String(quizzes.quizzesPassed), help: copy.glossary.quizzesPassed },
              { label: copy.metrics.quizzesAverage, value: `${round(quizzes.averageScore)}%`, help: copy.glossary.quizzesAverage },
              { label: copy.metrics.quizzesTotalAttempts, value: String(quizzes.totalAttempts), help: copy.glossary.quizzesTotalAttempts },
              { label: copy.metrics.quizzesRetries, value: String(quizzes.retries), help: copy.glossary.quizzesTotalAttempts },
              { label: copy.metrics.lessonsWithQuiz, value: String(quizzes.lessonsWithQuiz), help: copy.glossary.quizzesTaken },
            ]}
          />
        </Section>

        {/* Notas y actividades */}
        <Section title={copy.sections.engagement}>
          <MetricGrid
            items={[
              { label: copy.metrics.activities, value: String(activities.totalSubmissions), help: copy.glossary.activities },
              { label: copy.metrics.activitiesPassRate, value: `${round(activities.passRate)}%`, help: copy.glossary.activitiesPassRate },
              { label: copy.metrics.notes, value: String(notes.totalNotes), help: copy.glossary.notes },
              { label: copy.metrics.notesAdoption, value: `${round(notes.adoptionRate)}%`, help: copy.glossary.notesAdoption },
            ]}
          />
        </Section>

        {/* Avance por curso */}
        {courseRows.length > 0 ? (
          <View wrap={false}>
            <SectionTitle>{copy.sections.courses}</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, { width: COURSE_COLS[0] }]}>{copy.columns.course}</Text>
                <Text style={[styles.tableHeadCell, { width: COURSE_COLS[1] }]}>{copy.columns.progress}</Text>
                <Text style={[styles.tableHeadCell, { width: COURSE_COLS[2] }]}>{copy.columns.lessons}</Text>
                <Text style={[styles.tableHeadCell, { width: COURSE_COLS[3] }]}>{copy.columns.time}</Text>
                <Text style={[styles.tableHeadCell, { width: COURSE_COLS[4] }]}>{copy.columns.status}</Text>
              </View>
              {courseRows.map((course, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 ? { backgroundColor: COLORS.surface } : {}]}>
                  <Text style={[styles.tableCell, { width: COURSE_COLS[0] }]}>{course.courseTitle}</Text>
                  <Text style={[styles.tableCell, { width: COURSE_COLS[1] }]}>{round(course.progress)}%</Text>
                  <Text style={[styles.tableCell, { width: COURSE_COLS[2] }]}>{String(course.lessonsCompleted)}</Text>
                  <Text style={[styles.tableCell, { width: COURSE_COLS[3] }]}>{Math.round(course.timeSpentMinutes)}</Text>
                  <Text style={[styles.tableCell, { width: COURSE_COLS[4] }]}>{course.status}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Calidad del aprendizaje */}
        {quality.radar.length > 0 ? (
          <View wrap={false}>
            <SectionTitle>{copy.sections.quality}</SectionTitle>
            {quality.radar.map((item, index) => (
              <Bar key={index} label={item.label} value={item.value} />
            ))}
          </View>
        ) : null}

        {/* Feedback de SofLIA */}
        {showInsights ? (
          <View>
            <View wrap={false}>
              <SectionTitle>{copy.sections.insights}</SectionTitle>
              {insights!.summary ? <Text style={styles.paragraph}>{insights!.summary}</Text> : null}
            </View>
            <InsightList title={copy.insights.strengths} items={insights!.strengths} />
            <InsightList title={copy.insights.opportunities} items={insights!.opportunities} />
            <InsightList title={copy.insights.recommendations} items={insights!.recommendations} />
          </View>
        ) : null}

        {/* Glosario */}
        <View break>
          <SectionTitle>{copy.sections.glossary}</SectionTitle>
          {glossaryKeys.map((key) => (
            <View key={key} style={styles.glossaryRow} wrap={false}>
              <Text style={styles.glossaryTerm}>{copy.metrics[key]}</Text>
              <Text style={styles.glossaryDef}>{copy.glossary[key]}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null
  // wrap={false}: el grupo (título + viñetas) no se parte entre páginas; si no
  // cabe, pasa entero a la siguiente. La sección puede paginar ENTRE grupos.
  return (
    <View wrap={false}>
      <Text style={styles.insightGroupTitle}>{title}</Text>
      {items.slice(0, 6).map((item, index) => (
        <Text key={index} style={styles.insightItem}>•  {item}</Text>
      ))}
    </View>
  )
}
