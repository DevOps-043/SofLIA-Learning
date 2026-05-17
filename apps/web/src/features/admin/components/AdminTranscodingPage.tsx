'use client'

import { ActionBar } from './admin-transcoding/ActionBar'
import { DiagnosticsBanner } from './admin-transcoding/DiagnosticsBanner'
import { JobsTable } from './admin-transcoding/JobsTable'
import { PageHeader } from './admin-transcoding/PageHeader'
import { ResultAlerts } from './admin-transcoding/ResultAlerts'
import { StatusTiles } from './admin-transcoding/StatusTiles'
import { useAdminTranscodingPage } from './admin-transcoding/useAdminTranscodingPage'

export function AdminTranscodingPage() {
  const state = useAdminTranscodingPage()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader />
      <DiagnosticsBanner
        diagnostics={state.diagnostics}
        isDiagnosing={state.isDiagnosing}
        onRunDiagnostics={state.runDiagnostics}
      />
      <ActionBar
        isScanning={state.isScanning}
        isDraining={state.isDraining}
        onScan={state.triggerScan}
        onDrain={state.triggerDrain}
        onRefresh={state.fetchJobs}
      />
      <ResultAlerts scanResult={state.scanResult} drainResult={state.drainResult} />
      <StatusTiles summary={state.data?.summary} />
      <JobsTable
        data={state.data}
        error={state.error}
        isLoading={state.isLoading}
        statusFilter={state.statusFilter}
        onReprocessJob={state.reprocessJob}
        onStatusFilterChange={state.setStatusFilter}
      />
      <p className="mt-4 text-xs text-[#6C757D] dark:text-white/50">
        La tabla se refresca automaticamente cada 5 segundos.
      </p>
    </div>
  )
}
