'use client'

import { useEffect, useState } from 'react'
import type { AdminReporte } from '../../../services/adminReportes.service'

export function useEditReporteForm(reporte: AdminReporte) {
  const [estado, setEstado] = useState(reporte.estado ?? 'pendiente')
  const [prioridad, setPrioridad] = useState(reporte.prioridad ?? 'media')
  const [notasAdmin, setNotasAdmin] = useState(reporte.notas_admin || '')

  useEffect(() => {
    setEstado(reporte.estado ?? 'pendiente')
    setPrioridad(reporte.prioridad ?? 'media')
    setNotasAdmin(reporte.notas_admin || '')
  }, [reporte])

  const getUpdates = () => ({
    estado,
    prioridad,
    notas_admin: notasAdmin.trim() || undefined,
  })

  return { estado, prioridad, notasAdmin, setEstado, setPrioridad, setNotasAdmin, getUpdates }
}
