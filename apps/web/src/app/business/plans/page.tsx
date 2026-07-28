'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card, CardContent, Badge } from '@aprende-y-aplica/ui';
import { PricingSection } from '../../../features/landing/components/business/PricingSection';
import { ComparisonTable } from '../../../features/landing/components/business/ComparisonTable';
import { FAQSection } from '../../../features/landing/components/business/FAQSection';
import { TestimonialsSection } from '../../../features/landing/components/TestimonialsSection';
import { ContentService } from '../../../core/services/contentService';
import { BusinessPageContent } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer } from '../../../shared/utils/animations';
import { Check, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function PlansPage() {
  const [content, setContent] = useState<BusinessPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const result = await ContentService.getBusinessPageContent();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setContent(result.data);
        }
      } catch (err) {
        setError('Error al cargar el contenido');
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-carbon-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 dark:border-accent/30 border-t-primary dark:border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-white/70">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return <div>Error</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-carbon-900">
      {/* Pricing Section */}
      <section className="py-16 pt-32">
        <PricingSection
          title={content.companies.pricing.title}
          subtitle={content.companies.pricing.subtitle}
          tiers={content.companies.pricing.tiers}
        />
      </section>

      {/* Comparison Table */}
      <ComparisonTable
        title={content.companies.comparison.title}
        subtitle={content.companies.comparison.subtitle}
        categories={content.companies.comparison.categories}
      />

      {/* FAQs */}
      <FAQSection
        title={content.companies.faq.title}
        subtitle={content.companies.faq.subtitle}
        faqs={content.companies.faq.items}
        category="companies"
      />

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-carbon-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl font-bold mb-6 text-primary dark:text-white" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}>
              ¿Necesitas algo personalizado?
            </h2>
            <p className="text-xl mb-8 text-gray-500 dark:text-white/70" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}>
              Contacta con nuestro equipo para un plan Enterprise a medida
            </p>
            <Link href="/auth">
              <Button variant="primary" size="lg" className="group shadow-lg bg-primary hover:bg-primary text-white" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}>
                <span className="flex items-center gap-2">
                  Hablar con Ventas
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

