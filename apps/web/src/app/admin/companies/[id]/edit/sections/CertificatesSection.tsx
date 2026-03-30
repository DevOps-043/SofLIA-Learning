'use client'

import React from 'react'
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card } from './shared'

function CertificatesSection({ company }: { company: CompanyData }) {
    return (
        <SectionWrapper>
            <Card
                title="Plantillas de Certificados"
                description="Diseña las plantillas para los certificados"
                icon={DocumentTextIcon}
                iconColor="#06B6D4"
                actions={
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Nueva plantilla
                    </motion.button>
                }
            >
                <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Diseñador de certificados próximamente
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}


// ============================================
// MAIN COMPONENT
// ============================================

export { CertificatesSection }
