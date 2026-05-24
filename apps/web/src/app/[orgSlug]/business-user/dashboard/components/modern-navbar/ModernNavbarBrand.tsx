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
      <div className="flex items-center gap-3">
        <div className="relative">
          {(organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url) ? (
            <div className="relative flex items-center justify-center h-10 sm:h-12 w-auto min-w-[36px] transition-transform hover:scale-105">
              <Image
                src={organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url || '/icono.png'}
                alt={organization?.name || 'Organización'}
                width={180}
                height={48}
                className="object-contain h-10 sm:h-12 w-auto max-w-[140px] sm:max-w-[180px] rounded-lg"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = '/icono.png';
                }}
              />
            </div>
          ) : (
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                boxShadow: `0 4px 20px ${colors.primary}30`,
              }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
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
            <h1 className="text-sm sm:text-base font-bold leading-tight tracking-tight truncate max-w-[200px] sm:max-w-[300px]" style={{ color: colors.text }}>
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
      </div>
    </div>
  );
}
