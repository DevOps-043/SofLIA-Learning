import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { ClipboardCheck, BarChart3, Filter, LayoutGrid } from 'lucide-react';

export const ADMIN_REVIEWS_TOUR_ID = 'admin-reviews-tour';

export const getAdminReviewsSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-reviews-header',
    title: t('adminTour.steps.reviewsHeader.title', 'Revisiones Pendientes'),
    content: t('adminTour.steps.reviewsHeader.content', 'Aquí revisas los cursos enviados desde Course Engine. Puedes aprobarlos para publicación o rechazarlos con comentarios.'),
    disableBeacon: true,
    data: {
      icon: <ClipboardCheck className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reviews-stats',
    title: t('adminTour.steps.reviewsStats.title', 'Estado de Revisiones'),
    content: t('adminTour.steps.reviewsStats.content', 'Consulta cuántos cursos están pendientes, rechazados, cuáles son actualizaciones y cuáles son completamente nuevos.'),
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reviews-filters',
    title: t('adminTour.steps.reviewsFilters.title', 'Filtros y Pestañas'),
    content: t('adminTour.steps.reviewsFilters.content', 'Alterna entre cursos pendientes y rechazados. Usa la barra de búsqueda para filtrar por título, instructor, categoría o nivel.'),
    data: {
      icon: <Filter className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-reviews-grid',
    title: t('adminTour.steps.reviewsGrid.title', 'Tarjetas de Revisión'),
    content: t('adminTour.steps.reviewsGrid.content', 'Cada tarjeta muestra el curso, su instructor y estado. Desde aquí puedes aprobar, rechazar, ver detalles o eliminar cursos definitivamente.'),
    data: {
      icon: <LayoutGrid className="w-5 h-5 text-accent" />
    }
  }
];
