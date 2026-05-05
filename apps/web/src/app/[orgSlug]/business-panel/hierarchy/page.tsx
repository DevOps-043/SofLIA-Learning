'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { HierarchyTree } from '@/features/business-panel/components/hierarchy/HierarchyTree';
import { HierarchySettings } from '@/features/business-panel/components/hierarchy/HierarchySettings';
import { Network, Settings, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Joyride from 'react-joyride';
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour';
import { getAdminHierarchySteps, ADMIN_HIERARCHY_TOUR_ID } from '@/features/tours/config/business-panel/admin-hierarchy-steps';

export default function BusinessPanelHierarchyPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'tree'>('tree');
  const { t } = useTranslation('business');
  
  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_HIERARCHY_TOUR_ID,
    steps: getAdminHierarchySteps(t),
  })
  
  // Design tokens aligned with the premium system
  const accentColor = '#10B981'; // Primary Aqua/Green

  return (
    <>
      {joyrideProps.run ? <Joyride {...joyrideProps} /> : null}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-8"
    >
      {/* Premium Header Section */}
      <div id="tour-hierarchy-header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-xl">
                <Network className="w-5 h-5 text-white" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 leading-none mb-1">Estructura</span>
                <h1 className="text-3xl font-black tracking-tight text-white leading-none">Jerarquía</h1>
             </div>
          </div>
          <p className="text-xs font-medium text-white/40 max-w-md">
            Gestiona los niveles organizacionales, equipos y regiones de tu empresa.
          </p>
        </div>

        {/* Premium Tab Bar */}
        <div id="tour-hierarchy-tabs" className="flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shrink-0">
          {[
            { id: 'tree', label: 'VISTA DE ÁRBOL', icon: LayoutGrid },
            { id: 'settings', label: 'CONFIGURACIÓN', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#0A2540] dark:bg-[#00D4B3] shadow-lg shadow-[#00D4B3]/20 !text-white dark:!text-black scale-100' 
                    : 'text-neutral-400 dark:text-white/30 hover:text-[#0A2540] dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5 scale-95'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? '!text-white dark:!text-black' : 'text-current'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Panel */}
      <div id="tour-hierarchy-content" className="px-4 pb-20">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="rounded-[2.5rem] border overflow-hidden shadow-2xl bg-white dark:bg-[#1E2329] border-neutral-200 dark:border-white/5"
         >
          {activeTab === 'settings' ? (
            <div className="p-8 lg:p-12">
              <HierarchySettings />
            </div>
          ) : (
            <div className="p-8 lg:p-12">
               <HierarchyTree />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
    </>
  );
}
