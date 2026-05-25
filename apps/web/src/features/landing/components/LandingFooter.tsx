'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { FooterBottomBar } from './landing-footer/FooterBottomBar';
import { FooterBrand } from './landing-footer/FooterBrand';
import { FooterNavigation } from './landing-footer/FooterNavigation';

export function LandingFooter() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-12">
          <FooterBrand t={t} />
          <FooterNavigation t={t} />
        </div>
      </div>
      <FooterBottomBar currentYear={currentYear} t={t} />
    </footer>
  );
}
