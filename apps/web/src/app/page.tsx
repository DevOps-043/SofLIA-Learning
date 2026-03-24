'use client';

import React from 'react';
import { 
  LandingHeader,
  HeroSectionB2B,
  TrustSection,
  PlatformOverview,
  CapabilitiesGrid,
  UseCasesSection,
  ROIImpactSection,
  IntegrationsSection,
  SecuritySection,
  LandingFAQSection,
  FinalCTASection,
  LandingFooter,
} from '../features/landing';
import { PWAPrompt } from '../core/components/PWAPrompt';

export default function HomePage() {
  return (
    <main className="bg-white dark:bg-[#0F1419] transition-colors duration-300">
      {/* Header - Navigation B2B */}
      <LandingHeader />
      
      {/* Hero - Orientado a C-level */}
      <HeroSectionB2B />
      

      
      {/* Señales de Confianza - Enterprise-ready */}
      <TrustSection />
      
      {/* Qué es SofLIA - Explicación ejecutiva */}
      <PlatformOverview />
      
      {/* Capacidades Clave - Feature â†’ Beneficio â†’ Resultado */}
      <CapabilitiesGrid />
      
      {/* Casos de Uso - Dolor â†’ Solución â†’ Resultado */}
      <UseCasesSection />
      
      {/* Impacto ROI - Métricas para CFO */}
      <ROIImpactSection />
      
      {/* Integraciones - Stack corporativo */}
      <IntegrationsSection />
      
      {/* Seguridad y Gobierno - Enterprise control */}
      <SecuritySection />
      
      {/* FAQ - Preguntas C-level */}
      <LandingFAQSection />
      
      {/* CTA Final - Formulario de contacto */}
      <FinalCTASection />
      
      {/* Footer Corporativo */}
      <LandingFooter />
      
      {/* PWA Install Prompt */}
      <PWAPrompt />
    </main>
  );
}
