'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Send, Building2, Mail, User, CheckCircle } from 'lucide-react';

export function FinalCTASection() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enviar datos al backend
      const response = await fetch('/api/landing/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'landing_cta',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', company: '' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="contact"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-gradient-to-b from-[#0A2540] to-[#0d2f4d] relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div 
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D4B3, transparent)' }}
        />
        <div 
          className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block px-4 py-2 rounded-full bg-[#00D4B3]/20 text-[#00D4B3] text-sm font-medium mb-6"
            >
              {t('landing.cta.tag', 'Comienza Hoy')}
            </motion.span>

            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t('landing.cta.title', 'Transforma la capacitación de tu organización')}
            </h2>

            <p className="text-lg lg:text-xl text-white/60 max-w-2xl mx-auto">
              {t('landing.cta.subtitle', 'Agenda una demo ejecutiva y descubre cómo SofLIA puede impulsar el desarrollo de tu equipo con resultados medibles.')}
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-white/10"
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle size={40} className="text-[#10B981]" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t('landing.cta.success.title', '¡Mensaje recibido!')}
                </h3>
                <p className="text-white/60">
                  {t('landing.cta.success.description', 'Nuestro equipo se pondrá en contacto contigo pronto para agendar tu demo.')}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('landing.cta.form.name', 'Tu nombre')}
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 transition-colors"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('landing.cta.form.email', 'tu@empresa.com')}
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Company Field */}
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={t('landing.cta.form.company', 'Nombre de tu empresa')}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 transition-colors"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#00D4B3] to-[#10B981] text-white font-medium text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#00D4B3]/25 hover:shadow-[#00D4B3]/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      {t('landing.cta.form.submit', 'Solicitar demo ejecutiva')}
                      <Send size={20} />
                    </>
                  )}
                </motion.button>

                {/* Secondary Option */}
                <p className="text-center text-white/40 text-sm">
                  {t('landing.cta.form.alternative', '¿Prefieres contactarnos directamente?')}{' '}
                  <a href="mailto:ernesto.hernandez@ecosdeliderazgo.com" className="text-[#00D4B3] hover:underline">
                    ernesto.hernandez@ecosdeliderazgo.com
                  </a>
                </p>
              </form>
            )}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/40 text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#10B981]" />
              <span>{t('landing.cta.trust.noCommitment', 'Sin compromiso')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#10B981]" />
              <span>{t('landing.cta.trust.demo', 'Demo personalizada')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#10B981]" />
              <span>{t('landing.cta.trust.response', 'Respuesta en 24h')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
