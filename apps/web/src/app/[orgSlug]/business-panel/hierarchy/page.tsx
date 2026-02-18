'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { HierarchyTree } from '@/features/business-panel/components/hierarchy/HierarchyTree';
import { HierarchySettings } from '@/features/business-panel/components/hierarchy/HierarchySettings';

export default function BusinessPanelHierarchyPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'settings' | 'tree'>('tree');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Tabs de navegación */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tree'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
          >
            Vista de Árbol
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
          >
            Configuración
          </button>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'settings' ? (
        <HierarchySettings />
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Estructura Organizacional
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Gestione la estructura jerárquica de su organización.
              </p>
            </div>
          </div>

          <HierarchyTree />
        </div>
      )}
    </motion.div>
  );
}
