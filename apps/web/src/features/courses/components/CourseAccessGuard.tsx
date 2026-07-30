'use client';

import { useRouter } from 'next/navigation';
import { useCourseAccess } from '../hooks/useCourseAccess';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen';

interface CourseAccessGuardProps {
    courseSlug: string;
    children: React.ReactNode;
}

/**
 * Componente que verifica el acceso al curso antes de renderizar el contenido
 * Muestra un loader mientras verifica, y un mensaje de error si no tiene acceso
 */
export function CourseAccessGuard({ courseSlug, children }: CourseAccessGuardProps) {
    const router = useRouter();
    const { hasAccess, isLoading, error } = useCourseAccess(courseSlug);
    const { user } = useAuth();

    // Mostrar loader mientras verifica el acceso
    if (isLoading || hasAccess === null) {
        return (
            <PremiumLoadingScreen
                description="Confirmando tu inscripción y permisos de aprendizaje."
                label="Verificando acceso"
            />
        );
    }

    // Mostrar mensaje de error si no tiene acceso
    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-carbon-900 p-4">
                <div className="max-w-md w-full bg-carbon-800 rounded-2xl border border-gray-500/30 p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Acceso Restringido
                    </h2>

                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm text-left">
                            {error || 'No tienes acceso a este curso'}
                        </p>
                    </div>

                    <p className="text-white/60 mb-6">
                        Para acceder al contenido de este curso, primero debes adquirirlo o inscribirte en él.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.push(`/courses/${courseSlug}`)}
                            className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Ver Curso
                        </button>
                        <button
                            onClick={() => {
                                if (user?.organization?.slug) {
                                    router.push(`/${user.organization.slug}/dashboard`);
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Ir al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Si tiene acceso, renderizar el contenido
    return <>{children}</>;
}
