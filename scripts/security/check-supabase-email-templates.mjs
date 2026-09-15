import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, 'supabase', 'config.toml');
const templatesDirectory = path.join(projectRoot, 'supabase', 'templates');

const templateContracts = [
  { section: 'auth.email.template.confirmation', file: 'confirmation.html', variables: ['ConfirmationURL', 'Email'] },
  { section: 'auth.email.template.invite', file: 'invite.html', variables: ['ConfirmationURL', 'Email'] },
  { section: 'auth.email.template.magic_link', file: 'magic-link.html', variables: ['ConfirmationURL', 'Token'] },
  { section: 'auth.email.template.email_change', file: 'email-change.html', variables: ['ConfirmationURL', 'NewEmail'] },
  { section: 'auth.email.template.recovery', file: 'recovery.html', variables: ['ConfirmationURL', 'Email'] },
  { section: 'auth.email.template.reauthentication', file: 'reauthentication.html', variables: ['Token'] },
  { section: 'auth.email.notification.password_changed', file: 'password-changed.html', variables: ['Email'] },
  { section: 'auth.email.notification.email_changed', file: 'email-changed.html', variables: ['OldEmail', 'Email'] },
  { section: 'auth.email.notification.phone_changed', file: 'phone-changed.html', variables: ['OldPhone', 'Phone'] },
  { section: 'auth.email.notification.identity_linked', file: 'identity-linked.html', variables: ['Provider', 'Email'] },
  { section: 'auth.email.notification.identity_unlinked', file: 'identity-unlinked.html', variables: ['Provider', 'Email'] },
  { section: 'auth.email.notification.mfa_factor_enrolled', file: 'mfa-factor-enrolled.html', variables: ['FactorType'] },
  { section: 'auth.email.notification.mfa_factor_unenrolled', file: 'mfa-factor-unenrolled.html', variables: ['FactorType'] },
];

const allowedVariables = new Set([
  'ConfirmationURL',
  'Token',
  'TokenHash',
  'SiteURL',
  'RedirectTo',
  'Data',
  'Email',
  'NewEmail',
  'OldEmail',
  'Phone',
  'OldPhone',
  'Provider',
  'FactorType',
]);

const unsafeHtmlPatterns = [
  /<\s*script\b/i,
  /<\s*(?:form|iframe|object|embed)\b/i,
  /\son[a-z]+\s*=/i,
  /javascript\s*:/i,
  /http:\/\//i,
];

function getConfiguredSection(config, section) {
  const escapedSection = section.replaceAll('.', '\\.');
  const sectionPattern = new RegExp(`\\[${escapedSection}\\]([\\s\\S]*?)(?=\\n\\[|$)`);
  return config.match(sectionPattern)?.[1] ?? '';
}

function findTemplateVariables(content) {
  return [...content.matchAll(/{{\s*\.([A-Za-z][A-Za-z0-9]*)[^}]*}}/g)].map((match) => match[1]);
}

const failures = [];
const config = await readFile(configPath, 'utf8');

for (const contract of templateContracts) {
  const configuredSection = getConfiguredSection(config, contract.section);
  const expectedPath = `./supabase/templates/${contract.file}`;

  if (!configuredSection) {
    failures.push(`${contract.section}: falta la sección en supabase/config.toml`);
    continue;
  }

  if (!configuredSection.includes(`content_path = "${expectedPath}"`)) {
    failures.push(`${contract.section}: debe apuntar a ${expectedPath}`);
  }

  if (contract.section.includes('.notification.') && !configuredSection.includes('enabled = true')) {
    failures.push(`${contract.section}: la notificación de seguridad debe estar habilitada`);
  }

  const templatePath = path.join(templatesDirectory, contract.file);
  let content;
  try {
    content = await readFile(templatePath, 'utf8');
  } catch {
    failures.push(`${contract.file}: no se pudo leer la plantilla`);
    continue;
  }

  if (!/^<!doctype html>/i.test(content.trim())) {
    failures.push(`${contract.file}: falta <!doctype html>`);
  }
  if (!content.includes('lang="es"') || !content.includes('SofLIA')) {
    failures.push(`${contract.file}: falta idioma español o identidad SofLIA`);
  }

  for (const requiredVariable of contract.variables) {
    if (!content.includes(`{{ .${requiredVariable} }}`)) {
      failures.push(`${contract.file}: falta {{ .${requiredVariable} }}`);
    }
  }

  for (const usedVariable of findTemplateVariables(content)) {
    if (!allowedVariables.has(usedVariable)) {
      failures.push(`${contract.file}: variable no soportada {{ .${usedVariable} }}`);
    }
  }

  for (const unsafePattern of unsafeHtmlPatterns) {
    if (unsafePattern.test(content)) {
      failures.push(`${contract.file}: contiene HTML o URL no permitida (${unsafePattern})`);
    }
  }
}

if (failures.length > 0) {
  console.error('Supabase email template validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Supabase email templates are valid (${templateContracts.length} checked).`);
}
