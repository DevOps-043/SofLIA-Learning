import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { Network, LayoutGrid, Settings, GitBranchPlus } from 'lucide-react';

export const ADMIN_HIERARCHY_TOUR_ID = 'admin-hierarchy-tour';

export const getAdminHierarchySteps = (t: TFunction): Step[] => [
  {
    target: '#tour-hierarchy-header',
    title: t('adminTour.steps.hierarchyHeader.title', 'Estructura Organizacional'),
    content: t('adminTour.steps.hierarchyHeader.content', 'Desde aquí gestionas los niveles organizacionales de tu empresa: regiones, zonas y equipos para una administración granular.'),
    disableBeacon: true,
    data: {
      icon: <Network className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-hierarchy-tabs',
    title: t('adminTour.steps.hierarchyTabs.title', 'Vistas Disponibles'),
    content: t('adminTour.steps.hierarchyTabs.content', 'Alterna entre la Vista de Árbol para explorar la jerarquía visualmente y la Configuración para ajustar los niveles y nombres de tu estructura.'),
    data: {
      icon: <LayoutGrid className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-hierarchy-content',
    title: t('adminTour.steps.hierarchyContent.title', 'Panel Principal'),
    content: t('adminTour.steps.hierarchyContent.content', 'Aquí se muestra el contenido de la vista seleccionada. En la vista de árbol puedes crear, editar y eliminar nodos. En configuración, ajusta la nomenclatura de cada nivel.'),
    data: {
      icon: <GitBranchPlus className="w-5 h-5 text-accent" />
    }
  }
];
