import { Step } from 'react-joyride';
import { TFunction } from 'i18next';
import { UserPlus, BarChart3, Filter, Users, Send } from 'lucide-react';

export const ADMIN_USERS_TOUR_ID = 'admin-users-tour';

export const getAdminUsersSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-users-actions',
    title: t('adminTour.steps.usersActions.title', 'Gestión de Usuarios'),
    content: t('adminTour.steps.usersActions.content', 'Desde aquí puedes invitar nuevos usuarios, importar por lotes o descargar la plantilla de carga.'),
    disableBeacon: true,
    data: {
      icon: <Send className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-users-add-button',
    title: t('adminTour.steps.usersAdd.title', 'Crear Usuario Directo'),
    content: t('adminTour.steps.usersAdd.content', 'Utiliza este botón para crear una cuenta de usuario manualmente sin necesidad de invitación por correo.'),
    data: {
      icon: <UserPlus className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-users-stats',
    title: t('adminTour.steps.usersStats.title', 'Métricas de Equipo'),
    content: t('adminTour.steps.usersStats.content', 'Visualiza rápidamente cuántos usuarios están activos, invitados o pendientes de aprobación.'),
    data: {
      icon: <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-users-filters',
    title: t('adminTour.steps.usersFilters.title', 'Filtros y Búsqueda'),
    content: t('adminTour.steps.usersFilters.content', 'Busca usuarios específicos o filtra por rol, estado, región o equipo para una mejor organización.'),
    data: {
      icon: <Filter className="w-5 h-5 text-[#00D4B3]" />
    }
  },
  {
    target: '#tour-users-list',
    title: t('adminTour.steps.usersList.title', 'Listado de Usuarios'),
    content: t('adminTour.steps.usersList.content', 'Aquí puedes ver a todos los miembros. Haz clic en un usuario para ver sus estadísticas o gestionar su cuenta.'),
    data: {
      icon: <Users className="w-5 h-5 text-[#00D4B3]" />
    }
  }
];
