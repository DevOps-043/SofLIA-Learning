'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { 
  MessageSquare, 
  Users, 
  Chrome, 
  Linkedin, 
  Zap, 
  Send,
  Link2,
  Globe,
  Cloud
} from 'lucide-react';

const integrations = [
  { name: 'Slack', icon: MessageSquare, color: '#4A154B' },
  { name: 'Microsoft Teams', icon: Users, color: '#6264A7' },
  { name: 'Google Workspace', icon: Chrome, color: '#4285F4' },
  { name: 'Zoom', icon: Zap, color: '#2D8CFF' },
  { name: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
  { name: 'API REST', icon: Link2, color: '#00D2FF' },
  { name: 'Webhooks', icon: Cloud, color: '#7C3AED' },
  { name: 'SSO', icon: Globe, color: '#10B981' },
];

export function IntegrationsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-4xl lg:text-5xl font-bold mb-6"
            variants={fadeIn}
          >
            Integraciones Potentes
          </motion.h2>
          <motion.p
            className="text-xl max-w-3xl mx-auto"
            variants={fadeIn}
          >
            Conecta SofLIA Learning Business con tus herramientas favoritas
          </motion.p>
        </motion.div>

        {/* Integrations Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {integrations.map((integration, index) => {
            const IconComponent = integration.icon;
            return (
              <motion.div
                key={index}
                variants={staggerItem}
                className="group cursor-pointer"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="bg-glass border border-glass-light rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden">
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
                  
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <motion.div
                      className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/10 to-success/10 group-hover:from-primary/20 group-hover:to-success/20 transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <IconComponent className="w-8 h-8 text-primary" />
                    </motion.div>
                    <span className="text-sm font-semibold text-center">{integration.name}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm opacity-70">
            ¿Necesitas una integración específica?{' '}
            <a href="#contact" className="text-primary hover:underline font-medium">
              Contáctanos para desarrollarla
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

