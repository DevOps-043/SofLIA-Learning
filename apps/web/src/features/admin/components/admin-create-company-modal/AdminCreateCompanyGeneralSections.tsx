'use client'

import {
  BoltIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

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
        <AdminCreateCompanySectionTitle
          icon={BuildingOffice2Icon}
          title="Informacion Basica"
        />
        <div className="grid grid-cols-1 gap-5">
          <AdminCreateCompanyTextField
            label="Nombre de la empresa"
            value={formData.name}
            placeholder="Ej. Acme Corp"
            onChange={onNameChange}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminCreateCompanySlugField
              formData={formData}
              onFormDataChange={onFormDataChange}
            />
            <AdminCreateCompanyToggleField
              label="Estado"
              activeLabel="Cuenta Activa"
              inactiveLabel="Cuenta Pausada"
              value={formData.is_active}
              onToggle={() =>
                onFormDataChange((current) => ({
                  ...current,
                  is_active: !current.is_active,
                }))
              }
            />
          </div>
          <AdminCreateCompanyTextField
            label="Descripcion"
            value={formData.description}
            placeholder="Breve descripcion de la empresa..."
            multiline
            rows={3}
            onChange={(description) =>
              onFormDataChange((current) => ({ ...current, description }))
            }
          />
        </div>
      </section>

      <section className="space-y-5">
        <AdminCreateCompanySectionTitle icon={EnvelopeIcon} title="Contacto" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminCreateCompanyTextField
            label="Email de Contacto"
            type="email"
            value={formData.contact_email}
            onChange={(contactEmail) =>
              onFormDataChange((current) => ({
                ...current,
                contact_email: contactEmail,
              }))
            }
          />
          <AdminCreateCompanyTextField
            label="Telefono"
            type="tel"
            value={formData.contact_phone}
            onChange={(contactPhone) =>
              onFormDataChange((current) => ({
                ...current,
                contact_phone: contactPhone,
              }))
            }
          />
          <div className="md:col-span-2">
            <AdminCreateCompanyTextField
              label="Sitio Web"
              type="url"
              value={formData.website_url}
              placeholder="https://"
              onChange={(websiteUrl) =>
                onFormDataChange((current) => ({
                  ...current,
                  website_url: websiteUrl,
                }))
              }
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
            selectedPlan={selectedPlan}
            onOpenChange={onPlanOpenChange}
            onChange={(subscriptionPlan) =>
              onFormDataChange((current) => ({
                ...current,
                subscription_plan: subscriptionPlan,
              }))
            }
          />
          <AdminCreateCompanyTextField
            label="Usuarios Maximos"
            type="number"
            value={String(formData.max_users)}
            onChange={(maxUsers) =>
              onFormDataChange((current) => ({
                ...current,
                max_users: Number.parseInt(maxUsers, 10) || 1,
              }))
            }
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
          type="text"
          value={formData.slug}
          onChange={(event) =>
            onFormDataChange((current) => ({
              ...current,
              slug: event.target.value,
            }))
          }
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-gray-900 outline-none placeholder-gray-400 focus:ring-0 dark:text-white dark:placeholder-white/20"
          placeholder="acme"
        />
      </div>
    </div>
  )
}
