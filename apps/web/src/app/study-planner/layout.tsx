import { redirect } from 'next/navigation';
import { SessionService } from '../../features/auth/services/session.service';
import { OrganizationStylesProvider } from '../../features/business-panel/contexts/OrganizationStylesContext';
import { StudyPlannerTourWrapper } from '../../features/tours/components/StudyPlannerTourWrapper';

export default async function StudyPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar si el usuario está autenticado
  const user = await SessionService.getCurrentUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <OrganizationStylesProvider>
      <StudyPlannerTourWrapper>
        <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm py-2 px-4 text-center font-medium sticky top-0 z-50">
          ⚠️ Planificador en Desarrollo: Esta funcionalidad se encuentra en fase experimental y puede presentar malfuncionamientos.
        </div>
        {children}
      </StudyPlannerTourWrapper>
    </OrganizationStylesProvider>
  );
}

