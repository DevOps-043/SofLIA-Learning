'use client';

import {
  ArrowRight,
  BookOpenText,
  Building2,
  Check,
  FileCheck2,
  FileText,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLegalDocument } from '@/features/auth/components/LegalDocumentsModal/LegalDocumentsModal.data';
import { HomeFooter } from '@/features/landing/components/home/HomeFooter';
import { HomeHeader } from '@/features/landing/components/home/HomeHeader';
import { ClickSpark } from '@/features/landing/components/home/react-bits/ClickSpark';
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css';
import styles from './LegalPage.module.css';

type LegalPageKind = 'privacy' | 'terms';
type SupportedLocale = 'es' | 'en' | 'pt';

interface LegalPageProps {
  kind: LegalPageKind;
}

const UI_COPY = {
  es: {
    legal: 'Centro legal',
    current: 'Documento vigente',
    version: 'Versión 2.0',
    effective: 'Vigente desde el 27 de julio de 2026',
    updated: 'Revisión integral · 27.07.2026',
    contents: 'En este documento',
    contentsMobile: 'Explorar secciones',
    section: 'Sección',
    read: 'Lectura clara',
    contact: '¿Necesita una aclaración?',
    contactCopy:
      'Nuestro equipo puede orientar solicitudes de privacidad, cancelación, contratación o soporte.',
    contactAction: 'Contactar a SofLIA',
    emailAction: 'Escribir a soporte',
    switchLabel: 'Documentos legales',
    terms: {
      label: 'Términos',
      eyebrow: 'Acuerdo · Uso · Responsabilidad',
      titleLead: 'Reglas claras para una',
      titleAccent: 'experiencia responsable.',
      fallback:
        'Condiciones para utilizar SofLIA y sus funciones educativas y de inteligencia artificial.',
      highlights: [
        ['Contrato transparente', 'Alcance, pagos, renovación y cancelación sin letra pequeña.'],
        ['IA con supervisión', 'Los resultados se verifican y nunca sustituyen criterio profesional.'],
        ['Remedios preservados', 'Los derechos obligatorios de consumidores permanecen intactos.'],
      ],
    },
    privacy: {
      label: 'Privacidad',
      eyebrow: 'Control · Transparencia · Confianza',
      titleLead: 'Sus datos, explicados',
      titleAccent: 'sin zonas grises.',
      fallback:
        'Qué información trata SofLIA, para qué se utiliza y cómo puede ejercer control sobre ella.',
      highlights: [
        ['Finalidades delimitadas', 'Cada categoría de datos responde a un propósito informado.'],
        ['Control efectivo', 'ARCO, revocación y oposición con procedimiento y plazos claros.'],
        ['Seguridad por diseño', 'Acceso limitado, confidencialidad y respuesta ante incidentes.'],
      ],
    },
  },
  en: {
    legal: 'Legal center',
    current: 'Current document',
    version: 'Version 2.0',
    effective: 'Effective July 27, 2026',
    updated: 'Comprehensive review · 07.27.2026',
    contents: 'In this document',
    contentsMobile: 'Explore sections',
    section: 'Section',
    read: 'Clear reading',
    contact: 'Need clarification?',
    contactCopy:
      'Our team can guide privacy, cancellation, contracting, or support requests.',
    contactAction: 'Contact SofLIA',
    emailAction: 'Email support',
    switchLabel: 'Legal documents',
    terms: {
      label: 'Terms',
      eyebrow: 'Agreement · Use · Accountability',
      titleLead: 'Clear rules for a',
      titleAccent: 'responsible experience.',
      fallback:
        'Conditions for using SofLIA and its educational and artificial intelligence features.',
      highlights: [
        ['Transparent contract', 'Scope, payments, renewal, and cancellation without fine print.'],
        ['Human-led AI', 'Outputs must be verified and never replace professional judgment.'],
        ['Rights preserved', 'Mandatory consumer protections remain fully available.'],
      ],
    },
    privacy: {
      label: 'Privacy',
      eyebrow: 'Control · Transparency · Trust',
      titleLead: 'Your data, explained',
      titleAccent: 'without gray areas.',
      fallback:
        'What SofLIA processes, why it is used, and how you can stay in control.',
      highlights: [
        ['Defined purposes', 'Every data category has a disclosed and limited purpose.'],
        ['Effective control', 'Access, deletion, objection, and withdrawal with a clear process.'],
        ['Security by design', 'Limited access, confidentiality, and incident response.'],
      ],
    },
  },
  pt: {
    legal: 'Centro jurídico',
    current: 'Documento vigente',
    version: 'Versão 2.0',
    effective: 'Vigente desde 27 de julho de 2026',
    updated: 'Revisão integral · 27.07.2026',
    contents: 'Neste documento',
    contentsMobile: 'Explorar seções',
    section: 'Seção',
    read: 'Leitura clara',
    contact: 'Precisa de esclarecimento?',
    contactCopy:
      'Nossa equipe pode orientar solicitações de privacidade, cancelamento, contratação ou suporte.',
    contactAction: 'Contatar a SofLIA',
    emailAction: 'Escrever ao suporte',
    switchLabel: 'Documentos jurídicos',
    terms: {
      label: 'Termos',
      eyebrow: 'Acordo · Uso · Responsabilidade',
      titleLead: 'Regras claras para uma',
      titleAccent: 'experiência responsável.',
      fallback:
        'Condições para usar a SofLIA e seus recursos educacionais e de inteligência artificial.',
      highlights: [
        ['Contrato transparente', 'Escopo, pagamentos, renovação e cancelamento sem letras miúdas.'],
        ['IA com supervisão', 'Os resultados devem ser verificados e não substituem critério profissional.'],
        ['Direitos preservados', 'As proteções obrigatórias do consumidor permanecem disponíveis.'],
      ],
    },
    privacy: {
      label: 'Privacidade',
      eyebrow: 'Controle · Transparência · Confiança',
      titleLead: 'Seus dados, explicados',
      titleAccent: 'sem zonas cinzentas.',
      fallback:
        'Quais dados a SofLIA trata, por que são usados e como você mantém o controle.',
      highlights: [
        ['Finalidades definidas', 'Cada categoria de dados possui uma finalidade informada e limitada.'],
        ['Controle efetivo', 'Acesso, exclusão, oposição e revogação com processo claro.'],
        ['Segurança por design', 'Acesso limitado, confidencialidade e resposta a incidentes.'],
      ],
    },
  },
} as const;

