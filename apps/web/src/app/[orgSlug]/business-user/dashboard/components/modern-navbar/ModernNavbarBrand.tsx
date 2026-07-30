import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import Image from 'next/image';
import type { TFunction } from 'i18next';
import type { ModernNavbarColors, ModernNavbarOrganization } from './types';
import dashboardStyles from '../../page-components/BusinessUserDashboard.module.css';

interface ModernNavbarBrandProps {
  colors: ModernNavbarColors;
  organization: ModernNavbarOrganization | null;
  t: TFunction<'business', undefined>;
}

export function ModernNavbarBrand({ colors, organization, t }: ModernNavbarBrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex min-w-0 items-center gap-3"
      >
        <div className="relative">
          {(organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url) ? (
            <motion.div
              className="relative flex h-9 min-w-[36px] items-center justify-center sm:h-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Image
                src={organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url || '/icono.png'}
                alt={organization?.name || 'Organización'}
                width={180}
                height={48}
                className="h-9 w-auto max-w-[120px] rounded-lg object-contain sm:h-10 sm:max-w-[160px]"
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
                boxShadow: `0 4px 20px color-mix(in srgb, ${colors.primary} 18.8%, transparent)`,
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
            <p className={dashboardStyles.navBrandName} style={{ color: colors.text }}>
              {organization?.name || t('header.myOrganization')}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
