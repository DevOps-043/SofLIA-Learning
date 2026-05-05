import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { BarChart3, Download, Filter, Target, Brain, Trophy } from 'lucide-react';

export const ADMIN_REPORTS_TOUR_ID = 'admin-reports-tour';

export const getAdminReportsSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-reports-hero',
    title: t('adminTour.steps.reportsHero.title', 'Reportes y Analytics'),
    content: t('adminTour.steps.reportsHero.content', 'Tu centro de inteligencia de datos. Genera insights con IA, exporta reportes en Excel, CSV o PDF y analiza el ROI de tu capacitación.'),
    disableBeacon: true,
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reports-filters',
    title: t('adminTour.steps.reportsFilters.title', 'Filtros Avanzados'),
    content: t('adminTour.steps.reportsFilters.content', 'Segmenta los datos por fecha, curso, rol, género, región, zona o equipo. Ajusta la granularidad temporal entre día, mes o año.'),
    data: {
      icon: <Filter className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reports-overview',
    title: t('adminTour.steps.reportsOverview.title', 'Métricas Generales'),
    content: t('adminTour.steps.reportsOverview.content', 'Indicadores clave de tu organización: usuarios activos, progreso promedio, tasa de completado, calidad, adopción de SofLIA y adherencia al planificador.'),
    data: {
      icon: <Target className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reports-insights',
    title: t('adminTour.steps.reportsInsights.title', 'Insights con IA'),
    content: t('adminTour.steps.reportsInsights.content', 'Genera un análisis narrativo con inteligencia artificial que identifica fortalezas, áreas de mejora y recomendaciones accionables para tu equipo.'),
    data: {
      icon: <Brain className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reports-charts',
    title: t('adminTour.steps.reportsCharts.title', 'Visualizaciones y Gráficos'),
    content: t('adminTour.steps.reportsCharts.content', 'Explora tendencias de aprendizaje, demografía, distribución de progreso, uso de SofLIA y rankings de rendimiento en gráficos interactivos.'),
    data: {
      icon: <Trophy className="w-5 h-5 text-accent" />
    }
  }
];
