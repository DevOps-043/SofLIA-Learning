'use client'

import { BoltIcon, BuildingOffice2Icon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { AdminCreateCompanyPlanSelect } from './AdminCreateCompanyPlanSelect'
import { AdminCreateCompanySectionTitle } from './AdminCreateCompanySectionTitle'
import { AdminCreateCompanyTextField } from './AdminCreateCompanyTextField'
import { AdminCreateCompanyToggleField } from './AdminCreateCompanyToggleField'
import type { CreateCompanyData, PlanOption } from './types'

interface AdminCreateCompanyGeneralSectionsProps {
  formData: CreateCompanyData
  isPlanOpen: boolean
  selectedPlan: PlanOption
  onNameChange: (name: string) => void
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onPlanOpenChange: (value: boolean) => void
}

export function AdminCreateCompanyGeneralSections({
  formData,
  isPlanOpen,
  selectedPlan,
  onNameChange,
  onFormDataChange,
  onPlanOpenChange,
}: AdminCreateCompanyGeneralSectionsProps) {
  return (
    <>
      <section className="space-y-5">
        <AdminCreateCompanySectionTitle icon={BuildingOffice2Icon} title="Informacion Basica" />
        <div className="grid grid-cols-1 gap-5">
          <AdminCreateCompanyTextField
            label="Nombre de la empresa"
            onChange={onNameChange}
            placeholder="Ej. Acme Corp"
            value={formData.name}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminCreateCompanySlugField
              formData={formData}
              onFormDataChange={onFormDataChange}
            />
            <AdminCreateCompanyToggleField
              activeLabel="Cuenta Activa"
              inactiveLabel="Cuenta Pausada"
              label="Estado"
              onToggle={() =>
                onFormDataChange((current) => ({
                  ...current,
                  is_active: !current.is_active,
                }))
              }
              value={formData.is_active}
            />
          </div>
          <AdminCreateCompanyTextField
            label="Descripcion"
            multiline
            onChange={(value) =>
              onFormDataChange((current) => ({ ...current, description: value }))
            }
            placeholder="Breve descripcion de la empresa..."
            rows={3}
            value={formData.description}
          />
        </div>
      </section>

      <section className="space-y-5">
        <AdminCreateCompanySectionTitle icon={EnvelopeIcon} title="Contacto" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminCreateCompanyTextField
            label="Email de Contacto"
            onChange={(value) =>
              onFormDataChange((current) => ({ ...current, contact_email: value }))
            }
            type="email"
            value={formData.contact_email}
          />
          <AdminCreateCompanyTextField
            label="Telefono"
            onChange={(value) =>
              onFormDataChange((current) => ({ ...current, contact_phone: value }))
            }
            type="tel"
            value={formData.contact_phone}
          />
          <div className="md:col-span-2">
            <AdminCreateCompanyTextField
              label="Sitio Web"
              onChange={(value) =>
                onFormDataChange((current) => ({ ...current, website_url: value }))
              }
              placeholder="https://"
              type="url"
              value={formData.website_url}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <AdminCreateCompanySectionTitle icon={BoltIcon} title="Suscripcion" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminCreateCompanyPlanSelect
            formData={formData}
            isOpen={isPlanOpen}
            onChange={(value) =>
              onFormDataChange((current) => ({
                ...current,
                subscription_plan: value,
              }))
            }
            onOpenChange={onPlanOpenChange}
            selectedPlan={selectedPlan}
          />
          <AdminCreateCompanyTextField
            label="Usuarios Maximos"
            onChange={(value) =>
              onFormDataChange((current) => ({
                ...current,
                max_users: Number.parseInt(value, 10) || 1,
              }))
            }
            type="number"
            value={String(formData.max_users)}
          />
        </div>
      </section>
    </>
  )
}

function AdminCreateCompanySlugField({
  formData,
  onFormDataChange,
}: {
  formData: CreateCompanyData
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
}) {
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs text-gray-600 dark:text-gray-400">
        Slug (URL)
      </label>
      <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 transition-colors focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-white/20 dark:focus-within:ring-white/20">
        <span className="mr-1 select-none text-sm text-gray-500">
          app.SOFLIA.com/
        </span>
        <input
          className="flex-1 border-none bg-transparent p-0 text-gray-900 outline-none placeholder-gray-400 focus:ring-0 dark:text-white dark:placeholder-white/20"
          onChange={(event) =>
            onFormDataChange((current) => ({
              ...current,
              slug: event.target.value,
            }))
          }
          placeholder="acme"
          type="text"
          value={formData.slug}
        />
      </div>
    </div>
  )
}
