'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuestionnaireValidation } from '@/features/auth/hooks/useQuestionnaireValidation';

export default function WelcomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isRequired, isLoading: isLoadingValidation, status } = useQuestionnaireValidation(user?.id);
  const [isChecking, setIsChecking] = useState(true);

  const oauthParam = searchParams?.get('oauth');

  useEffect(() => {
    if (authLoading || isLoadingValidation) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    // Si no es usuario OAuth, redirigir al dashboard
    if (!status?.isGoogleOAuth) {
      router.push('/dashboard');
      return;
    }

    // Si ya completó el cuestionario, redirigir al dashboard
    if (!isRequired) {
      router.push('/dashboard');
      return;
    }

    // Si es usuario OAuth y necesita cuestionario, mostrar la pantalla
    setIsChecking(false);
  }, [user, authLoading, isLoadingValidation, isRequired, status, router]);

  const handleContinue = () => {
    router.push('/statistics');
  };

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-white text-lg">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  if (!status?.isGoogleOAuth || !isRequired) {
    return null; // Se redirigirá automáticamente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header con icono */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-full mb-6"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ¡Bienvenido a SofLIA!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Estamos emocionados de tenerte aquí
            </p>
          </div>

          {/* Contenido principal */}
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Antes de comenzar, necesitamos conocerte mejor
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Para personalizar tu experiencia y recomendarte el contenido más relevante, 
                necesitamos que completes un breve cuestionario sobre tu perfil profesional.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Este cuestionario nos ayudará a:
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Recomendarte cursos y contenido adaptado a tu rol</span>
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Conectarte con comunidades relevantes para tu área</span>
                </li>
                <li className="flex items-start text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Proporcionarte estadísticas personalizadas sobre tu progreso</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Nota importante:</strong> Este cuestionario es obligatorio para usuarios que se registran con Google. 
                No podrás acceder a todas las funcionalidades hasta completarlo.
              </p>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-purple-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Continuar al Cuestionario</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

