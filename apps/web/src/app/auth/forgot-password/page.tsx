import { Suspense } from 'react';
import { ForgotPasswordForm } from '../../../features/auth/components/ForgotPasswordForm';

export const metadata = {
  title: 'Recuperar Contraseña | SOFLIA',
  description: 'Solicita un enlace para restablecer tu contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
