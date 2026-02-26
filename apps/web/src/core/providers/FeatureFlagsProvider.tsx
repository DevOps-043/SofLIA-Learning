'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useOrganizationContext } from './OrganizationProvider';

// Definición de las feature flags requeridas por el plan de migración
export interface FeatureFlags {
  planner_v3_schema_ready: boolean;
  planner_v3_write_enabled: boolean;
  planner_v3_read_enabled: boolean;
  planner_v3_generate_enabled: boolean;
  calendar_optional_enabled: boolean;
  planner_v3_dual_write_legacy: boolean;
  planner_v3_ui: boolean; // Flag adicional para gobernar qué UI se muestra
}

// Valores por defecto seguros (Legacy mode = ON, V3 = OFF)
const defaultFlags: FeatureFlags = {
  planner_v3_schema_ready: false,
  planner_v3_write_enabled: false,
  planner_v3_read_enabled: false,
  planner_v3_generate_enabled: false,
  calendar_optional_enabled: false,
  planner_v3_dual_write_legacy: false,
  planner_v3_ui: false, 
};

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  setFlag: (key: keyof FeatureFlags, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { currentOrganization } = useOrganizationContext();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fase 0: Inicialización de banderas
    // En un futuro, aquí se consultaría el backend/Supabase basado en el currentOrganization.id
    // Por ahora, simulamos una carga y establecemos los valores por defecto
    const fetchFlags = async () => {
      setIsLoading(true);
      try {
        // Simular network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // TODO: Reemplazar con llamada real a API
        // const response = await fetch(`/api/organizations/${currentOrganization?.id}/feature-flags`);
        // const data = await response.json();
        const data = defaultFlags; // Mock
        
        // Para pruebas temporales, podrías forzar alguna bandera encendida basada en localstorage
        if (typeof window !== 'undefined') {
          const storedV3UI = localStorage.getItem('TEST_planner_v3_ui') === 'true';
          setFlags({ ...data, planner_v3_ui: storedV3UI });
        } else {
          setFlags(data);
        }

      } catch (error) {
        console.error('Error fetching feature flags:', error);
        setFlags(defaultFlags);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlags();
  }, [currentOrganization]);

  // Función útil para QA o testing local para alternar banderas en runtime
  const setFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => {
      const newFlags = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`TEST_${key}`, String(value));
      }
      return newFlags;
    });
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
