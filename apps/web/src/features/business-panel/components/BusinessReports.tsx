'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Activity,
  Award,
  Filter,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  Brain
} from 'lucide-react'
import Image from 'next/image'
import { useBusinessReports } from '../hooks/useBusinessReports'
import { ReportType } from '@/app/api/[orgSlug]/business/reports/data/route'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { PremiumSelect } from './PremiumSelect'
import { ReportTable } from './ReportTable'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'

// ============================================
// REPORTE DE ANÃLISIS LIA (NUEVO)
// ============================================
function LiaAnalysisReport({ data }: { data: any }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const { user } = useAuth()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  
  const reportRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [orgName, setOrgName] = useState<string>('Mi Organización')

  // Fetch Organization Name
  useEffect(() => {
    const fetchOrgName = async () => {
        if (!user?.organization_id) return
        const supabase = createClient()
        const { data, error } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', user.organization_id)
            .single()
        
        if (data && !error) {
            setOrgName(data.name)
        }
    }
    fetchOrgName()
  }, [user?.organization_id])

  // Procesar datos para la gráfica
  const monthlyData = useCallback(() => {
    const activities = data.raw_data?.activity?.activities || []
    const months: Record<string, number> = {}
    const now = new Date()
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('es-ES', { month: 'short' })
      months[key] = 0
    }

    // Llenar con datos reales
    activities.forEach((a: any) => {
      if (a.last_accessed_at) {
        const d = new Date(a.last_accessed_at)
        const key = d.toLocaleString('es-ES', { month: 'short' })
        if (months[key] !== undefined) {
          months[key]++
        }
      }
    })

    return Object.entries(months).map(([name, value]) => ({ name, value }))
  }, [data])()

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setIsDownloading(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 794
      })

      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      
      // Calcular altura de imagen proporcional
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      
      // Si la imagen cabe en una página
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        // Múltiples páginas: dividir la imagen
        const totalPages = Math.ceil(imgHeight / pageHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
          }
          
          // Posición Y para esta página (negativa para "subir" la imagen)
          const yPos = -(page * pageHeight)
          pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight)
        }
      }

      pdf.save(`Reporte_LIA_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor intenta de nuevo.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Componente de Gráfica Reutilizable
  const ChartComponent = ({ height = 200, showTooltip = true, barColor = accentColor }: any) => (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={monthlyData}>
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                dy={10}
            />
            {showTooltip && <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                    backgroundColor: cardBg, 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    color: textColor,
                    fontSize: '12px'
                }}
            />}
            <Bar 
                dataKey="value" 
                fill={barColor} 
                radius={[4, 4, 4, 4]} 
                barSize={32}
            />
        </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={reportRef}>
        
      {/* VISTA OCULTA PARA IMPRESIÓN (PDF) 
          Se renderiza fuera de pantalla pero se usa para generar el PDF con formato A4 limpio */}
      <div 
        ref={printRef} 
        style={{ 
            position: 'absolute', 
            top: '-9999px', 
            left: '-9999px', 
            width: '794px', // Ancho A4 en px a 96 DPI
            minHeight: '1123px', // Alto A4
            padding: '60px 60px 120px 60px', // Márgenes ampliados, especialmente inferior
            backgroundColor: '#FFFFFF',
            color: '#1e293b',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            zIndex: -50,
            display: 'flex',
            flexDirection: 'column'
        }}
      >
        {/* Marca de Agua */}
        <div 
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.04,
                pointerEvents: 'none',
                maxWidth: '500px',
                width: '100%',
                zIndex: 0
            }}
        >
             <Image src="/Logo.png" alt="Watermark" width={600} height={600} style={{ width: '100%', height: 'auto' }} />
        </div>

        {/* Encabezado PDF */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #0A2540', paddingBottom: '20px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: 'auto', position: 'relative' }}>
                    <img src="/Logo.png" alt="Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div>
                     <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0A2540', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('reports.liaAnalysis.pdfHeader')}</h1>
                     <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>{t('reports.liaAnalysis.pdfSubheader')}</p>
                </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
                <p style={{ margin: 0 }}><strong>{t('reports.liaAnalysis.organization')}</strong> {orgName}</p>
                <p style={{ margin: 0 }}><strong>{t('reports.liaAnalysis.generatedByLabel')}</strong> {user?.display_name || t('reports.liaAnalysis.systemName')}</p>
                <p style={{ margin: 0 }}><strong>{t('reports.liaAnalysis.issueDate')}</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>

        {/* Contenido PDF */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
            <div className="prose max-w-none text-justify" style={{ color: '#334155', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify' }}>
                {/* Aplicamos estilos específicos a los elementos del markdown para asegurar el formato en PDF */}
                <style jsx global>{`
                    .prose h1, .prose h2, .prose h3 { color: #0A2540 !important; margin-top: 24px; margin-bottom: 12px; }
                    .prose strong { color: #0f172a !important; font-weight: 700; }
                    .prose p { margin-bottom: 16px; text-align: justify; }
                    .prose ul, .prose ol { margin-bottom: 16px; padding-left: 20px; }
                    .prose li { margin-bottom: 4px; }
                    .prose table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
                    .prose th { background-color: #0A2540; color: white; padding: 10px 12px; text-align: left; font-weight: 600; border: 1px solid #0A2540; }
                    .prose td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155; }
                    .prose tr:nth-child(even) { background-color: #f8fafc; }
                    .prose tr:hover { background-color: #f1f5f9; }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{data.analysis_text}</ReactMarkdown>
            </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('reports.liaAnalysis.confidential')} {orgName}</span>
            <span>SOFLIA | {new Date().getFullYear()}</span>
        </div>
      </div>


      {/* VISTA EN PANTALLA (NORMAL) */}
      <div className="lg:col-span-2 space-y-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30 shadow-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-10">
                <Brain className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
                {/* Header Visble */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                                {t('reports.liaAnalysis.title')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('reports.liaAnalysis.subtitle')}
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold !text-white transition-all hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: '#0A2540',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px 0 rgba(10, 37, 64, 0.4)'
                        }}
                    >
                        {isDownloading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? t('reports.actions.generating') : t('reports.actions.downloadPdf')}
                    </button>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg text-sm leading-relaxed">
                  <style jsx global>{`
                    .prose strong {
                      color: ${isDark ? '#60a5fa' : '#2563eb'} !important;
                      font-weight: 700 !important;
                    }
                    .prose h1, .prose h2, .prose h3, .prose h4 {
                      color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
                      font-weight: 700 !important;
                    }
                    .prose p {
                      color: ${isDark ? 'rgba(248, 250, 252, 0.9)' : '#334155'} !important;
                    }
                    .prose li {
                      color: ${isDark ? 'rgba(248, 250, 252, 0.9)' : '#334155'} !important;
                    }
                    .prose code {
                      color: ${isDark ? '#60a5fa' : '#2563eb'} !important;
                      background-color: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'} !important;
                    }
                  `}</style>
                   <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{data.analysis_text}</ReactMarkdown>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>{t('reports.liaAnalysis.generatedBy')}</span>
                    <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>
        </motion.div>
      </div>

      {/* Columna Lateral - Métricas Clave (Visible) */}
      <div className="space-y-4">
         <StatCard 
            label={t('reports.liaMetrics.totalUsers')} 
            value={data.raw_data?.users?.total_users || 0} 
            icon={Users} 
            color={accentColor} 
         />
         <StatCard 
            label={t('reports.liaMetrics.activeCourses')} 
            value={data.raw_data?.courses?.total_courses || 0} 
            icon={BarChart3} 
            color="#8b5cf6" 
         />
         <StatCard 
            label={t('reports.liaMetrics.certificates')} 
            value={data.raw_data?.certificates?.total_certificates || 0} 
            icon={Award} 
            color="#ec4899" 
         />
         
         <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
                {t('reports.liaMetrics.recentActivity')}
            </h3>
            <div className="h-40 w-full">
                <ChartComponent />
            </div>
            <p className="text-xs text-center mt-4 text-gray-400">{t('reports.liaMetrics.last6Months')}</p>
         </div>
      </div>
    </div>
  )
}
// Los colores se definirán dinámicamente basados en el accent color de la organización
const getReportTypes = (accentColor: string, t: any) => [
  { value: 'lia-analysis' as ReportType, label: t('reports.types.liaAnalysis.label'), icon: Sparkles, description: t('reports.types.liaAnalysis.description'), color: '#0EA5E9' },
  { value: 'users' as ReportType, label: t('reports.types.users.label'), icon: Users, description: t('reports.types.users.description'), color: accentColor },
  { value: 'activity' as ReportType, label: t('reports.types.activity.label'), icon: Activity, description: t('reports.types.activity.description'), color: '#10b981' },
  { value: 'certificates' as ReportType, label: t('reports.types.certificates.label'), icon: Award, description: t('reports.types.certificates.description'), color: '#8b5cf6' }
]

const getChartColors = (accentColor: string) => [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function BusinessReports() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const hasFetched = useRef(false)

  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const secondaryColor = panelStyles?.secondary_button_color || '#10b981'

  // Colores dinámicos basados en el accent de la organización
  const REPORT_TYPES = getReportTypes(accentColor, t)
  const CHART_COLORS = getChartColors(accentColor)

  const {
    reportType,
    setReportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    fetchReport,
    resetFilters
  } = useBusinessReports()

  const [showFilters, setShowFilters] = useState(false)
  const [localStartDate, setLocalStartDate] = useState('')
  const [localEndDate, setLocalEndDate] = useState('')

  // Fetch inicial solo una vez por tipo de reporte
  const handleReportTypeChange = useCallback((type: ReportType) => {
    setReportType(type)
    hasFetched.current = false
  }, [setReportType])

  // Generar reporte manualmente
  const handleGenerateReport = useCallback(() => {
    fetchReport(reportType, {
      ...filters,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined
    })
    hasFetched.current = true
  }, [filters, localStartDate, localEndDate, fetchReport, reportType])

  // Auto-fetch cuando cambia el tipo (solo si no se ha hecho fetch)
  if (!hasFetched.current && reportType && !isLoading && !reportData) {
    fetchReport(reportType, filters)
    hasFetched.current = true
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!reportData?.data) {
      alert(t('reports.export.noData'))
      return
    }
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      let worksheet: any
      let filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`

      switch (reportType) {
        case 'users':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.users || []).map((u: any) => ({
              'Username': u.username,
              'Email': u.email,
              'Nombre': u.display_name,
              'Cargo': u.job_title || 'No especificado',
              'Estado': u.status,
              'Fecha de Ingreso': u.joined_at ? new Date(u.joined_at).toLocaleDateString('es-ES') : '',
              'Última Conexión': u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
              'Total Cursos': u.progress?.total_courses || 0,
              'Cursos Completados': u.progress?.completed_courses || 0,
              'Progreso Promedio': `${u.progress?.average_progress?.toFixed(1) || 0}%`
            }))
          )
          break
        case 'activity':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.activities || []).map((a: any) => ({
              'Usuario': a.user_name || a.user_id,
              'Email': a.user_email || '',
              'Curso': a.course_title || a.course_id,
              'Estado': a.enrollment_status,
              'Fecha Inscripción': a.enrolled_at || '',
              'Último Acceso': a.last_accessed_at || ''
            }))
          )
          break
        case 'certificates':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.certificates || []).map((c: any) => ({
              'Usuario': c.user_name || c.user_id,
              'Email': c.user_email || '',
              'Curso': c.course_title || c.course_id,
              'Categoría': c.course_category || '',
              'Fecha Emisión': c.issued_at || ''
            }))
          )
          break
        case 'lia-analysis':
            // Exportar datos crudos para el análisis
             worksheet = XLSX.utils.json_to_sheet(
                (reportData.data.raw_data?.users?.users || []).map((u: any) => ({
                  'Username': u.username,
                  'Cargo': u.job_title,
                  'Progreso': u.progress?.average_progress,
                  'Ult. Conexión': u.last_login_at
                }))
             );
            break;
        default:
          return
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      XLSX.writeFile(workbook, filename)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert(t('reports.export.error'))
    }
  }

  return (
    <div className="w-full space-y-6" style={{ color: textColor }}>
      {/* Header Premium */}
      {/* Header Premium - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
        style={{ 
          backgroundColor: '#0A2540',
        }}
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.png"
            alt="Reports Header"
            fill
            className="object-cover"
            style={{ opacity: 0.5 }}
            priority
          />
        </div>
        
        {/* Blue Gradient Overlay - Crucial for the 'Blue' look while keeping image visible */}
        <div 
            className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none"
        />

        {/* Decorative Particles/Grid - Subtle */}
        <div 
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span 
              className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
              style={{ color: 'rgba(219, 234, 254, 0.9)' }}
            >
              {t('reports.subtitle')}
            </span>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            {t('reports.title')}
          </h1>
          
          <p 
            className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
            style={{ color: '#EFF6FF' }}
          >
            {t('reports.description')}
          </p>
        </div>
      </motion.div>

      {/* Selector de Tipo de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = reportType === type.value
          return (
            <motion.button
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleReportTypeChange(type.value)}
              disabled={isLoading}
              className={`relative group p-6 rounded-2xl border-2 text-left transition-all overflow-hidden
                ${isSelected 
                  ? '' 
                  : 'bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30'}
              `}
              style={{
                ...(isSelected ? { backgroundColor: `${type.color}15`, borderColor: type.color } : {})
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeReport"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: `${type.color}10` }}
                />
              )}
              <div className="relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{type.label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Barra de Acciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80
              ${showFilters 
                ? '' 
                : 'bg-transparent border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300'}
            `}
            style={showFilters ? {
              backgroundColor: `${accentColor}20`,
              borderColor: accentColor,
              color: accentColor
            } : {}}
          >
            <Filter className="w-4 h-4" />
            {t('reports.actions.filters')}
            {showFilters && <X className="w-4 h-4" />}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 bg-transparent border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('reports.actions.generating') : t('reports.actions.update')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {reportData && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-105 active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)'
              }}
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              {t('reports.actions.exportExcel')}
            </button>
          )}
        </div>
      </motion.div>

      {/* Panel de Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                {t('reports.filters.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.startDate')}</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.endDate')}</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.role')}</label>
                  <PremiumSelect
                    value={filters.role || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, role: value as any })}
                    placeholder={t('reports.filters.selectRole')}
                    options={[
                      { value: 'all', label: t('reports.status.all') },
                      { value: 'owner', label: t('reports.status.owner') },
                      { value: 'admin', label: t('reports.status.admin') },
                      { value: 'member', label: t('reports.status.member') }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.status')}</label>
                  <PremiumSelect
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                    placeholder={t('reports.filters.selectStatus')}
                    options={[
                      { value: 'all', label: t('reports.status.all') },
                      { value: 'active', label: t('reports.status.active') },
                      { value: 'invited', label: t('reports.status.invited') },
                      { value: 'suspended', label: t('reports.status.suspended') }
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` }}
                >
                  {t('reports.actions.applyFilters')}
                </button>
                <button
                  onClick={() => { resetFilters(); setLocalStartDate(''); setLocalEndDate('') }}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
                  style={{ borderColor: cardBorder, color: textColor }}
                >
                  {t('reports.actions.clear')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado de Carga */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 rounded-2xl border text-center bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
        >
          <div className="inline-flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            <span className="text-gray-500 dark:text-gray-400">{t('reports.messages.loading')}</span>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Contenido del Reporte */}
      {reportData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ReportContent reportType={reportType} data={reportData.data} />
        </motion.div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE DE CONTENIDO DEL REPORTE
// ============================================
function ReportContent({ reportType, data }: { reportType: ReportType; data: any }) {
  const { t } = useTranslation('business')
  switch (reportType) {
    case 'users':
      return <UsersReport data={data} />
    case 'activity':
      return <ActivityReport data={data} />
    case 'certificates':
      return <CertificatesReport data={data} />
    case 'lia-analysis':
      return <LiaAnalysisReport data={data} />
    default:
      return <div className="opacity-70">{t('reports.messages.unavailable')}</div>
  }
}

// ============================================
// REPORTE DE USUARIOS
// ============================================
function UsersReport({ data }: { data: any }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  
  const CHART_COLORS = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  const roleData = Object.entries(data.summary?.by_job_title || {}).map(([name, value]) => ({
    name: name || t('reports.messages.unspecified'),
    value: value as number
  }))

  const statusData = Object.entries(data.summary?.by_status || {}).map(([name, value]) => ({
    name: name === 'active' ? t('reports.status.actives') : name === 'invited' ? t('reports.status.invitedPlural') : name === 'suspended' ? t('reports.status.suspendedPlural') : name,
    value: value as number
  }))

  // CustomTooltip para gráficos de pastel
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '12px'
          }}
        >
          <p style={{ color: textColor, margin: 0, fontWeight: 600 }}>
            {data.name || 'Valor'}
          </p>
          <p style={{ color: textColor, margin: '4px 0 0 0', fontWeight: 500 }}>
            {typeof data.value === 'number' 
              ? data.value % 1 === 0 
                ? data.value 
                : data.value.toFixed(1)
              : data.value}
          </p>
        </div>
      )
    }
    return null
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'username', header: t('reports.usersReport.columns.username') },
    { accessorKey: 'email', header: t('reports.usersReport.columns.email') },
    { accessorKey: 'display_name', header: t('reports.usersReport.columns.name') },
    { accessorKey: 'job_title', header: t('reports.usersReport.columns.role'), cell: (info) => (
      <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
        {(info.getValue() as string) || t('reports.messages.unspecified')}
      </span>
    )},
    { accessorKey: 'status', header: t('reports.usersReport.columns.status'), cell: (info) => {
      const status = info.getValue() as string
      const colors: Record<string, string> = { active: '#10b981', invited: '#f59e0b', suspended: '#ef4444' }
      return (
        <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
          {status === 'active' ? t('reports.status.active') : status === 'invited' ? t('reports.status.invited') : status === 'suspended' ? t('reports.status.suspended') : status}
        </span>
      )
    }},
    { accessorKey: 'joined_at', header: t('reports.usersReport.columns.joinedAt'), cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' }
  ]

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.usersReport.stats.totalUsers')} value={data.total_users || 0} icon={Users} color={accentColor} />
        <StatCard label={t('reports.usersReport.stats.activeUsers')} value={data.summary?.by_status?.active || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label={t('reports.usersReport.stats.differentRoles')} value={Object.keys(data.summary?.by_job_title || {}).length} icon={Award} color="#8b5cf6" />
      </div>

      {/* Gráficos */}
      {(roleData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roleData.length > 0 && (
            <ChartCard title={t('reports.usersReport.charts.roleDistribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {statusData.length > 0 && (
            <ChartCard title={t('reports.usersReport.charts.statusDistribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px',
                      color: textColor
                    }}
                    labelStyle={{ color: textColor }}
                    cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.users || []} columns={columns} />
    </div>
  )
}

// ============================================
// REPORTE DE ACTIVIDAD
// ============================================
function ActivityReport({ data }: { data: any }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  
  const CHART_COLORS = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  const statusData = [
    { name: t('reports.status.actives'), value: data.active_count || 0 },
    { name: t('reports.status.completedPlural'), value: data.completed_count || 0 },
    { name: t('reports.status.inactives'), value: data.inactive_count || 0 }
  ].filter(s => s.value > 0)

  // CustomTooltip para gráficos de pastel
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '12px'
          }}
        >
          <p style={{ color: textColor, margin: 0, fontWeight: 600 }}>
            {data.name || t('reports.messages.value')}
          </p>
          <p style={{ color: textColor, margin: '4px 0 0 0', fontWeight: 500 }}>
            {typeof data.value === 'number' 
              ? data.value % 1 === 0 
                ? data.value 
                : data.value.toFixed(1)
              : data.value}
          </p>
        </div>
      )
    }
    return null
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'user_name', header: t('reports.activityReport.columns.user') },
    { accessorKey: 'course_title', header: t('reports.activityReport.columns.course') },
    { accessorKey: 'enrollment_status', header: t('reports.activityReport.columns.status'), cell: (info) => {
      const status = info.getValue() as string
      const colors: Record<string, string> = { active: '#10b981', completed: accentColor, inactive: '#6b7280' }
      return (
        <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
          {status === 'active' ? t('reports.status.active') : status === 'completed' ? t('reports.status.completed') : t('reports.status.inactive')}
        </span>
      )
    }},
    { accessorKey: 'enrolled_at', header: t('reports.activityReport.columns.enrolledAt'), cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' },
    { accessorKey: 'last_accessed_at', header: t('reports.activityReport.columns.lastAccess'), cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.activityReport.stats.totalActivities')} value={data.total_activities || 0} icon={Activity} color={accentColor} />
        <StatCard label={t('reports.activityReport.stats.users')} value={data.total_users || 0} icon={Users} color="#8b5cf6" />
        <StatCard label={t('reports.activityReport.stats.actives')} value={data.active_count || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label={t('reports.activityReport.stats.completed')} value={data.completed_count || 0} icon={Award} color="#f59e0b" />
      </div>

      {statusData.length > 0 && (
        <ChartCard title={t('reports.activityReport.charts.status')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend wrapperStyle={{ color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.activities || []} columns={columns} />
    </div>
  )
}

// ============================================
// REPORTE DE CERTIFICADOS
// ============================================
function CertificatesReport({ data }: { data: any }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'

  const courseCertData = (data.certificates_by_course || []).slice(0, 8).map((c: any) => ({
    name: (c.course_title || t('reports.certificatesReport.courseFallback')).substring(0, 15),
    certificados: c.count || 0
  }))

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'user_name', header: t('reports.certificatesReport.columns.user') },
    { accessorKey: 'course_title', header: t('reports.certificatesReport.columns.course') },
    { accessorKey: 'course_category', header: t('reports.certificatesReport.columns.category'), cell: (info) => info.getValue() || '-' },
    { accessorKey: 'issued_at', header: t('reports.certificatesReport.columns.issuedAt'), cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' },
    { id: 'actions', header: t('reports.certificatesReport.columns.view'), cell: (info) => {
      const url = info.row.original.certificate_url
      return url ? (
        <button onClick={() => window.open(url, '_blank')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Eye className="w-4 h-4" style={{ color: accentColor }} />
        </button>
      ) : <span className="opacity-50 text-xs">-</span>
    }}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.certificatesReport.stats.totalCertificates')} value={data.total_certificates || 0} icon={Award} color="#8b5cf6" />
        <StatCard label={t('reports.certificatesReport.stats.certifiedUsers')} value={data.total_users_with_certificates || 0} icon={Users} color={accentColor} />
        <StatCard label={t('reports.certificatesReport.stats.averagePerUser')} value={data.total_users_with_certificates > 0 ? (data.total_certificates / data.total_users_with_certificates).toFixed(1) : '0'} icon={TrendingUp} color="#10b981" />
      </div>

      {courseCertData.length > 0 && (
        <ChartCard title={t('reports.certificatesReport.charts.byCourse')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCertData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: cardBorder }} />
              <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: cardBg, 
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textColor
                }}
                labelStyle={{ color: textColor }}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="certificados" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.certificates || []} columns={columns} />
    </div>
  )
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-5 rounded-2xl border backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </motion.div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}