const HIGHLIGHT_ICONS = {
  terms: [FileCheck2, ShieldCheck, Scale],
  privacy: [BookOpenText, LockKeyhole, ShieldCheck],
} as const;

function resolveLocale(language: string): SupportedLocale {
  if (language.startsWith('en')) return 'en';
  if (language.startsWith('pt')) return 'pt';
  return 'es';
}

export function LegalPage({ kind }: LegalPageProps) {
  const { t, i18n } = useTranslation('legal');
  const reducedMotion = useReducedMotion();
  const legalDocument = getLegalDocument(t, kind);
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
  const copy = UI_COPY[locale];
  const kindCopy = copy[kind];
  const otherKind: LegalPageKind = kind === 'privacy' ? 'terms' : 'privacy';
  const documentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(1);
  const sectionIds = useMemo(
    () => legalDocument.sections.map((section) => `legal-section-${section.number}`),
    [legalDocument.sections],
  );
  const { scrollYProgress } = useScroll({
    target: documentRef,
    offset: ['start 0.35', 'end 0.85'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.32,
  });

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const number = Number(visible.target.getAttribute('data-section'));
          if (Number.isFinite(number)) setActiveSection(number);
        }
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.2, 0.55] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const DocumentIcon = kind === 'privacy' ? ShieldCheck : FileText;

  return (
    <main className={`${homeStyles.page} ${styles.legalPage}`}>
      <div className={homeStyles.noise} aria-hidden="true" />
      <motion.div
        className={styles.readingProgress}
        style={{ scaleX: smoothProgress }}
        aria-hidden="true"
      />

      <ClickSpark>
        <HomeHeader />

        <section className={styles.hero} aria-labelledby="legal-page-title">
          <div className={styles.heroAtmosphere} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className={`${homeStyles.shell} ${styles.heroInner}`}>
            <motion.div
              className={styles.heroCopy}
              initial={reducedMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className={styles.eyebrow}>
                <span aria-hidden="true" />
                {kindCopy.eyebrow}
              </p>

              <h1 id="legal-page-title">
                {kindCopy.titleLead}{' '}
                <em>{kindCopy.titleAccent}</em>
              </h1>

              <p className={styles.heroSummary}>{legalDocument.summary ?? kindCopy.fallback}</p>

              <div className={styles.metaRow}>
                <span>
                  <Check size={13} aria-hidden="true" />
                  {copy.current}
                </span>
                <span>{copy.version}</span>
                <span>{copy.effective}</span>
              </div>
            </motion.div>

            <motion.aside
              className={styles.heroArtifact}
              initial={reducedMotion ? false : { opacity: 0, x: 24, rotate: 1.5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              aria-label={`${copy.current}: ${legalDocument.title}`}
            >
              <div className={styles.artifactTop}>
                <span>{copy.legal}</span>
                <span>SOF / LEGAL / 02</span>
              </div>
              <DocumentIcon size={38} strokeWidth={1.35} aria-hidden="true" />
              <div className={styles.artifactTitle}>
                <span>{kindCopy.label}</span>
                <strong>{legalDocument.title}</strong>
              </div>
              <div className={styles.artifactSeal}>
                <i aria-hidden="true" />
                <span>{copy.updated}</span>
              </div>
            </motion.aside>
          </div>
        </section>

        <section className={`${homeStyles.shell} ${styles.summaryBand}`} aria-label={copy.read}>
          {kindCopy.highlights.map(([title, description], index) => {
            const Icon = HIGHLIGHT_ICONS[kind][index];
            return (
              <motion.article
                key={title}
                initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <span className={styles.summaryIndex}>0{index + 1}</span>
                <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
                <h2>{title}</h2>
                <p>{description}</p>
              </motion.article>
            );
          })}
        </section>

        <nav
          className={`${homeStyles.shell} ${styles.documentSwitch}`}
          aria-label={copy.switchLabel}
        >
          {(['privacy', 'terms'] as const).map((item) => (
            <Link
              key={item}
              href={`/${item}`}
              className={item === kind ? styles.documentSwitchActive : undefined}
              aria-current={item === kind ? 'page' : undefined}
            >
              <span>{item === 'privacy' ? '01' : '02'}</span>
              {copy[item].label}
              {item !== kind ? <ArrowRight size={14} aria-hidden="true" /> : <Check size={14} />}
            </Link>
          ))}
        </nav>

        <details className={`${homeStyles.shell} ${styles.mobileContents}`}>
          <summary>
            <span>{copy.contentsMobile}</span>
            <span>{String(activeSection).padStart(2, '0')} / {legalDocument.sections.length}</span>
          </summary>
          <nav aria-label={copy.contents}>
            {legalDocument.sections.map((section) => (
              <a
                key={section.number}
                href={`#legal-section-${section.number}`}
                onClick={() => setActiveSection(section.number)}
              >
                <span>{String(section.number).padStart(2, '0')}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </details>

        <div ref={documentRef} className={`${homeStyles.shell} ${styles.documentLayout}`}>
          <aside className={styles.contentsRail}>
            <div>
              <p>{copy.contents}</p>
              <div className={styles.railCounter}>
                <span>{String(activeSection).padStart(2, '0')}</span>
                <i aria-hidden="true" />
                <span>{String(legalDocument.sections.length).padStart(2, '0')}</span>
              </div>
              <nav aria-label={copy.contents}>
                {legalDocument.sections.map((section) => (
                  <a
                    key={section.number}
                    href={`#legal-section-${section.number}`}
                    className={activeSection === section.number ? styles.contentsLinkActive : undefined}
                    aria-current={activeSection === section.number ? 'location' : undefined}
                  >
                    <span>{String(section.number).padStart(2, '0')}</span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className={styles.document}>
            <header className={styles.documentHeader}>
              <div>
                <span>{copy.current}</span>
                <h2>{legalDocument.title}</h2>
              </div>
              <p>{copy.updated}</p>
            </header>

            {legalDocument.sections.map((section, index) => (
              <motion.section
                key={section.number}
                id={`legal-section-${section.number}`}
                data-section={section.number}
                className={styles.legalSection}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.54, delay: Math.min(index, 3) * 0.025 }}
              >
                <div className={styles.sectionNumber}>
                  <span>{copy.section}</span>
                  <strong>{String(section.number).padStart(2, '0')}</strong>
                </div>
                <div className={styles.sectionBody}>
                  <h2>{section.title}</h2>
                  <p>{section.content}</p>
                  {section.list?.length ? (
                    <ul>
                      {section.list.map((item) => (
                        <li key={item}>
                          <span aria-hidden="true" />
                          <p>{item}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </motion.section>
            ))}
          </article>
        </div>

        <section className={`${homeStyles.shell} ${styles.contactPanel}`}>
          <div className={styles.contactGraphic} aria-hidden="true">
            <span />
            <Building2 size={28} strokeWidth={1.35} />
          </div>
          <div>
            <p>{copy.legal}</p>
            <h2>{copy.contact}</h2>
            <span>{copy.contactCopy}</span>
          </div>
          <div className={styles.contactActions}>
            <Link href="/contact">
              {copy.contactAction}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <a href="mailto:soporte@soflia.com">
              <Mail size={15} aria-hidden="true" />
              {copy.emailAction}
            </a>
          </div>
        </section>

        <div className={styles.relatedDocument}>
          <span>{copy.switchLabel}</span>
          <Link href={`/${otherKind}`}>
            {copy[otherKind].label}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <HomeFooter />
      </ClickSpark>
    </main>
  );
}
