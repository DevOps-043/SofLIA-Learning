import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { UserPlus, BarChart3, Filter, Users, Send } from 'lucide-react';

export const ADMIN_USERS_TOUR_ID = 'admin-users-tour';

export const getAdminUsersSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-users-actions',
    title: t('adminTour.steps.usersActions.title', 'Gestion de Usuarios'),
    content: t('adminTour.steps.usersActions.content', 'Desde aqui puedes invitar nuevos usuarios, importar por lotes o descargar la plantilla de carga.'),
    placement: 'bottom-end',
    skipBeacon: true,
    data: {
      icon: <Send className="w-5 h-5 text-accent" />,
    },
  },
  {
    target: '#tour-users-add-button',
    title: t('adminTour.steps.usersAdd.title', 'Crear Usuario Directo'),
    content: t('adminTour.steps.usersAdd.content', 'Utiliza este boton para crear una cuenta de usuario manualmente sin necesidad de invitacion por correo.'),
    placement: 'bottom',
    data: {
      icon: <UserPlus className="w-5 h-5 text-accent" />,
    },
  },
  {
    target: '#tour-users-stats',
    title: t('adminTour.steps.usersStats.title', 'Metricas de Equipo'),
    content: t('adminTour.steps.usersStats.content', 'Visualiza rapidamente cuantos usuarios estan activos, invitados o pendientes de aprobacion.'),
    placement: 'bottom',
    data: {
      icon: <BarChart3 className="w-5 h-5 text-accent" />,
    },
  },
  {
    target: '#tour-users-filters',
    title: t('adminTour.steps.usersFilters.title', 'Filtros y Busqueda'),
    content: t('adminTour.steps.usersFilters.content', 'Busca usuarios especificos o filtra por rol, estado, region o equipo para una mejor organizacion.'),
    placement: 'top',
    data: {
      icon: <Filter className="w-5 h-5 text-accent" />,
    },
  },
  {
    target: '#tour-users-list',
    title: t('adminTour.steps.usersList.title', 'Listado de Usuarios'),
    content: t('adminTour.steps.usersList.content', 'Aqui puedes ver a todos los miembros. Haz clic en un usuario para ver sus estadisticas o gestionar su cuenta.'),
    placement: 'top',
    data: {
      icon: <Users className="w-5 h-5 text-accent" />,
    },
  },
];
