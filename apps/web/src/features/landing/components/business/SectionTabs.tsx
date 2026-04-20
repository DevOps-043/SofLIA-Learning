'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, GraduationCap } from 'lucide-react';
import { fadeIn } from '../../../../shared/utils/animations';

interface SectionTabsProps {
  activeTab: 'companies' | 'instructors';
  onTabChange: (tab: 'companies' | 'instructors') => void;
}

export function SectionTabs({ activeTab, onTabChange }: SectionTabsProps) {
  return (
    <motion.div
      className="flex justify-center mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
    >
      <div className="flex gap-4 relative bg-glass p-2 rounded-2xl border border-glass-light shadow-2xl max-w-2xl mx-auto">
        {/* Background Indicator con Glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl"
          initial={false}
          animate={{
            x: activeTab === 'companies' ? 0 : '100%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: 'calc(50% - 0.5rem)' }}
        />
        
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-xl blur-xl"
          initial={false}
          animate={{
            x: activeTab === 'companies' ? 0 : '100%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: 'calc(50% - 0.5rem)' }}
        />

        {/* Companies Tab */}
        <motion.button
          onClick={() => onTabChange('companies')}
          className={`flex-1 py-4 px-8 rounded-xl font-semibold transition-all relative z-10 flex items-center justify-center gap-2 ${
            activeTab === 'companies'
              ? 'text-white'
              : 'text-text-secondary hover:text-color-contrast'
          }`}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          <Building2 className={`w-5 h-5 ${activeTab === 'companies' ? 'text-white' : 'text-primary'}`} />
          <span className="font-bold text-lg">Para Empresas</span>
          {activeTab === 'companies' && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-success rounded-full animate-pulse" />
          )}
        </motion.button>

        {/* Instructors Tab */}
        <motion.button
          onClick={() => onTabChange('instructors')}
          className={`flex-1 py-4 px-8 rounded-xl font-semibold transition-all relative z-10 flex items-center justify-center gap-2 ${
            activeTab === 'instructors'
              ? 'text-white'
              : 'text-text-secondary hover:text-color-contrast'
          }`}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          <GraduationCap className={`w-5 h-5 ${activeTab === 'instructors' ? 'text-white' : 'text-primary'}`} />
          <span className="font-bold text-lg">Para Instructores</span>
          {activeTab === 'instructors' && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-success rounded-full animate-pulse" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

