import { Plus, Layout, Settings, ChevronRight, ChevronDown, UserPlus, Network } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicHierarchyService } from '../../services/dynamicHierarchy.service';
import { OrganizationNode, OrganizationStructure } from '../../types/dynamicHierarchy.types';
import { NodeItem } from './NodeItem';
import { StructureForm } from './StructureForm';
import { NodeForm } from './NodeForm';
import { MemberAssignmentModal } from './MemberAssignmentModal';

interface HierarchyTreeProps {
  initialStructureId?: string;
}

// Helper to reconstruct tree from flat list
const buildTreeFromFlat = (nodes: OrganizationNode[]): OrganizationNode[] => {
  const map = new Map<string, OrganizationNode>();
  const roots: OrganizationNode[] = [];

  // First pass: create copies to avoid mutation issues and map them
  nodes.forEach(node => {
    map.set(node.id, { ...node, children: [] });
  });

  // Second pass: link children
  nodes.forEach(node => {
    const nodeWithChildren = map.get(node.id)!;
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(nodeWithChildren);
    } else {
      roots.push(nodeWithChildren);
    }
  });

  return roots;
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ initialStructureId }) => {
  const { t } = useTranslation('business');
  const { t: tc } = useTranslation('common');
  const [structures, setStructures] = useState<OrganizationStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(initialStructureId || null);
  const [nodes, setNodes] = useState<OrganizationNode[]>([]); // Flat nodes
  const [treeRoots, setTreeRoots] = useState<OrganizationNode[]>([]); // Tree structure
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<OrganizationNode | null>(null);
  const [nodeActionError, setNodeActionError] = useState<string | null>(null);

  // Member Assignment Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberModalNodeId, setMemberModalNodeId] = useState<string | null>(null);
  const [memberModalNodeName, setMemberModalNodeName] = useState<string>('');

  // Node Modal State
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeModalMode, setNodeModalMode] = useState<'create' | 'edit'>('create');
  const [targetNode, setTargetNode] = useState<OrganizationNode | undefined>(undefined); // Parent for create, Target for edit

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initial Load: Fetch Structures
  useEffect(() => {
    loadStructures();
  }, []);

  // On Structure Change: Fetch Nodes
  useEffect(() => {
    if (selectedStructureId) {
      loadNodes(selectedStructureId);
    }
  }, [selectedStructureId]);

  const loadStructures = async () => {
    try {
      const data = await DynamicHierarchyService.getStructures();
      setStructures(data);
      if (data.length > 0 && !selectedStructureId) {
        // Select default or first
        const def = data.find(s => s.is_default) || data[0];
        setSelectedStructureId(def.id);
      }
    } catch (err) {
      setError(t('hierarchy.loadStructuresError'));
      console.error(err);
    }
  };

  const loadNodes = async (structureId: string) => {
    setIsLoading(true);
    try {
      const data = await DynamicHierarchyService.getTree(structureId);
      setNodes(data);
      const builtTree = buildTreeFromFlat(data);
      setTreeRoots(builtTree);
    } catch (err) {
      setError(t('hierarchy.loadHierarchyError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleAddChild = (parentNode: OrganizationNode) => {
    setTargetNode(parentNode);
    setNodeModalMode('create');
    setShowNodeModal(true);
  };

  const handleEdit = (node: OrganizationNode) => {
    setTargetNode(node);
    setNodeModalMode('edit');
    setShowNodeModal(true);
  };

  const handleNodeSave = async (name: string, type: string, properties?: Record<string, any>, managerId?: string) => {
    if (!selectedStructureId) return;

    try {
      if (nodeModalMode === 'create' && targetNode) {
        // Create
        await DynamicHierarchyService.createNode({
          structure_id: selectedStructureId,
          parent_id: targetNode.id,
          name,
          type,
          properties,
          manager_id: managerId
        });
      } else if (nodeModalMode === 'edit' && targetNode) {
        // Edit
        await DynamicHierarchyService.updateNode(targetNode.id, {
          name,
          type,
          properties,
          manager_id: managerId
        });
      } else if (nodeModalMode === 'create' && !targetNode) {
        // Create root
        await DynamicHierarchyService.createNode({
          structure_id: selectedStructureId,
          parent_id: null,
          name,
          type,
          properties,
          manager_id: managerId
        });
      }

      await loadNodes(selectedStructureId); // Reload tree
      setShowNodeModal(false);
    } catch (err) {
      console.error(err);
      setNodeActionError(t('hierarchy.saveNodeError'));
    }
  };

  const handleDelete = (node: OrganizationNode) => {
    setNodeActionError(null);
    setPendingDeleteNode(node);
  };

  const handleConfirmDeleteNode = () => {
    if (!pendingDeleteNode) return;
    const node = pendingDeleteNode;
    setPendingDeleteNode(null);
    DynamicHierarchyService.deleteNode(node.id)
      .then(res => {
        if (res.success) loadNodes(selectedStructureId!);
      })
      .catch(err => {
        console.error(err);
      });
  };

  // Helper to handle new structure creation
  const handleNewStructure = () => {
    setShowStructureModal(true);
  };

  const handleSaveStructure = async (name: string) => {
    try {
      const res = await DynamicHierarchyService.createStructure(name);
      if (res.success) {
        loadStructures();
      } else {
        setNodeActionError(t('hierarchy.saveStructureError') + (res.error ? ': ' + res.error : ''));
      }
    } catch (err) {
      setNodeActionError(t('hierarchy.saveStructureError'));
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 min-h-[500px]">
      {/* Structure Selector and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-white/5">
        <div className="space-y-4 flex-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">
            {t('hierarchy.activeStructure')}
          </label>
          
          {/* SofLIA Premium Dropdown */}
          <div className="relative min-w-[280px] max-w-xs group">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all duration-300 active:scale-[0.98] h-[58px]"
              style={{
                backgroundColor: "var(--dropdown-bg, transparent)",
                borderColor: isDropdownOpen ? "var(--accent-color, #0A2540)" : "var(--border-color, rgba(0,0,0,0.1))",
                boxShadow: isDropdownOpen ? "0 0 20px rgba(0,212,179,0.15)" : "none"
              }}
            >
              <style jsx>{`
                button {
                  --dropdown-bg: #f8fafc;
                  --border-color: #e2e8f0;
                  --accent-color: #0A2540;
                }
                :global(.dark) button {
                  --dropdown-bg: #1E2329;
                  --border-color: rgba(255,255,255,0.1);
                  --accent-color: #00D4B3;
                }
              `}</style>
              <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
              <span className="text-sm font-bold text-[#0A2540] dark:text-white truncate">
                {structures.find(s => s.id === selectedStructureId)?.name || t('hierarchy.selectStructure')}
                {structures.find(s => s.id === selectedStructureId)?.is_default ? ` ${t('hierarchy.defaultBadge')}` : ''}
              </span>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-500 dark:text-white/30 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 opacity-100' : 'rotate-0'}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div 
                  className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1E2329] shadow-2xl overflow-hidden z-50 py-2 backdrop-blur-3xl"
                  style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                >
                  {structures.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStructureId(s.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-5 py-3.5 text-left text-sm font-bold transition-all flex items-center justify-between gap-3 ${
                        selectedStructureId === s.id 
                          ? 'bg-blue-500/5 dark:bg-[#00D4B3]/10 text-[#0A2540] dark:text-[#00D4B3]' 
                          : 'text-neutral-600 dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{s.name} {s.is_default ? t('hierarchy.defaultBadge') : ''}</span>
                      {selectedStructureId === s.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0A2540] dark:bg-[#00D4B3]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <button
            onClick={async () => {
              if (!selectedStructureId) return;
              let rootNode = nodes.find(n => !n.parent_id);
              if (!rootNode && selectedStructureId) {
                try {
                  const fetchedNodes = await DynamicHierarchyService.getTree(selectedStructureId);
                  rootNode = fetchedNodes.find(n => !n.parent_id);
                } catch (e) {
                  console.error("Error finding root node", e);
                }
              }
              if (rootNode) {
                setMemberModalNodeId(rootNode.id);
                setMemberModalNodeName(rootNode.name);
                setIsMemberModalOpen(true);
              } else {
                setNodeActionError(t('hierarchy.noRootNode'));
              }
            }}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-[#0A2540] dark:text-white shadow-xl h-[58px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('hierarchy.members')}</span>
          </button>

          <button
            onClick={handleNewStructure}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl transition-all hover:brightness-110 active:scale-95 text-[10px] font-black uppercase tracking-widest h-[58px] bg-[#0A2540] dark:bg-none !text-white dark:!text-[#0A2540]"
            style={{
              background: "var(--btn-bg)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)"
            }}
          >
            <style jsx>{`
               button {
                 --btn-bg: #0A2540 !important;
               }
               :global(.dark) button {
                 --btn-bg: linear-gradient(135deg, #00D4B3, #10B981) !important;
               }
            `}</style>
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>{t('hierarchy.newStructure')}</span>
          </button>
        </div>
      </div>

      {/* Confirmaciones y errores inline */}
      {pendingDeleteNode && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-400">{t('hierarchy.confirmDeleteNode', { name: pendingDeleteNode.name })}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setPendingDeleteNode(null)} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{tc('actions.cancel')}</button>
            <button onClick={handleConfirmDeleteNode} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{tc('actions.delete')}</button>
          </div>
        </div>
      )}
      {nodeActionError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{nodeActionError}</p>
        </div>
      )}

      {/* Tree Visualizer */}
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 opacity-30">
            <div className="w-10 h-10 border-4 border-neutral-200 dark:border-white/10 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0A2540] dark:text-white">{t('hierarchy.syncing')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
             <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
                <Settings className="w-8 h-8 text-red-500" />
             </div>
             <span className="text-sm font-bold text-red-500 block">{error}</span>
          </div>
        ) : treeRoots.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
               <Network className="w-12 h-12 text-neutral-300 dark:text-white/10" />
            </div>
            <div className="space-y-3">
               <h3 className="text-xl font-black text-[#0A2540] dark:text-white italic tracking-tight uppercase">{t('hierarchy.emptyStructureTitle')}</h3>
               <p className="text-xs font-semibold text-neutral-400 dark:text-white/30 max-w-xs mx-auto uppercase tracking-wide leading-relaxed">
                  {t('hierarchy.emptyStructureDesc')}
               </p>
            </div>
            <button
              onClick={() => {
                if (!selectedStructureId) return;
                DynamicHierarchyService.createNode({
                  structure_id: selectedStructureId,
                  name: 'General',
                  type: 'root',
                  parent_id: null
                }).then(() => loadNodes(selectedStructureId));
              }}
              className="px-8 py-4 rounded-2xl !text-white dark:!text-[#0A2540] text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 bg-[#0A2540] dark:bg-[#00D4B3]"
            >
              {t('hierarchy.initializeGeneral')}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {treeRoots.map(root => (
              <NodeItem
                key={root.id}
                node={root}
                level={0}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <StructureForm
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        onSave={handleSaveStructure}
      />

      <NodeForm
        isOpen={showNodeModal}
        onClose={() => setShowNodeModal(false)}
        onSave={handleNodeSave}
        mode={nodeModalMode}
        parentNode={nodeModalMode === 'create' ? targetNode : undefined}
        nodeToEdit={nodeModalMode === 'edit' ? targetNode : undefined}
      />

      {isMemberModalOpen && memberModalNodeId && (
        <MemberAssignmentModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          nodeId={memberModalNodeId}
          nodeName={memberModalNodeName}
          onSuccess={() => {
            // Refresh if needed
          }}
        />
      )}
    </div>
  );
};
