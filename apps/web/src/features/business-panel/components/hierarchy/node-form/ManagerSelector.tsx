'use client'

import { Search, X, Loader2 } from 'lucide-react'
import type { UserWithHierarchy } from '../../../types/hierarchy.types'

interface ManagerSelectorProps {
  selectedManager: UserWithHierarchy['user'] | null
  managerSearch: string
  managerResults: UserWithHierarchy['user'][]
  isSearchingManager: boolean
  onSearchChange: (v: string) => void
  onSelectManager: (user: UserWithHierarchy['user']) => void
  onClearManager: () => void
}

export function ManagerSelector({
  selectedManager,
  managerSearch,
  managerResults,
  isSearchingManager,
  onSearchChange,
  onSelectManager,
  onClearManager,
}: ManagerSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Responsable / Encargado
      </label>

      {selectedManager ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center overflow-hidden">
              {selectedManager.profile_picture_url ? (
                <img src={selectedManager.profile_picture_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                  {(selectedManager.first_name?.[0] || selectedManager.username?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedManager.first_name} {selectedManager.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedManager.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearManager}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full text-blue-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={managerSearch}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-neutral-800 text-sm"
            />
            {isSearchingManager && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {managerResults.length > 0 && managerSearch && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {managerResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectManager(user)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500">
                        {(user.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
