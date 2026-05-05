import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { BookOpen, BarChart3, Filter, LayoutGrid } from 'lucide-react';

export const ADMIN_COURSES_TOUR_ID = 'admin-courses-tour';

export const getAdminCoursesSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-courses-hero',
    title: t('adminTour.steps.coursesHero.title', 'Catálogo de Cursos'),
    content: t('adminTour.steps.coursesHero.content', 'Este es tu centro de gestión de cursos. Desde aquí puedes explorar, buscar y administrar todo el contenido de aprendizaje disponible para tu organización.'),
    disableBeacon: true,
    data: {
      icon: <BookOpen className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-courses-stats',
    title: t('adminTour.steps.coursesStats.title', 'Estadísticas de Cursos'),
    content: t('adminTour.steps.coursesStats.content', 'Consulta métricas clave como el total de cursos disponibles, las categorías activas, los niveles de dificultad y el progreso general de tu equipo.'),
    data: {
      icon: <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-courses-filters',
    title: t('adminTour.steps.coursesFilters.title', 'Filtros y Búsqueda'),
    content: t('adminTour.steps.coursesFilters.content', 'Utiliza la barra de búsqueda y los filtros por categoría y nivel para encontrar rápidamente los cursos que necesitas.'),
    data: {
      icon: <Filter className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-courses-grid',
    title: t('adminTour.steps.coursesGrid.title', 'Tarjetas de Cursos'),
    content: t('adminTour.steps.coursesGrid.content', 'Cada tarjeta muestra la información clave del curso. Haz clic en cualquier curso para ver los detalles, módulos y asignar usuarios.'),
    data: {
      icon: <LayoutGrid className="w-5 h-5 text-[#00D4B3]" />
    }
  }
];
