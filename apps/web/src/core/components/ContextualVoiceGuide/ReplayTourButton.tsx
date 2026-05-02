'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import Image from 'next/image';

interface ReplayTourButtonProps {
  tourId: string;
  label?: string;
  allowedPaths: string[];
  requireAuth?: boolean;
}

export function ReplayTourButton({ 
  tourId, 
  label,
  allowedPaths,
  requireAuth = false 
}: ReplayTourButtonProps) {
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Usar traducción si no se proporciona un label personalizado
  const displayLabel = label || t('tours.viewGuidedTour');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Verificar si estamos en una ruta permitida
  const isAllowedPath = allowedPaths.some(path => pathname === path || pathname?.startsWith(path));
  if (!isAllowedPath) return null;

  // Verificar autenticación si es requerida
  if (requireAuth && !user) return null;

  const handleReplayTour = () => {
    // Disparar evento personalizado para abrir el tour manualmente
    // El componente ContextualVoiceGuide escuchará este evento
    const eventName = `open-tour-${tourId}`;
    window.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <button
      onClick={handleReplayTour}
      className="fixed bottom-20 left-4 z-[10000] px-3 py-2 bg-[#0A2540] hover:bg-[#0d2f4d] text-white text-xs rounded-lg shadow-lg transition-all duration-200 font-semibold flex items-center gap-2 hover:scale-105"
      title={displayLabel}
      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
    >
      <div className="relative w-6 h-6">
        <div className="w-6 h-6 rounded-full bg-[#00D4B3] p-0.5 animate-pulse-slow">
          <div className="w-full h-full rounded-full bg-[#0A2540] flex items-center justify-center overflow-hidden">
            <Image
              src="/lia-avatar.webp"
              alt="LIA"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <span>{displayLabel}</span>
    </button>
  );
}
