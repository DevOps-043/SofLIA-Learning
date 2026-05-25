'use client'

import { Filter, RotateCcw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { REPORTE_CATEGORIA_OPTIONS, REPORTE_ESTADO_OPTIONS, REPORTE_PRIORIDAD_OPTIONS } from './admin-reportes.options'

interface AdminReportesFiltersProps {
  searchTerm: string
  estado: string
  categoria: string
  prioridad: string
  onSearchChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onCategoriaChange: (value: string) => void
  onPrioridadChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

export function AdminReportesFilters(props: AdminReportesFiltersProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const mapOptions = (options: typeof REPORTE_ESTADO_OPTIONS) => options.map((item) => ({ value: item.value, label: t(item.labelKey) }))

  return (
    <section className="rounded-[24px] border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_190px_190px_auto]">
        <BusinessPanelSearchInput value={props.searchTerm} onChange={props.onSearchChange} placeholder={t('reportesPage.filters.searchPlaceholder')} />
        <PremiumSelect value={props.estado} onValueChange={props.onEstadoChange} options={mapOptions(REPORTE_ESTADO_OPTIONS)} icon={<Filter className="h-4 w-4" />} />
        <PremiumSelect value={props.categoria} onValueChange={props.onCategoriaChange} options={mapOptions(REPORTE_CATEGORIA_OPTIONS)} icon={<Filter className="h-4 w-4" />} />
        <PremiumSelect value={props.prioridad} onValueChange={props.onPrioridadChange} options={mapOptions(REPORTE_PRIORIDAD_OPTIONS)} icon={<Filter className="h-4 w-4" />} />
        <div className="flex gap-2">
          <button type="button" onClick={props.onApply} className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}><Search className="mr-2 inline h-4 w-4" />{t('reportesPage.filters.apply')}</button>
          <button type="button" onClick={props.onReset} className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}><RotateCcw className="mr-2 inline h-4 w-4" />{t('reportesPage.filters.clear')}</button>
        </div>
      </div>
    </section>
  )
}
