import { Suspense } from 'react';
import { ResetPasswordForm } from '../../../features/auth/components/ResetPasswordForm';

export const metadata = {
  title: 'Restablecer Contraseña | Aprende y Aplica',
  description: 'Crea una nueva contraseña segura para tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
