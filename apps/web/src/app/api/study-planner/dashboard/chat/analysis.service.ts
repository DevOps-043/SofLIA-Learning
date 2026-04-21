/**
 * Analysis Service Facade
 * Preserves the public API while delegating to smaller modules.
 */

export { syncSessionsWithCalendar } from './analysis-sync.service'
export { analyzeProactively } from './analysis-proactive.service'
