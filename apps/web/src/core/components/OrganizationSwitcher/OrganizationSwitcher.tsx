'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { cn } from '@/lib/utils/cn';
import { useOrganization, Organization } from '@/core/hooks/useOrganization';
import { resolveOrganizationBrandColors } from '@/core/theme/organization-brand-colors';

interface OrganizationSwitcherProps {
  /** Additional CSS classes */
  className?: string;

  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal';

  /** Show only when user has multiple organizations */
  hideIfSingle?: boolean;

  /** Callback when organization changes */
  onOrganizationChange?: (org: Organization) => void;
}

/**
 * Organization Switcher Component
 *
 * Allows users with multiple organization memberships to switch between them.
 * Displays the current organization with logo and name.
 *
 * @example
 * ```tsx
 * // In header/navbar
 * <OrganizationSwitcher variant="default" />
 *
 * // Compact version for sidebars
 * <OrganizationSwitcher variant="compact" />
 *
 * // Only show when needed
 * <OrganizationSwitcher hideIfSingle />
 * ```
 */
export function OrganizationSwitcher({
  className,
  variant = 'default',
  hideIfSingle = false,
  onOrganizationChange,
}: OrganizationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentOrganization,
    organizations,
    canSwitch,
    switchOrganization,
    isLoading,
  } = useOrganization();

  // Don't render if user has no organizations (B2C)
  if (!currentOrganization || organizations.length === 0) {
    return null;
  }

  // Optionally hide if user has only one organization
  if (hideIfSingle && !canSwitch) {
    return null;
  }

  const handleValueChange = (value: string) => {
    const org = organizations.find((o) => o.id === value);
    if (org && org.id !== currentOrganization.id) {
      switchOrganization(org.slug);
      onOrganizationChange?.(org);
    }
    setIsOpen(false);
  };

  // Render organization logo or fallback icon
  const renderOrgLogo = (org: Organization, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
    const logoUrl = org.brandLogoUrl || org.logoUrl;

    if (logoUrl) {
      return (
        <div
          className={cn(
            sizeClasses,
            'rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Image
            src={logoUrl}
            alt={`${org.name} logo`}
            width={size === 'sm' ? 24 : 32}
            height={size === 'sm' ? 24 : 32}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // Fallback: colored icon with first letter (gateado por brandingEnabled).
    const brand = resolveOrganizationBrandColors(org);
    const bgColor = brand.hasBranding ? brand.primaryColor : 'var(--color-info)';
    return (
      <div
        className={cn(
          sizeClasses,
          'rounded-lg flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs'
        )}
        style={{ backgroundColor: bgColor }}
      >
        {org.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Minimal variant - just icon
  if (variant === 'minimal') {
    return (
      <Select.Root
        value={currentOrganization.id}
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={!canSwitch || isLoading}
      >
        <Select.Trigger
          className={cn(
            'p-2 rounded-lg',
            'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          aria-label="Switch organization"
        >
          {renderOrgLogo(currentOrganization, 'sm')}
        </Select.Trigger>
        {renderDropdown(
          organizations,
          currentOrganization,
          isOpen,
          renderOrgLogo
        )}
      </Select.Root>
    );
  }

  // Compact variant - icon + dropdown arrow
  if (variant === 'compact') {
    return (
      <Select.Root
        value={currentOrganization.id}
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={!canSwitch || isLoading}
      >
        <Select.Trigger
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-white dark:bg-carbon-800',
            'border border-gray-200 dark:border-gray-700',
            'hover:border-primary/50 dark:hover:border-primary/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen && 'ring-2 ring-primary/20 border-primary',
            className
          )}
        >
          {renderOrgLogo(currentOrganization, 'sm')}
          {canSwitch && (
            <Select.Icon asChild>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  isOpen && 'rotate-180 text-primary'
                )}
              />
            </Select.Icon>
          )}
        </Select.Trigger>
        {renderDropdown(
          organizations,
          currentOrganization,
          isOpen,
          renderOrgLogo
        )}
      </Select.Root>
    );
  }

  // Default variant - full display
  return (
    <Select.Root
      value={currentOrganization.id}
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
      disabled={!canSwitch || isLoading}
    >
      <Select.Trigger
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl w-full max-w-[280px]',
          'bg-white dark:bg-carbon-800',
          'border border-gray-200 dark:border-gray-700',
          'hover:border-primary/50 dark:hover:border-primary/50',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-primary/20 border-primary shadow-lg',
          className
        )}
      >
        {renderOrgLogo(currentOrganization)}

        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentOrganization.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {getRoleLabel(currentOrganization.role)}
          </div>
        </div>

        {canSwitch && (
          <Select.Icon asChild>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200',
                isOpen && 'rotate-180 text-primary'
              )}
            />
          </Select.Icon>
        )}
      </Select.Trigger>

      {renderDropdown(
        organizations,
        currentOrganization,
        isOpen,
        renderOrgLogo
      )}
    </Select.Root>
  );
}

// Helper to render dropdown content
function renderDropdown(
  organizations: Organization[],
  currentOrganization: Organization,
  isOpen: boolean,
  renderOrgLogo: (org: Organization, size?: 'sm' | 'md') => React.ReactNode
) {
  return (
    <Select.Portal>
      <Select.Content
        className={cn(
          'bg-white dark:bg-carbon-800',
          'rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700',
          'z-50 min-w-[var(--radix-select-trigger-width)] max-h-[300px]',
          'overflow-hidden'
        )}
        position="popper"
        sideOffset={8}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full"
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cambiar organizacion
                </p>
              </div>

              <Select.Viewport className="p-2 max-h-[250px] overflow-y-auto">
                {organizations.map((org, index) => (
                  <Select.Item
                    key={org.id}
                    value={org.id}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'cursor-pointer select-none',
                      'focus:bg-primary/10 dark:focus:bg-primary/20',
                      'focus:outline-none',
                      'transition-colors duration-150',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      org.id === currentOrganization.id &&
                        'bg-primary/10 dark:bg-primary/20'
                    )}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {renderOrgLogo(org, 'sm')}

                      <div className="flex-1 min-w-0">
                        <Select.ItemText asChild>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                            {org.name}
                          </span>
                        </Select.ItemText>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {getRoleLabel(org.role)}
                        </span>
                      </div>
                    </motion.div>

                    <Select.ItemIndicator className="flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </motion.div>
          )}
        </AnimatePresence>
      </Select.Content>
    </Select.Portal>
  );
}

// Helper to get role label in Spanish
function getRoleLabel(role: Organization['role']): string {
  switch (role) {
    case 'owner':
      return 'Propietario';
    case 'admin':
      return 'Administrador';
    case 'member':
      return 'Miembro';
    default:
      return 'Miembro';
  }
}

export default OrganizationSwitcher;
