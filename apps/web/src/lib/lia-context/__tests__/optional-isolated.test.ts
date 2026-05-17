import { testContextMetricsService } from './optional-context-tests/metrics.suite'
import { testLiaComponentUtilities } from './optional-context-tests/lia-components.suite'
import { testNewPageMetadata } from './optional-context-tests/page-metadata.suite'
import { testPageContextServiceNewPages } from './optional-context-tests/page-service.suite'
import { testPlatformContextProvider } from './optional-context-tests/platform-provider.suite'
import { runSuites } from './optional-context-tests/runner'
import { testUserContextProvider } from './optional-context-tests/user-provider.suite'

void runSuites('TESTS DE FUNCIONALIDADES OPCIONALES DE LIA (AISLADOS)', [
  { name: 'pageMetadata', run: testNewPageMetadata },
  { name: 'userProvider', run: testUserContextProvider },
  { name: 'platformProvider', run: testPlatformContextProvider },
  { name: 'metrics', run: testContextMetricsService },
  { name: 'utilities', run: testLiaComponentUtilities },
  { name: 'pageService', run: testPageContextServiceNewPages },
]).catch(console.error)
