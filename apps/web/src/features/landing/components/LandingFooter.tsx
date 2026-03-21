'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  MapPin
} from 'lucide-react';

const footerSections = [
  {
    titleKey: 'platform',
    links: [
      { key: 'features', href: '#capabilities' },
      { key: 'lia', href: '#platform' },
      { key: 'studyPlanner', href: '#platform' },
      { key: 'analytics', href: '#platform' },
      { key: 'downloads', href: '/downloads' },
      { key: 'certificates', href: '#platform' },
    ],
  },
  {
    titleKey: 'solutions',
    links: [
      { key: 'upskilling', href: '#use-cases' },
      { key: 'onboarding', href: '#use-cases' },
      { key: 'sales', href: '#use-cases' },
      { key: 'partners', href: '#use-cases' },
      { key: 'customers', href: '#use-cases' },
    ],
  },
  {
    titleKey: 'resources',
    links: [
      { key: 'documentation', href: '#' },
      { key: 'liaLink', href: '#integrations' },
      { key: 'security', href: '#security' },
      { key: 'faq', href: '#faq' },
    ],
  },
  {
    titleKey: 'company',
    links: [
      { key: 'contact', href: '#contact' },
    ],
  },
];



export function LandingFooter() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A2540] text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative w-10 h-10 lg:w-12 lg:h-12">
                <Image
                  src="/Logo.png"
                  alt="SofLIA"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white tracking-wide">
                <span>SofLIA</span>
              </div>
            </Link>

            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              {t('landing.footer.description', 'Plataforma de capacitación corporativa en IA que transforma el desarrollo de talento con inteligencia artificial, planificación inteligente y certificaciones verificables.')}
            </p>
          </div>

          {/* Navigation Columns */}
          {footerSections.map((section) => (
            <div key={section.titleKey}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
                {t(`landing.footer.sections.${section.titleKey}`, section.titleKey)}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  return (
                    <li key={link.key}>
                      {isInternal ? (
                        <Link
                          href={link.href}
                          className="text-sm text-white/60 hover:text-[#00D4B3] transition-colors duration-200"
                        >
                          {t(`landing.footer.links.${link.key}`, link.key)}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-white/60 hover:text-[#00D4B3] transition-colors duration-200"
                        >
                          {t(`landing.footer.links.${link.key}`, link.key)}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>© {currentYear} SofLIA Learning</span>
              <span className="hidden md:inline">·</span>
              <span className="hidden md:flex items-center gap-1">
                <MapPin size={14} />
                México
              </span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-white/40 hover:text-white/80 transition-colors">
                {t('landing.footer.legal.privacy', 'Privacidad')}
              </a>
              <a href="/terms" className="text-white/40 hover:text-white/80 transition-colors">
                {t('landing.footer.legal.terms', 'Términos')}
              </a>
              <a href="#contact" className="text-white/40 hover:text-white/80 transition-colors">
                {t('landing.footer.legal.contact', 'Contacto')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
