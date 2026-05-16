'use client'

import { UserCircleIcon } from '@heroicons/react/24/outline'
import { AdminCreateCompanyOwnerFields } from './AdminCreateCompanyOwnerFields'
import type { CreateCompanyData } from './types'

interface AdminCreateCompanyOwnerCardProps {
  accentColor: string
  formData: CreateCompanyData
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
}

export function AdminCreateCompanyOwnerCard({
  accentColor,
  formData,
  onFormDataChange,
}: AdminCreateCompanyOwnerCardProps) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6 dark:from-accent/10">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-xl bg-accent/20 p-3">
          <UserCircleIcon className="h-8 w-8" style={{ color: accentColor }} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            Propietario de la Organización
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tendrá control total sobre la organización
          </p>
        </div>
      </div>
      <AdminCreateCompanyOwnerFields
        ownerEmail={formData.owner_email || ''}
        ownerPosition={formData.owner_position || ''}
        onEmailChange={(value) =>
          onFormDataChange((current) => ({ ...current, owner_email: value }))
        }
        onPositionChange={(value) =>
          onFormDataChange((current) => ({ ...current, owner_position: value }))
        }
      />
    </div>
  )
}
