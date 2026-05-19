import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride';
import { TFunction } from 'i18next';
import { Route, BarChart3, Search, Layers, Users } from 'lucide-react';

export const ADMIN_PATHS_TOUR_ID = 'admin-paths-tour';

export const getAdminPathsSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-paths-hero',
    title: t('adminTour.steps.pathsHero.title', 'Rutas de Aprendizaje'),
    content: t('adminTour.steps.pathsHero.content', 'Este es tu centro de gestión de rutas. Asigna a tus usuarios secuencias de cursos ordenadas para guiar su desarrollo profesional.'),
    disableBeacon: true,
    data: {
      icon: <Route className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-paths-stats',
    title: t('adminTour.steps.pathsStats.title', 'Métricas de Rutas'),
    content: t('adminTour.steps.pathsStats.content', 'Consulta rápidamente cuántas rutas están activas, la cantidad de talleres, usuarios asignados y el total de asignaciones vigentes.'),
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-paths-search',
    title: t('adminTour.steps.pathsSearch.title', 'Búsqueda de Rutas'),
    content: t('adminTour.steps.pathsSearch.content', 'Busca rutas por nombre, descripción o taller para encontrar rápidamente lo que necesitas.'),
    data: {
      icon: <Search className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-paths-cards',
    title: t('adminTour.steps.pathsCards.title', 'Tarjetas de Rutas'),
    content: t('adminTour.steps.pathsCards.content', 'Cada tarjeta muestra el contenido de la ruta, sus talleres y cuántos usuarios la tienen asignada. Desde aquí puedes asignar usuarios o gestionar los videos introductorios.'),
    data: {
      icon: <Layers className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-paths-assignments',
    title: t('adminTour.steps.pathsAssignments.title', 'Asignaciones Activas'),
    content: t('adminTour.steps.pathsAssignments.content', 'Revisa qué usuarios tienen cada ruta asignada, cuándo fue asignada y revoca accesos cuando sea necesario.'),
    data: {
      icon: <Users className="w-5 h-5 text-accent" />
    }
  }
];
