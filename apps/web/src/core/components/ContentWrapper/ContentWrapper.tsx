'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Obtener estado del panel de LIA (con fallback si no está en el contexto)
  let isPanelOpen = false;
  try {
    const liaPanel = useLiaPanel();
    isPanelOpen = liaPanel.isOpen;
  } catch {
    // Si no está dentro del LiaPanelProvider, ignorar
  }

  // Detectar si estamos en rutas que tienen su propio sistema de temas
  const isCustomThemedRoute = pathname?.includes('/business-panel') || pathname?.includes('/business-user');
  
  // Detectar si estamos en rutas que manejan su propio layout (admin tiene su propio sistema)
  const isAdminRoute = pathname?.startsWith('/admin');

  // Estado para controlar el estilo y evitar hydration mismatch
  const [contentStyle, setContentStyle] = React.useState<React.CSSProperties>({ paddingRight: '0px' });

  React.useEffect(() => {
    // Calcular padding solo en el cliente después del montaje
    // Usar un timeout pequeño para asegurar que el contexto de LIA esté listo si es necesario
    const newPadding = isPanelOpen && !isAdminRoute && !isCustomThemedRoute ? '420px' : '0px';
    setContentStyle({ paddingRight: newPadding });
  }, [isPanelOpen, isAdminRoute, isCustomThemedRoute]);

  // Si es una ruta con tema personalizado (business-panel, business-user),
  // no aplicar fondo para evitar conflictos con el tema de la organización
  const bgClass = isCustomThemedRoute ? '' : 'bg-[var(--color-bg-dark)]';

  return (
    <div
      className={`${bgClass} min-h-full transition-all duration-300 ease-in-out`}
      style={contentStyle}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

