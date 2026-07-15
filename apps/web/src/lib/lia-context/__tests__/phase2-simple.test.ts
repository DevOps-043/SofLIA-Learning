import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Tests simplificados para Fase 2 - Sin dependencias de Supabase
 * 
 * Verifica la estructura y configuración del sistema.
 * 
 * Para ejecutar: npx tsx apps/web/src/lib/lia-context/__tests__/phase2-simple.test.ts
 */

// Importar solo los módulos que no dependen de Supabase
import { PageContextService } from '../services/page-context.service';
import { PAGE_METADATA, getRegisteredRoutes } from '../config/page-metadata';

// ============================================================================
// TESTS
// ============================================================================

techDebtLogger.log('\n🧪 === TESTS SIMPLIFICADOS FASE 2 ===\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      techDebtLogger.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      techDebtLogger.log(`❌ FAIL: ${name}`);
      failed++;
    }
  } catch (error) {
    techDebtLogger.log(`❌ ERROR: ${name} - ${error}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// Test 1: Verificar estructura de archivos
// ----------------------------------------------------------------------------
test('PAGE_METADATA está exportado y tiene datos', () => {
  return Object.keys(PAGE_METADATA).length >= 5;
});

test('getRegisteredRoutes funciona', () => {
  const routes = getRegisteredRoutes();
  return routes.length >= 5;
});

// ----------------------------------------------------------------------------
// Test 2: PageContextService funciona correctamente
// ----------------------------------------------------------------------------
test('PageContextService.getPageMetadata funciona', () => {
  const metadata = PageContextService.getPageMetadata('/acme/business-panel/courses');
  return metadata !== null && metadata.pageType === 'business_panel_courses';
});

test('PageContextService.buildPageContext genera contexto', () => {
  const context = PageContextService.buildPageContext('/acme/business-panel/courses');
  return context.length > 100 && context.includes('CONTEXTO');
});

test('PageContextService.buildBugReportContext genera contexto detallado', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.length > 200 && context.includes('INFORMACIÓN TÉCNICA');
});

// ----------------------------------------------------------------------------
// Test 3: Metadata de páginas tiene la estructura correcta
// ----------------------------------------------------------------------------
test('Cada página tiene componentes', () => {
  for (const [, metadata] of Object.entries(PAGE_METADATA)) {
    if (!Array.isArray(metadata.components) || metadata.components.length === 0) {
      return false;
    }
  }
  return true;
});

test('Cada página tiene APIs', () => {
  for (const [, metadata] of Object.entries(PAGE_METADATA)) {
    if (!Array.isArray(metadata.apis) || metadata.apis.length === 0) {
      return false;
    }
  }
  return true;
});

test('Cada página tiene userFlows', () => {
  for (const [, metadata] of Object.entries(PAGE_METADATA)) {
    if (!Array.isArray(metadata.userFlows) || metadata.userFlows.length === 0) {
      return false;
    }
  }
  return true;
});

test('Cada página tiene commonIssues', () => {
  for (const [, metadata] of Object.entries(PAGE_METADATA)) {
    if (!Array.isArray(metadata.commonIssues)) {
      return false;
    }
  }
  return true;
});

// ----------------------------------------------------------------------------
// Test 4: Matching de rutas dinámicas
// ----------------------------------------------------------------------------
const dynamicRouteTests = [
  { input: '/acme/business-panel/courses', expected: 'business_panel_courses' },
  { input: '/company-xyz/business-panel/users', expected: 'business_panel_users' },
  { input: '/org123/business-user/dashboard', expected: 'business_user_dashboard' },
  { input: '/courses/react-fundamentals/learn', expected: 'course_learn' },
];

dynamicRouteTests.forEach(({ input, expected }) => {
  test(`Matching de ruta: ${input}`, () => {
    const metadata = PageContextService.getPageMetadata(input);
    return metadata !== null && metadata.pageType === expected;
  });
});

// ----------------------------------------------------------------------------
// Test 5: Contenido del contexto para bugs
// ----------------------------------------------------------------------------
test('buildBugReportContext incluye archivos de componentes', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.includes('Archivo:') || context.includes('.tsx');
});

test('buildBugReportContext incluye errores comunes', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.includes('errores comunes') || context.includes('Errores');
});

test('buildBugReportContext incluye puntos de fallo', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.includes('fallo') || context.includes('breakpoints') || context.includes('Pasos');
});

// ----------------------------------------------------------------------------
// Test 6: estimateTokens funciona
// ----------------------------------------------------------------------------
test('estimateTokens devuelve un número positivo', () => {
  const text = 'Este es un texto de prueba para estimar tokens.';
  const tokens = PageContextService.estimateTokens(text);
  return typeof tokens === 'number' && tokens > 0;
});

test('estimateTokens es proporcional al tamaño del texto', () => {
  const short = 'Corto';
  const long = 'Este es un texto mucho más largo para verificar que la estimación es proporcional al tamaño del texto ingresado.';
  const shortTokens = PageContextService.estimateTokens(short);
  const longTokens = PageContextService.estimateTokens(long);
  return longTokens > shortTokens;
});

// ============================================================================
// RESUMEN
// ============================================================================

techDebtLogger.log('\n📊 === RESUMEN DE TESTS FASE 2 ===\n');
techDebtLogger.log(`✅ Tests pasados: ${passed}`);
techDebtLogger.log(`❌ Tests fallidos: ${failed}`);
techDebtLogger.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed === 0) {
  techDebtLogger.log('🎉 ¡Todos los tests de Fase 2 pasaron!\n');
  techDebtLogger.log('📌 Nota: Los tests de integración con Supabase (ErrorContextService)');
  techDebtLogger.log('   requieren el entorno de Next.js para resolver las dependencias.\n');
} else {
  techDebtLogger.log('⚠️ Algunos tests fallaron. Revisar la implementación.\n');
  process.exit(1);
}

// ============================================================================
// DEMO: Mostrar contexto de bug
// ============================================================================

techDebtLogger.log('📄 === DEMO: CONTEXTO PARA BUG REPORT ===\n');

const demoPage = '/acme/business-panel/courses';
const bugContext = PageContextService.buildBugReportContext(demoPage);

techDebtLogger.log(`Contexto generado para: ${demoPage}\n`);
techDebtLogger.log('─'.repeat(60));
techDebtLogger.log(bugContext.substring(0, 1500));
if (bugContext.length > 1500) {
  techDebtLogger.log('\n...[contenido truncado para demo]');
}
techDebtLogger.log('─'.repeat(60));
techDebtLogger.log(`\nTotal: ${bugContext.length} caracteres, ~${PageContextService.estimateTokens(bugContext)} tokens\n`);









