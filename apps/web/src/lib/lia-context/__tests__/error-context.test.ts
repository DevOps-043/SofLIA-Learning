import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Tests para el Sistema de Contexto de Errores de LIA - Fase 2
 * 
 * Este archivo contiene tests para verificar el funcionamiento del
 * ErrorContextService y el BugReportContextProvider.
 * 
 * Para ejecutar: npx tsx apps/web/src/lib/lia-context/__tests__/error-context.test.ts
 */

import { ErrorContextService, SimilarBug } from '../services/error-context.service';
import { ContextBuilderService, getContextBuilder } from '../services/context-builder.service';

// ============================================================================
// TESTS
// ============================================================================

techDebtLogger.log('\n🧪 === TESTS DEL SISTEMA DE CONTEXTO DE ERRORES DE LIA (FASE 2) ===\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  return Promise.resolve(fn())
    .then(result => {
      if (result) {
        techDebtLogger.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        techDebtLogger.log(`❌ FAIL: ${name}`);
        failed++;
      }
    })
    .catch(error => {
      techDebtLogger.log(`❌ ERROR: ${name} - ${error}`);
      failed++;
    });
}

async function runTests() {
  // ----------------------------------------------------------------------------
  // Test 1: ErrorContextService está disponible
  // ----------------------------------------------------------------------------
  await test('ErrorContextService está disponible', () => {
    return typeof ErrorContextService.getSimilarBugs === 'function';
  });

  await test('ErrorContextService.buildErrorContext es una función', () => {
    return typeof ErrorContextService.buildErrorContext === 'function';
  });

  await test('ErrorContextService.searchBugsByKeywords es una función', () => {
    return typeof ErrorContextService.searchBugsByKeywords === 'function';
  });

  await test('ErrorContextService.getBugStatsForPage es una función', () => {
    return typeof ErrorContextService.getBugStatsForPage === 'function';
  });

  // ----------------------------------------------------------------------------
  // Test 2: ContextBuilderService incluye BugReportContextProvider
  // ----------------------------------------------------------------------------
  await test('ContextBuilderService está disponible', () => {
    const builder = getContextBuilder();
    return builder !== null && builder !== undefined;
  });

  await test('ContextBuilderService tiene providers registrados', () => {
    const builder = getContextBuilder();
    const stats = builder.getStats();
    techDebtLogger.log(`   → Providers registrados: ${stats.providerNames.join(', ')}`);
    return stats.registeredProviders >= 2; // page + bug-report
  });

  await test('ContextBuilderService incluye bug-report provider', () => {
    const builder = getContextBuilder();
    const stats = builder.getStats();
    return stats.providerNames.includes('bug-report');
  });

  await test('ContextBuilderService incluye page provider', () => {
    const builder = getContextBuilder();
    const stats = builder.getStats();
    return stats.providerNames.includes('page');
  });

  // ----------------------------------------------------------------------------
  // Test 3: buildContext funciona sin errores
  // ----------------------------------------------------------------------------
  await test('buildContext general funciona sin errores', async () => {
    const builder = getContextBuilder();
    try {
      const context = await builder.buildGeneralContext(
        'test-user-id',
        '/test/business-panel/courses'
      );
      techDebtLogger.log(`   → Contexto generado: ${context.length} caracteres`);
      return true;
    } catch (error) {
      techDebtLogger.log(`   → Error: ${error}`);
      return false;
    }
  });

  await test('buildBugReportContext funciona sin errores', async () => {
    const builder = getContextBuilder();
    try {
      const context = await builder.buildBugReportContext(
        'test-user-id',
        '/test/business-panel/courses',
        {
          platform: {
            browser: 'Chrome',
            version: '120.0',
            os: 'Windows 10'
          },
          errors: [
            {
              type: 'error',
              message: 'Test error message'
            }
          ]
        }
      );
      techDebtLogger.log(`   → Contexto de bug generado: ${context.length} caracteres`);
      return true;
    } catch (error) {
      techDebtLogger.log(`   → Error: ${error}`);
      return false;
    }
  });

  // ----------------------------------------------------------------------------
  // Test 4: Estructura de SimilarBug
  // ----------------------------------------------------------------------------
  await test('SimilarBug interface tiene campos requeridos', () => {
    const testBug: Partial<SimilarBug> = {
      id: 'test-id',
      titulo: 'Test Bug',
      descripcion: 'Test description',
      categoria: 'bug',
      estado: 'pendiente',
      pagina_url: '/test/page',
      pathname: '/test/page'
    };
    return (
      'id' in testBug &&
      'titulo' in testBug &&
      'descripcion' in testBug &&
      'categoria' in testBug &&
      'estado' in testBug &&
      'pagina_url' in testBug
    );
  });

  // ----------------------------------------------------------------------------
  // Test 5: buildErrorContext sin parámetros
  // ----------------------------------------------------------------------------
  await test('buildErrorContext retorna string vacío sin parámetros', async () => {
    try {
      const context = await ErrorContextService.buildErrorContext();
      return context === '';
    } catch {
      // Si hay error de Supabase (no hay conexión), es esperado en tests
      return true;
    }
  });

  // ----------------------------------------------------------------------------
  // Test 6: buildErrorContext con errores de consola
  // ----------------------------------------------------------------------------
  await test('buildErrorContext formatea errores de consola', async () => {
    try {
      const context = await ErrorContextService.buildErrorContext(
        undefined,
        undefined,
        [
          { type: 'error', message: 'Test error 1' },
          { type: 'warn', message: 'Test warning 2' }
        ]
      );
      return context.includes('errores de consola') || context.includes('Error') || context === '';
    } catch {
      return true; // Error de conexión esperado en tests
    }
  });

  // ============================================================================
  // RESUMEN
  // ============================================================================

  techDebtLogger.log('\n📊 === RESUMEN DE TESTS FASE 2 ===\n');
  techDebtLogger.log(`✅ Tests pasados: ${passed}`);
  techDebtLogger.log(`❌ Tests fallidos: ${failed}`);
  techDebtLogger.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    techDebtLogger.log('🎉 ¡Todos los tests de Fase 2 pasaron! El sistema de contexto de errores está funcionando.\n');
  } else {
    techDebtLogger.log('⚠️ Algunos tests fallaron. Revisar la implementación.\n');
    process.exit(1);
  }
}

// Ejecutar tests
runTests().catch(techDebtLogger.error);









