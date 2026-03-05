'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Monitor,
  Apple,
  Info,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ChevronDown,
  Sparkles,
  Github,
  Bot,
  Cpu,
  Globe,
  RefreshCw,
  MessageSquare,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Plus,
  Wrench,
  ArrowUpDown,
  Trash2,
  FileText,
  Layers,
  FolderKanban,
  MessageCircle,
  Search,
  Settings
} from 'lucide-react';
import { LandingHeader } from '../../features/landing/components/LandingHeader';
import { LandingFooter } from '../../features/landing/components/LandingFooter';

const RELEASES_API = '/api/releases';

interface Asset {
  url: string;
  size: string;
  name: string;
}

interface ReleaseData {
  version: string;
  notes: string;
  date: string;
  assets: {
    windows?: Asset;
    mac?: Asset;
  };
}

export default function DownloadsPage() {
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchRelease = () => {
    setLoading(true);
    setError(null);

    fetch(RELEASES_API)
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('rate_limit');
          if (res.status === 404) throw new Error('not_found');
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.assets || !Array.isArray(data.assets)) {
          throw new Error('invalid_response');
        }

        const assets: { windows?: Asset; mac?: Asset } = {};
        for (const asset of data.assets) {
          if (asset.name.includes('Windows') && asset.name.endsWith('.exe')) {
            assets.windows = {
              url: asset.browser_download_url,
              size: (asset.size / 1024 / 1024).toFixed(1) + ' MB',
              name: asset.name,
            };
          }
          if (asset.name.includes('Mac') && asset.name.endsWith('.dmg')) {
            assets.mac = {
              url: asset.browser_download_url,
              size: (asset.size / 1024 / 1024).toFixed(1) + ' MB',
              name: asset.name,
            };
          }
        }

        setRelease({
          version: data.tag_name,
          notes: data.body || '',
          date: new Date(data.published_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          assets,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching release:', err);
        if (err.message === 'rate_limit') {
          setError('Se excedio el limite de peticiones a GitHub. Intenta de nuevo en unos minutos.');
        } else if (err.message === 'not_found') {
          setError('No se encontraron releases disponibles.');
        } else {
          setError('No se pudo conectar con el servidor de descargas. Verifica tu conexion a internet.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRelease();
  }, []);

  // Parse release notes markdown into structured sections
  const parseReleaseNotes = (notes: string) => {
    const categoryMap: Record<string, { label: string; icon: typeof Plus; color: string; dotColor: string }> = {
      'added': { label: 'Mejoras', icon: Plus, color: 'text-emerald-500', dotColor: 'bg-emerald-500' },
      'fixed': { label: 'Correcciones', icon: Wrench, color: 'text-blue-500', dotColor: 'bg-blue-500' },
      'changed': { label: 'Cambios', icon: ArrowUpDown, color: 'text-amber-500', dotColor: 'bg-amber-500' },
      'removed': { label: 'Eliminados', icon: Trash2, color: 'text-red-500', dotColor: 'bg-red-500' },
      'security': { label: 'Seguridad', icon: ShieldCheck, color: 'text-purple-500', dotColor: 'bg-purple-500' },
    };

    const sections: { key: string; label: string; icon: typeof Plus; color: string; dotColor: string; items: string[] }[] = [];
    let currentSection: string | null = null;
    let releaseTitle = '';

    const lines = notes.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Match ## [version] - date or ## Title
      if (/^##\s+/.test(trimmed) && !trimmed.startsWith('###')) {
        releaseTitle = trimmed.replace(/^##\s+/, '').trim();
        continue;
      }

      // Match ### Category
      const categoryMatch = trimmed.match(/^###\s+(\w+)/i);
      if (categoryMatch) {
        const key = categoryMatch[1].toLowerCase();
        const meta = categoryMap[key] || { label: categoryMatch[1], icon: FileText, color: 'text-gray-500', dotColor: 'bg-gray-500' };
        sections.push({ key, ...meta, items: [] });
        currentSection = key;
        continue;
      }

      // Match - item
      if (/^[-*]\s+/.test(trimmed) && currentSection) {
        const item = trimmed.replace(/^[-*]\s+/, '').trim();
        if (item) {
          const section = sections.find(s => s.key === currentSection);
          if (section) section.items.push(item);
        }
      }
    }

    // If no sections were parsed, create a single "Notas" section with all content
    if (sections.length === 0 && notes.trim()) {
      const allItems = notes.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*')).map(l => l.trim().replace(/^[-*]\s+/, ''));
      if (allItems.length > 0) {
        sections.push({ key: 'notes', label: 'Notas', icon: FileText, color: 'text-gray-500', dotColor: 'bg-gray-500', items: allItems });
      }
    }

    // Ensure we always have the 3 main categories for display (like Antigravity)
    const mainCategories = ['added', 'fixed', 'changed'];
    for (const cat of mainCategories) {
      if (!sections.find(s => s.key === cat)) {
        const meta = categoryMap[cat];
        sections.push({ key: cat, ...meta, items: [] });
      }
    }

    // Sort: categories with items first, then empty ones
    sections.sort((a, b) => {
      const orderMap: Record<string, number> = { added: 0, fixed: 1, changed: 2, removed: 3, security: 4 };
      return (orderMap[a.key] ?? 5) - (orderMap[b.key] ?? 5);
    });

    return { releaseTitle, sections };
  };

  const requirements = [
    {
      os: 'Windows',
      min: 'Windows 10+ (64-bit)',
      ram: '4 GB (8 GB recomendado)',
      disk: '~300 MB',
      icon: Monitor,
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      os: 'macOS',
      min: 'macOS 12 Monterey+',
      ram: '4 GB (8 GB recomendado)',
      disk: '~300 MB',
      icon: Apple,
      color: 'bg-gray-500/10 text-gray-400'
    },
  ];

  const steps = [
    {
      title: 'Descarga',
      desc: 'Elige tu plataforma y descarga el instalador oficial.',
      icon: Download
    },
    {
      title: 'Instalacion',
      desc: 'Ejecuta el asistente y sigue los pasos en pantalla.',
      icon: Zap
    },
    {
      title: 'Sincronizacion',
      desc: 'Inicia sesion y disfruta de SofLIA Hub en tu flujo diario.',
      icon: ShieldCheck
    }
  ];

  const hubFeatures = [
    {
      icon: Bot,
      title: 'Tu Asistente Personal IA',
      desc: 'LIA se convierte en tu asistente personal en el escritorio. Configurala a tu medida para automatizar flujos de trabajo, realizar investigaciones profundas y obtener respuestas instantaneas.'
    },
    {
      icon: Layers,
      title: 'Ecosistema Completo',
      desc: 'Interactua con todo el ecosistema de SofLIA, desde ProjectHub hasta SofLIA Learning. Comparte chats, proyectos, carpetas y prompts directamente con tu equipo.'
    },
    {
      icon: MessageCircle,
      title: 'Integraciones Potentes',
      desc: 'Conexion fluida con Whatsapp, Google Workspace y Microsoft 365, centralizando tus comunicaciones y herramientas de trabajo en un solo lugar.'
    },
    {
      icon: Search,
      title: 'Control sobre tu Computadora',
      desc: 'Busca informacion dentro de tus archivos locales y ejecuta comandos del sistema operativo. SofLIA Hub vive en tu entorno y te ayuda a controlarlo de forma inteligente.'
    },
    {
      icon: BarChart3,
      title: 'Area de Productividad',
      desc: 'Un panel dedicado exclusivamente a maximizar tu rendimiento. Monitorea tu actividad, optimiza tu tiempo de concentracion y gestiona tus tareas diarias.'
    },
    {
      icon: Settings,
      title: 'Configuracion Profunda',
      desc: 'Personaliza todos los aspectos de la interaccion, gestiona integraciones, ajusta permisos locales y decide exactamente como quieres que SofLIA trabaje para ti.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1419] transition-colors duration-500 overflow-x-hidden">
      <LandingHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">

          {/* Hero Section */}
          <section className="text-center mb-20 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00D4B3]/20 blur-[100px] rounded-full -z-10"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2540]/5 dark:bg-white/5 border border-[#0A2540]/10 dark:border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-[#00D4B3]" />
                <span className="text-sm font-medium text-[#0A2540]/60 dark:text-white/60">
                  {loading
                    ? 'Cargando ultima version...'
                    : error
                      ? 'Error al obtener la version'
                      : `Version ${release?.version} disponible`
                  }
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-[#0A2540] dark:text-white mb-6 tracking-tight">
                Lleva a <span className="text-[#00D4B3]">SofLIA Hub</span><br />a todas partes
              </h1>

              <p className="text-xl text-[#0A2540]/60 dark:text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
                La aplicacion de escritorio oficial de SofLIA. Accede a tu asistente de IA,
                cursos y herramientas de productividad directamente desde tu sistema operativo,
                sin necesidad de abrir el navegador.
              </p>
            </motion.div>

            {/* Error Banner */}
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
              >
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <p className="text-sm text-amber-700 dark:text-amber-400 text-left flex-1">{error}</p>
                <button
                  onClick={fetchRelease}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-medium transition-colors shrink-0"
                >
                  Reintentar
                </button>
              </motion.div>
            )}

            {/* Download Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {loading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 animate-pulse" />
                ))
              ) : (
                <>
                  {/* Windows Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    whileHover={{ y: -8 }}
                    className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Monitor size={120} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full text-left">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                        <Monitor className="text-blue-500" size={32} />
                      </div>
                      <h3 className="text-2xl font-bold dark:text-white mb-2">Windows</h3>
                      <p className="text-[#0A2540]/40 dark:text-white/40 text-sm mb-8 flex-1">
                        Compatible con Windows 10 y 11 (64-bit).
                        {release?.assets.windows?.size && (
                          <>
                            <br />
                            Tamano: {release.assets.windows.size}
                          </>
                        )}
                      </p>

                      {release?.assets.windows ? (
                        <a
                          href={release.assets.windows.url}
                          className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b8a3] text-white transition-all group"
                        >
                          <span className="font-bold">Descargar para Windows</span>
                          <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                        </a>
                      ) : (
                        <button disabled className="w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed">
                          {error ? 'No se pudo verificar' : 'No disponible en esta version'}
                        </button>
                      )}
                    </div>
                  </motion.div>

                  {/* Mac Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    whileHover={{ y: -8 }}
                    className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Apple size={120} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full text-left">
                      <div className="w-14 h-14 rounded-2xl bg-gray-500/10 flex items-center justify-center mb-6">
                        <Apple className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-2xl font-bold dark:text-white mb-2">macOS</h3>
                      <p className="text-[#0A2540]/40 dark:text-white/40 text-sm mb-8 flex-1">
                        Compatible con Ventura, Sonoma y Posteriores.
                        {release?.assets.mac?.size && (
                          <>
                            <br />
                            Tamano: {release.assets.mac.size}
                          </>
                        )}
                      </p>

                      {release?.assets.mac ? (
                        <a
                          href={release.assets.mac.url}
                          className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-white dark:hover:bg-gray-100 dark:text-[#0A2540] text-white transition-all group"
                        >
                          <span className="font-bold">Descargar para macOS</span>
                          <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                        </a>
                      ) : (
                        <button disabled className="w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed">
                          {error ? 'No se pudo verificar' : 'No disponible en esta version'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Changelog — Antigravity-style */}
            {!loading && release?.notes && (() => {
              const { releaseTitle, sections } = parseReleaseNotes(release.notes);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-16 max-w-4xl mx-auto"
                >
                  {/* Section Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2540]/5 dark:bg-white/5 border border-[#0A2540]/10 dark:border-white/10 mb-4">
                      <FileText className="w-4 h-4 text-[#00D4B3]" />
                      <span className="text-sm font-medium text-[#0A2540]/60 dark:text-white/60">Changelog</span>
                    </div>
                  </div>

                  {/* Changelog Entry Card */}
                  <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                    {/* Entry Header */}
                    <div className="flex flex-col md:flex-row md:items-start gap-6 p-8 pb-6">
                      {/* Version & Date */}
                      <div className="shrink-0 md:w-36">
                        <div className="text-2xl font-bold text-[#0A2540] dark:text-white tracking-tight">
                          {release.version}
                        </div>
                        <div className="text-sm text-[#0A2540]/40 dark:text-white/40 mt-1">
                          {release.date}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="flex-1 min-w-0">
                        {releaseTitle && (
                          <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-2 leading-snug">
                            {releaseTitle}
                          </h3>
                        )}
                        <p className="text-sm text-[#0A2540]/50 dark:text-white/50 leading-relaxed">
                          Novedades y mejoras incluidas en esta version de SofLIA Hub.
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-8 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

                    {/* Collapsible Sections */}
                    <div className="px-8 py-2">
                      {sections.map((section, idx) => {
                        const isExpanded = expandedSections[section.key] ?? false;
                        const SectionIcon = section.icon;
                        const hasItems = section.items.length > 0;

                        return (
                          <div key={section.key}>
                            <button
                              onClick={() => hasItems && toggleSection(section.key)}
                              className={`w-full flex items-center justify-between py-4 group transition-colors ${
                                hasItems ? 'cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <SectionIcon size={16} className={section.color} />
                                <span className={`text-sm font-medium ${
                                  hasItems
                                    ? 'text-[#0A2540] dark:text-white'
                                    : 'text-[#0A2540]/30 dark:text-white/30'
                                }`}>
                                  {section.label}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  hasItems
                                    ? 'bg-[#0A2540]/5 dark:bg-white/10 text-[#0A2540]/60 dark:text-white/60'
                                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#0A2540]/25 dark:text-white/25'
                                }`}>
                                  {section.items.length}
                                </span>
                              </div>
                              {hasItems && (
                                <ChevronDown
                                  size={16}
                                  className={`text-[#0A2540]/30 dark:text-white/30 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              )}
                            </button>

                            {/* Expanded Items */}
                            <AnimatePresence>
                              {isExpanded && hasItems && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-4 pl-8 space-y-2.5">
                                    {section.items.map((item, j) => (
                                      <div key={j} className="flex items-start gap-3 group/item">
                                        <div className={`w-1.5 h-1.5 rounded-full ${section.dotColor} mt-2 shrink-0 opacity-60`} />
                                        <span className="text-sm text-[#0A2540]/70 dark:text-white/70 leading-relaxed">
                                          {item}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Section Divider */}
                            {idx < sections.length - 1 && (
                              <div className="h-px bg-black/[0.04] dark:bg-white/[0.04]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </section>

          {/* What is SofLIA Hub? */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B3]/10 border border-[#00D4B3]/20 mb-6">
                  <Cpu className="w-4 h-4 text-[#00D4B3]" />
                  <span className="text-sm font-medium text-[#00D4B3]">Aplicacion de Escritorio</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-4">
                  Que es SofLIA Hub?
                </h2>
                <p className="text-lg text-[#0A2540]/60 dark:text-white/60 max-w-4xl mx-auto leading-relaxed">
                  SofLIA Hub es tu asistente personal definitivo y el conector central con todo nuestro ecosistema. 
                  Mucho más que una aplicación, te permite integrar SofLIA Learning, ProjectHub y el Área de Productividad directamente en tu sistema operativo. 
                  Conéctate con WhatsApp, Google y Microsoft, realiza búsquedas e interactúa con los archivos de tu computadora, 
                  y comparte carpetas, proyectos, prompts y chats con todo tu equipo — todo desde un solo lugar.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#00D4B3]/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#00D4B3]/10 flex items-center justify-center text-[#00D4B3] mb-4">
                    <feature.icon size={24} />
                  </div>
                  <h4 className="text-lg font-bold dark:text-white mb-2">{feature.title}</h4>
                  <p className="text-sm text-[#0A2540]/60 dark:text-white/60 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quick Steps */}
          <section className="mb-20">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/10 dark:border-[#00D4B3]/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#00D4B3] flex items-center justify-center text-white mb-6">
                    <step.icon size={24} />
                  </div>
                  <h4 className="text-xl font-bold dark:text-white mb-2">{step.title}</h4>
                  <p className="text-sm text-[#0A2540]/60 dark:text-white/60 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Requirements Table */}
          <section className="bg-white dark:bg-white/5 rounded-[40px] border border-black/5 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-black/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
              <ShieldCheck size={200} />
            </div>

            <div className="relative z-10 mb-12">
              <h2 className="text-3xl font-bold dark:text-white mb-4">Requisitos del Sistema</h2>
              <p className="text-[#0A2540]/60 dark:text-white/60">Asegurate de que tu equipo cumple con lo necesario para la mejor experiencia.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">Plataforma</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">O.S.</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">RAM</th>
                    <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40">Espacio</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-white/5 last:border-0 group">
                      <td className="py-6 pr-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${req.color} flex items-center justify-center`}>
                            <req.icon size={20} />
                          </div>
                          <span className="font-bold dark:text-white">{req.os}</span>
                        </div>
                      </td>
                      <td className="py-6 pr-8 text-[#0A2540]/60 dark:text-white/60">{req.min}</td>
                      <td className="py-6 pr-8 text-[#0A2540]/60 dark:text-white/60">{req.ram}</td>
                      <td className="py-6 text-[#0A2540]/60 dark:text-white/60">{req.disk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Verification & Safety */}
          <section className="mt-20 text-center py-12 px-6 rounded-[40px] bg-gradient-to-br from-[#0A2540] to-[#173B63] dark:from-[#1A2332] dark:to-[#0F1419] text-white">
            <div className="w-16 h-16 bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="text-[#00D4B3]" size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Seguro y Verificado</h2>
            <p className="max-w-2xl mx-auto text-white/70 mb-12">
              Todos los releases de SofLIA Hub se compilan y firman automaticamente mediante GitHub Actions para garantizar la integridad y seguridad de cada instalador.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                <CheckCircle2 size={18} className="text-[#00D4B3]" />
                <span className="text-sm font-medium">Firma Digital SSL</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                <CheckCircle2 size={18} className="text-[#00D4B3]" />
                <span className="text-sm font-medium">Actualizaciones Automaticas</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                <Github size={18} />
                <span className="text-sm font-medium">Codigo Fuente Protegido</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
