'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { HeatmapFooter } from './HeatmapFooter';
import { HeatmapHeader } from './HeatmapHeader';
import { HeatmapTabs } from './HeatmapTabs';
import { LoadingState } from './LoadingState';
import { OverviewTab } from './OverviewTab';
import { QuestionsTab } from './QuestionsTab';
import { SummaryStats } from './SummaryStats';
import { UsersTab } from './UsersTab';
import { useHourDetailData } from './useHourDetailData';
import type { HeatmapDetailModalProps, HeatmapTabId } from './types';

export function HeatmapDetailModal(props: HeatmapDetailModalProps) {
  const { isOpen, onClose, dayOfWeek, hour, period } = props;
  const [activeTab, setActiveTab] = useState<HeatmapTabId>('overview');
  const { data, isLoading } = useHourDetailData({ dayOfWeek, hour, isOpen, period });

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-800">
                <HeatmapHeader data={data} onClose={onClose} />
                {isLoading ? <LoadingState /> : data ? <HeatmapContent activeTab={activeTab} data={data} onTabChange={setActiveTab} /> : <EmptyState />}
                <HeatmapFooter onClose={onClose} period={period} />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function HeatmapContent({
  activeTab,
  data,
  onTabChange,
}: {
  activeTab: HeatmapTabId;
  data: NonNullable<ReturnType<typeof useHourDetailData>['data']>;
  onTabChange: (tab: HeatmapTabId) => void;
}) {
  return (
    <div className="p-6">
      <SummaryStats summary={data.summary} />
      <HeatmapTabs activeTab={activeTab} onChange={onTabChange} />
      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'users' && <UsersTab users={data.topUsers} />}
        {activeTab === 'questions' && <QuestionsTab questions={data.topQuestions} />}
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="p-8 text-center text-gray-500">No se pudieron cargar los datos</div>;
}
