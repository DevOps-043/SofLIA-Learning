import { Users, X } from 'lucide-react'

interface TeamMembersHeaderProps {
  onClose: () => void
  teamName: string
}

export function TeamMembersHeader({ onClose, teamName }: TeamMembersHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestionar Miembros</h2>
          <p className="text-sm text-gray-600 dark:text-white/50">{teamName}</p>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>
    </div>
  )
}
