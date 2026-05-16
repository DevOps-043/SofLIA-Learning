'use client'

import type { Dispatch, SetStateAction } from 'react'
import { BoltIcon, BuildingOffice2Icon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { CompanyGeneralInput } from './CompanyGeneralInput'
import { CompanyGeneralPlanSelect } from './CompanyGeneralPlanSelect'
import { CompanyGeneralSectionTitle } from './CompanyGeneralSectionTitle'
import { CompanyGeneralToggle } from './CompanyGeneralToggle'
import { type CompanyFormData } from './company-form.constants'

interface CompanyGeneralSectionsProps {
  formData: CompanyFormData
  isPlanOpen: boolean
  setIsPlanOpen: (open: boolean) => void
  setFormData: Dispatch<SetStateAction<CompanyFormData>>
}

export function CompanyGeneralSections(props: CompanyGeneralSectionsProps) {
  return (
    <>
      <section className="space-y-5"><CompanyGeneralSectionTitle icon={BuildingOffice2Icon} title="Informacion Basica" /><div className="grid grid-cols-1 gap-5"><CompanyGeneralInput label="Nombre de la empresa" value={props.formData.name} placeholder="Ej. Acme Corp" onChange={(value) => props.setFormData({ ...props.formData, name: value })} /><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><CompanyGeneralSlugField formData={props.formData} setFormData={props.setFormData} /><CompanyGeneralToggle label="Estado" activeLabel="Cuenta Activa" inactiveLabel="Cuenta Pausada" value={props.formData.is_active} onToggle={() => props.setFormData({ ...props.formData, is_active: !props.formData.is_active })} /></div><div><label className="mb-2 ml-1 block text-xs font-medium text-gray-400">Descripcion</label><textarea rows={3} value={props.formData.description} onChange={(e) => props.setFormData({ ...props.formData, description: e.target.value })} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all placeholder-white/20 focus:border-white/20" placeholder="Breve descripcion de la empresa..." /></div></div></section>
      <section className="space-y-5"><CompanyGeneralSectionTitle icon={EnvelopeIcon} title="Contacto" /><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><CompanyGeneralInput label="Email de Contacto" type="email" value={props.formData.contact_email} onChange={(value) => props.setFormData({ ...props.formData, contact_email: value })} /><CompanyGeneralInput label="Telefono" type="tel" value={props.formData.contact_phone} onChange={(value) => props.setFormData({ ...props.formData, contact_phone: value })} /><div className="md:col-span-2"><CompanyGeneralInput label="Sitio Web" type="url" value={props.formData.website_url} placeholder="https://" onChange={(value) => props.setFormData({ ...props.formData, website_url: value })} /></div></div></section>
      <section className="space-y-5"><CompanyGeneralSectionTitle icon={BoltIcon} title="Suscripcion" /><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><CompanyGeneralPlanSelect formData={props.formData} isOpen={props.isPlanOpen} onOpenChange={props.setIsPlanOpen} onChange={(value) => props.setFormData({ ...props.formData, subscription_plan: value })} /><CompanyGeneralInput label="Usuarios Maximos" type="number" value={props.formData.max_users} onChange={(value) => props.setFormData({ ...props.formData, max_users: parseInt(value) || 1 })} /></div></section>
    </>
  )
}

function CompanyGeneralSlugField(props: { formData: CompanyFormData; setFormData: Dispatch<SetStateAction<CompanyFormData>> }) {
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs font-medium text-gray-400">Slug (URL)</label>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20">
        <span className="mr-1 select-none text-sm text-gray-500">app.SOFLIA.com/</span>
        <input type="text" value={props.formData.slug} onChange={(e) => props.setFormData({ ...props.formData, slug: e.target.value })} className="flex-1 border-none bg-transparent p-0 text-white outline-none placeholder-white/20 focus:ring-0" placeholder="acme" />
      </div>
    </div>
  )
}
