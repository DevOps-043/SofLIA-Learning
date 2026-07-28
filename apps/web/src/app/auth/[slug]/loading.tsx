import { Loader2 } from 'lucide-react';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';

export default function Loading() {
  return (
    <AuthExperience>
      <div className={authExperienceStyles.content}>
        <div className={authExperienceStyles.header}>
          <span className={authExperienceStyles.iconBadge}>
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </span>
          <p className={authExperienceStyles.subtitle}>
            Preparando el acceso de tu organización…
          </p>
        </div>
      </div>
    </AuthExperience>
  );
}
