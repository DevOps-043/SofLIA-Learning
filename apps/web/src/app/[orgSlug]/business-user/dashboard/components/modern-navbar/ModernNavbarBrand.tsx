import { motion } from 'framer-motion';
import { Building2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { TFunction } from 'i18next';
import type { ModernNavbarColors, ModernNavbarOrganization } from './types';

interface ModernNavbarBrandProps {
  colors: ModernNavbarColors;
  organization: ModernNavbarOrganization | null;
  t: TFunction<'business', undefined>;
}

export function ModernNavbarBrand({ colors, organization, t }: ModernNavbarBrandProps) {
  return (
    <div className="flex items-center gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-3"
      >
        <div className="relative">
          {organization?.favicon_url || organization?.logo_url ? (
            <motion.div
              className="relative h-16 w-auto min-w-[36px] flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Image
                src={organization.logo_url || organization.favicon_url || '/icono.png'}
                alt={organization.name}
                width={64}
                height={64}
                className="object-contain h-full w-auto"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = '/icono.png';
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              className="h-11 w-11 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                boxShadow: `0 4px 20px ${colors.primary}30`,
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </motion.div>
          )}

          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.isLightMode ? colors.cardBg : (colors.navBg.includes('rgba') ? colors.cardBg : colors.navBg),
            }}
          />
        </div>

        {organization?.show_navbar_name !== false && (
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight tracking-tight" style={{ color: colors.text }}>
              {organization?.name || t('header.myOrganization')}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
              <p className="text-xs font-medium" style={{ color: `${colors.accent}CC` }}>
                {t('header.learningPanel')}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
