"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, Sun, Moon, Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeStore, Theme } from "@/core/stores/themeStore";
import { useLanguage } from "@/core/providers/I18nProvider";
import type { SupportedLanguage } from "@/core/i18n/i18n";

const navLinks = [
  { key: "home", href: "/" },
];

export function LandingHeader() {
  const { t } = useTranslation("common");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Theme
  const { theme, setTheme, initializeTheme } = useThemeStore();

  // Language
  const { language, setLanguage } = useLanguage();

  const languageOptions: { value: SupportedLanguage; label: string; flag: string }[] = [
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'pt', label: 'Português', flag: '🇧🇷' },
  ];

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-dropdown') && !target.closest('.language-dropdown')) {
        setIsThemeDropdownOpen(false);
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-white dark:bg-[#0F1419] shadow-lg shadow-black/5 dark:shadow-black/20"
        : "bg-white dark:bg-[#0F1419]"
        }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo + Nav Links Group */}
          <div className="flex items-center gap-1 lg:gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 lg:w-12 lg:h-12"
              >
                <Image
                  src="/Logo.png"
                  alt="SOFLIA"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
              <div className="text-xl lg:text-2xl font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                <span>SOFLIA</span>
                <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-[#00D4B3] rounded-md tracking-wide uppercase">
                  Learning
                </span>
              </div>
            </Link>

            {/* Inline Nav Links next to logo */}
            <div className="hidden lg:flex items-center gap-1 ml-2">
              {navLinks.map((link) => {
                const isInternal = link.href.startsWith("/") && link.href.length > 1;

                if (isInternal) {
                  return (
                    <Link
                      key={link.key}
                      href={link.href}
                      className="px-4 py-2 text-sm font-medium text-[#6C757D] hover:text-[#0A2540] dark:text-white/70 dark:hover:text-white transition-colors rounded-lg hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5"
                    >
                      <motion.span whileHover={{ scale: 1.02 }}>
                        {t(`landing.nav.${link.key}`, link.key)}
                      </motion.span>
                    </Link>
                  );
                }

                return (
                  <motion.a
                    key={link.key}
                    href={link.href}
                    whileHover={{ scale: 1.02 }}
                    className="px-4 py-2 text-sm font-medium text-[#6C757D] hover:text-[#0A2540] dark:text-white/70 dark:hover:text-white transition-colors rounded-lg hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5"
                  >
                    {t(`landing.nav.${link.key}`, link.key)}
                  </motion.a>
                );
              })}

              {/* Download Hub - next to Inicio */}
              <Link href="/downloads">
                <motion.span
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 8px 30px rgba(0, 212, 179, 0.3)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-block px-4 py-2 text-sm font-medium text-[#00D4B3] hover:text-[#00bda0] transition-colors rounded-lg hover:bg-[#00D4B3]/10 cursor-pointer"
                >
                  {t("landing.nav.downloadHub", "Descargar Hub")}
                </motion.span>
              </Link>
            </div>
          </div>



          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative language-dropdown">
              <motion.button
                onClick={() => {
                  setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                  setIsThemeDropdownOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl text-[#6C757D] hover:text-[#0A2540] dark:text-white/70 dark:hover:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-white/10 transition-all"
                aria-label="Cambiar idioma"
              >
                <Globe size={20} />
              </motion.button>

              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-[#1A2332] rounded-xl shadow-xl border border-[#E9ECEF] dark:border-white/10 overflow-hidden z-50"
                  >
                    {languageOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => {
                          setLanguage(option.value);
                          setIsLanguageDropdownOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${language === option.value
                          ? 'bg-[#00D4B3]/10 text-[#00D4B3]'
                          : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className="text-lg">{option.flag}</span>
                        <span className="text-sm font-medium">{option.label}</span>
                        {language === option.value && (
                          <Check size={16} className="ml-auto text-[#00D4B3]" />
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <div className="relative theme-dropdown">
              <motion.button
                onClick={() => {
                  setIsThemeDropdownOpen(!isThemeDropdownOpen);
                  setIsLanguageDropdownOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl text-[#6C757D] hover:text-[#0A2540] dark:text-white/70 dark:hover:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-white/10 transition-all"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.button>

              <AnimatePresence>
                {isThemeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-[#1A2332] rounded-xl shadow-xl border border-[#E9ECEF] dark:border-white/10 overflow-hidden z-50"
                  >
                    <motion.button
                      onClick={() => {
                        setTheme('light');
                        setIsThemeDropdownOpen(false);
                      }}
                      whileHover={{ x: 4 }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${theme === 'light'
                        ? 'bg-[#00D4B3]/10 text-[#00D4B3]'
                        : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5'
                        }`}
                    >
                      <Sun size={18} />
                      <span className="text-sm font-medium">Claro</span>
                      {theme === 'light' && <Check size={16} className="ml-auto text-[#00D4B3]" />}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setTheme('dark');
                        setIsThemeDropdownOpen(false);
                      }}
                      whileHover={{ x: 4 }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${theme === 'dark'
                        ? 'bg-[#00D4B3]/10 text-[#00D4B3]'
                        : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5'
                        }`}
                    >
                      <Moon size={18} />
                      <span className="text-sm font-medium">Oscuro</span>
                      {theme === 'dark' && <Check size={16} className="ml-auto text-[#00D4B3]" />}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-[#E9ECEF] dark:bg-white/10 mx-1" />

            {/* Client Access */}
            <Link href="/auth">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block px-4 py-2.5 text-sm font-medium text-[#0A2540] dark:text-white/80 hover:text-[#00D4B3] transition-colors cursor-pointer"
              >
                {t("landing.nav.clientAccess", "Acceso clientes")}
              </motion.span>
            </Link>



            {/* Demo CTA */}
            <a href="#contact">
              <motion.span
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 8px 30px rgba(10, 37, 64, 0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                className="inline-block px-5 py-2.5 text-sm font-medium text-white bg-[#0A2540] hover:bg-[#0d2f4d] rounded-xl shadow-lg shadow-[#0A2540]/25 transition-all duration-300 cursor-pointer"
              >
                {t("landing.nav.scheduleDemo", "Agendar demo")}
              </motion.span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-white dark:bg-[#0F1419] border-t border-[#E9ECEF] dark:border-white/10"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => {
                  const isInternal = link.href.startsWith("/");
                  
                  if (isInternal) {
                    return (
                      <Link
                        key={link.key}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-medium text-[#0A2540] dark:text-white rounded-xl hover:bg-[#E9ECEF] dark:hover:bg-white/5 transition-colors"
                      >
                        <motion.span
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {t(`landing.nav.${link.key}`, link.key)}
                        </motion.span>
                      </Link>
                    );
                  }
                  
                  return (
                    <motion.a
                      key={link.key}
                      href={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 text-base font-medium text-[#0A2540] dark:text-white rounded-xl hover:bg-[#E9ECEF] dark:hover:bg-white/5 transition-colors"
                    >
                      {t(`landing.nav.${link.key}`, link.key)}
                    </motion.a>
                  );
                })}

                <div className="h-px bg-[#E9ECEF] dark:bg-white/10 my-2" />

                {/* Mobile Theme and Language Selectors */}
                <div className="flex items-center gap-3 px-4 py-2">
                  {/* Language Options */}
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#6C757D] dark:text-white/70" />
                    <div className="flex gap-1">
                      {languageOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          onClick={() => setLanguage(option.value)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all ${language === option.value
                            ? 'bg-[#00D4B3]/20 text-[#00D4B3]'
                            : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF] dark:hover:bg-white/10'
                            }`}
                        >
                          {option.flag}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="w-px h-6 bg-[#E9ECEF] dark:bg-white/10" />

                  {/* Theme Options */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setTheme('light')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg transition-all ${theme === 'light'
                        ? 'bg-[#00D4B3]/20 text-[#00D4B3]'
                        : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF] dark:hover:bg-white/10'
                        }`}
                    >
                      <Sun size={18} />
                    </motion.button>
                    <motion.button
                      onClick={() => setTheme('dark')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg transition-all ${theme === 'dark'
                        ? 'bg-[#00D4B3]/20 text-[#00D4B3]'
                        : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF] dark:hover:bg-white/10'
                        }`}
                    >
                      <Moon size={18} />
                    </motion.button>
                  </div>
                </div>

                <div className="h-px bg-[#E9ECEF] dark:bg-white/10 my-2" />

                <Link
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-[#6C757D] dark:text-white/70 rounded-xl hover:bg-[#E9ECEF] dark:hover:bg-white/5 transition-colors"
                >
                  {t("landing.nav.clientAccess", "Acceso clientes")}
                </Link>

                <Link
                  href="/downloads"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-[#00D4B3] rounded-xl hover:bg-[#00D4B3]/10 transition-colors"
                >
                  {t("landing.nav.downloadHub", "Descargar Hub")}
                </Link>

                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.span
                    whileTap={{ scale: 0.98 }}
                    className="block w-full px-4 py-3 text-base font-medium text-white bg-[#0A2540] rounded-xl shadow-lg text-center cursor-pointer"
                  >
                    {t("landing.nav.scheduleDemo", "Agendar demo")}
                  </motion.span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
