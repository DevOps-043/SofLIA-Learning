'use client'

import React from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card } from './shared'

function NotificationsSection({ company }: { company: CompanyData }) {
    return (
        <SectionWrapper>
            <Card
                title="Preferencias de Notificaciones"
                description="Configura cómo y cuándo enviar notificaciones"
                icon={BellIcon}
                iconColor={colors.warning}
            >
                <div className="text-center py-12">
                    <BellIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Configuración de notificaciones próximamente
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// CERTIFICATES SECTION
// ============================================

export { NotificationsSection }
