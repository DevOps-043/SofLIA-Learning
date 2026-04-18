'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchStudyPlanStatus, getModernNavbarColors } from './service';
import type { ModernNavbarStyleConfig } from './types';

export function useModernNavbar(
  styles: ModernNavbarStyleConfig | null | undefined,
  resolvedTheme: string | null | undefined,
  initializeTheme: () => void,
  organizationSlug?: string | null
) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = useMemo(() => getModernNavbarColors(styles, resolvedTheme), [resolvedTheme, styles]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!(userDropdownOpen || mobileMenuOpen) || hasStudyPlan !== null) {
      return;
    }

    const loadStudyPlan = async () => {
      setHasStudyPlan(await fetchStudyPlanStatus(fetch, organizationSlug));
    };

    void loadStudyPlan();
  }, [hasStudyPlan, mobileMenuOpen, organizationSlug, userDropdownOpen]);

  useEffect(() => {
    setHasStudyPlan(null);
  }, [organizationSlug]);

  const closeDesktopMenu = () => {
    setUserDropdownOpen(false);
    setActiveSubmenu(null);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveSubmenu(null);
  };

  return {
    activeSubmenu,
    colors,
    closeDesktopMenu,
    closeMobileMenu,
    dropdownRef,
    hasStudyPlan,
    mounted,
    mobileMenuOpen,
    setActiveSubmenu,
    setMobileMenuOpen,
    setUserDropdownOpen,
    userDropdownOpen,
  };
}
