'use client'

import { useState } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

export function useUserDetailFilters() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const debouncedSearch = useDebouncedValue(search, 350)

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const updateStatus = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  return { search, debouncedSearch, statusFilter, page, limit, setPage, updateSearch, updateStatus }
}
