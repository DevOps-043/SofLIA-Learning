'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { BusinessLogo } from '../BusinessLogo';
import { Menu, X, ChevronDown } from 'lucide-react';

export function BusinessNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/business/what-we-do', label: 'Lo que hacemos', dropdown: null },
    { href: '/business/how-it-works', label: 'Cómo lo hacemos', dropdown: null },
    { href: '/business/resources', label: 'Recursos', dropdown: null },
    { href: '/business/plans', label: 'Planes', dropdown: null },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md border-b bg-white/90 dark:bg-carbon-900/90 border-gray-200 dark:border-gray-500/30'
          : 'bg-white/50 dark:bg-carbon-900/50'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Business Logo - Left */}
          <div className="flex-shrink-0">
            <BusinessLogo />
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-8">
            <nav className="flex items-center gap-4 xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative whitespace-nowrap ${
                    pathname === link.href
                      ? 'text-primary dark:text-accent'
                      : 'text-gray-500 dark:text-white/70 hover:text-primary dark:hover:text-accent'
                  }`}
                  style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}
                >
                  {link.label}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="navbarIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <Link href="/auth?tab=register">
              <Button variant="primary" size="sm" className="bg-primary hover:bg-primary text-white shadow-lg whitespace-nowrap" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}>
                Comenzar
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t py-4"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href ? 'text-primary dark:text-accent' : 'text-gray-500 dark:text-white/70'
                    }`}
                    style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Link href="/auth?tab=register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full bg-primary hover:bg-primary text-white" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}>
                      Comenzar
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

