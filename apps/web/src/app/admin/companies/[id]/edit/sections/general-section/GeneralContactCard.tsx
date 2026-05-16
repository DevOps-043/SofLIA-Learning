'use client'

import { EnvelopeIcon, GlobeAltIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { Card, colors, InputField } from '../shared'
import type { GeneralSectionProps } from './types'

export function GeneralContactCard({ company, setCompany }: GeneralSectionProps) {
  return (
    <Card title="Información de Contacto" description="Datos de contacto de la empresa" icon={EnvelopeIcon} iconColor={colors.blue}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField
          label="Email de contacto"
          value={company.contact_email || ''}
          onChange={(value) => setCompany({ ...company, contact_email: value })}
          type="email"
          placeholder="contacto@empresa.com"
          icon={EnvelopeIcon}
        />
        <InputField
          label="Teléfono"
          value={company.contact_phone || ''}
          onChange={(value) => setCompany({ ...company, contact_phone: value })}
          type="tel"
          placeholder="+52 55 1234 5678"
          icon={PhoneIcon}
        />
      </div>
      <div className="mt-4">
        <InputField
          label="Sitio web"
          value={company.website_url || ''}
          onChange={(value) => setCompany({ ...company, website_url: value })}
          type="url"
          placeholder="https://www.empresa.com"
          icon={GlobeAltIcon}
        />
      </div>
    </Card>
  )
}
