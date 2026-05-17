'use client'

import { useState } from 'react'
import type { ReporteFilters } from '../../services/adminReportes.service'

export function useAdminReportesFilters(applyFilters: (filters: ReporteFilters) => void) {
  const [searchTerm, setSearchTerm] = useState('')
  const [estado, setEstado] = useState('all')
  const [categoria, setCategoria] = useState('all')
  const [prioridad, setPrioridad] = useState('all')

  const apply = () => {
    applyFilters({
      estado: estado !== 'all' ? estado : undefined,
      categoria: categoria !== 'all' ? categoria : undefined,
      prioridad: prioridad !== 'all' ? prioridad : undefined,
      search: searchTerm || undefined,
    })
  }

  const reset = () => {
    setSearchTerm('')
    setEstado('all')
    setCategoria('all')
    setPrioridad('all')
    applyFilters({})
  }

  return { searchTerm, estado, categoria, prioridad, setSearchTerm, setEstado, setCategoria, setPrioridad, apply, reset }
}
