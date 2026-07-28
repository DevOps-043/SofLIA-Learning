import Link from 'next/link';
import { Ban, LifeBuoy } from 'lucide-react';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';

export default function BannedPage() {
  return (
    <AuthExperience>
      <div className={authExperienceStyles.content}>
        <header className={authExperienceStyles.header}>
          <span className={authExperienceStyles.iconBadge}>
            <Ban className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className={authExperienceStyles.title}>Cuenta suspendida</h1>
          <p className={authExperienceStyles.subtitle}>
            El acceso a esta cuenta se encuentra suspendido de forma permanente
            por incumplimientos reiterados de las reglas de la comunidad.
          </p>
        </header>

        <div className={authExperienceStyles.status}>
          <LifeBuoy className="h-5 w-5 flex-none" aria-hidden="true" />
          <p>
            Si consideras que se trata de un error, contacta al equipo de soporte
            para solicitar una revisión del caso.
          </p>
        </div>

        <div className={authExperienceStyles.actions}>
          <Link href="/contact" className={authExperienceStyles.primaryButton}>
            Contactar a soporte
          </Link>
          <Link href="/" className={authExperienceStyles.backLink}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </AuthExperience>
  );
}
