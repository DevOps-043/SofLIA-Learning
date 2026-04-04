'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Award, BarChart3, Brain, Download, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { useThemeStore } from '@/core/stores/themeStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { StatCard } from './StatCard'

interface LiaActivityRow {
  last_accessed_at?: string | null
}

interface LiaAnalysisReportData {
  analysis_text: string
  raw_data?: {
    activity?: {
      activities?: LiaActivityRow[]
    }
    users?: {
      total_users?: number
    }
    courses?: {
      total_courses?: number
    }
    certificates?: {
      total_certificates?: number
    }
  }
}

interface LiaChartProps {
  height?: number
  showTooltip?: boolean
  barColor?: string
}

function LiaAnalysisReport({ data }: { data: LiaAnalysisReportData }) {
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
    activities.forEach((activity) => {
      if (activity.last_accessed_at) {
        const d = new Date(activity.last_accessed_at)
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
  const ChartComponent = ({ height = 200, showTooltip = true, barColor = accentColor }: LiaChartProps) => (
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
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
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
                    `,
                  }}
                />
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
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
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
                      `,
                    }}
                  />
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

export { LiaAnalysisReport }
