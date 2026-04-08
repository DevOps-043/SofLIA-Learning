import React, { useState } from 'react';
import { OrganizationNode } from '../../types/dynamicHierarchy.types';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Edit3,
    Trash2,
    MapPin,
    Users,
    Building2,
    Folder,
    Hash,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeItemProps {
    node: OrganizationNode;
    level: number;
    onExpand?: (node: OrganizationNode) => void;
    onCollapse?: (node: OrganizationNode) => void;
    onEdit?: (node: OrganizationNode) => void;
    onDelete?: (node: OrganizationNode) => void;
    onAddChild?: (parentNode: OrganizationNode) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({
    node,
    level,
    onExpand,
    onCollapse,
    onAddChild,
    onEdit,
    onDelete
}) => {
    const params = useParams();
    const [isExpanded, setIsExpanded] = useState(level === 0); // Root expanded by default

    const handleToggle = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (newState && onExpand) onExpand(node);
        if (!newState && onCollapse) onCollapse(node);
    };

    // Premium styling constants
    const indentSize = 32;
    const paddingLeft = level * indentSize;

    const getIcon = () => {
        const size = 18;
        switch (node.type) {
            case 'root': return <Building2 size={size} className="text-[#10B981]" />;
            case 'region': return <MapPin size={size} className="text-blue-400" />;
            case 'zone': return <Hash size={size} className="text-purple-400" />;
            case 'team': return <Users size={size} className="text-amber-400" />;
            default: return <Folder size={size} className="text-white/20" />;
        }
    };

    return (
        <div className="flex flex-col">
            <div
                className={`group flex items-center py-2 px-4 rounded-2xl transition-all duration-300 relative ${
                    isExpanded && level === 0 ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'
                }`}
                style={{ marginLeft: `${paddingLeft}px` }}
            >
                {/* Vertical Guide Line for nested levels */}
                {level > 0 && (
                    <div 
                        className="absolute top-0 bottom-0 -left-[16px] w-px bg-white/10 group-hover:bg-white/20 transition-colors"
                    />
                )}

                {/* Expansion Toggle */}
                <button
                    onClick={handleToggle}
                    className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all ${
                        isExpanded ? 'text-[#10B981]' : 'text-white/20 hover:text-white/50'
                    }`}
                >
                    {node.children && node.children.length > 0 ? (
                        isExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                    )}
                </button>

                {/* Node Identity Card */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-white/20 transition-all ${isExpanded && 'shadow-lg border-[#10B981]/20'}`}>
                        {getIcon()}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/${params?.orgSlug}/business-panel/hierarchy/node/${node.id}`}
                                className="text-sm font-black text-white hover:text-[#10B981] transition-colors truncate tracking-tight"
                            >
                                {node.name}
                            </Link>
                            {node.code && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-lg border border-[#10B981]/20">
                                    {node.code}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] font-medium text-white/30 truncate">
                            <span className="uppercase tracking-[0.1em] font-black">{node.type}</span>
                            {node.manager && (
                                <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                                    <User size={10} className="text-[#10B981]" />
                                    <span className="truncate">Lider: {node.manager.first_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                                <Users size={10} />
                                <span>{node.members_count || 0} miembros</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contextual Actions (Hover only) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <button
                        onClick={() => onAddChild && onAddChild(node)}
                        className="p-2 text-white/40 hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-xl transition-all"
                        title="Agregar Sub-nivel"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => onEdit && onEdit(node)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Editar"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete && onDelete(node)}
                        className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Recursion for Children */}
            <AnimatePresence>
                {isExpanded && node.children && node.children.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden flex flex-col pt-1"
                    >
                        {node.children.map(child => (
                            <NodeItem
                                key={child.id}
                                node={child}
                                level={level + 1}
                                onExpand={onExpand}
                                onCollapse={onCollapse}
                                onAddChild={onAddChild}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nested Empty State */}
            {isExpanded && (!node.children || node.children.length === 0) && (
                <div className="py-2 opacity-20 flex items-center gap-3" style={{ marginLeft: `${paddingLeft + indentSize + 12}px` }}>
                    <div className="w-4 h-px bg-current shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Nivel Terminal</span>
                </div>
            )}
        </div>
    );
};
